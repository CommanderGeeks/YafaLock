// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YafaLock is ReentrancyGuard, Ownable(msg.sender) {
    IERC20 public immutable token;
    IERC20 public immutable usdt;
    address public immutable projectAddress;
    uint256 public remainingVestedPeople;
    
    struct VestingInfo {
        uint256 totalAmount;
        uint256 initialLockTime;
        uint256 initialLockDuration;
        uint256 monthsVested;
        uint256 monthsClaimed;
        uint256 totalClaimed;
        uint256 tokensVested;
        uint256 tokensOTCed;
        uint256 totalUsdtReceived;
        uint256 totalPendingTokens;
        bool established;
        bool initialized;
    }

    //Community Member places OTC offer to the project
    struct CommunityMemberOTCOffer {
        address offerer;
        uint256 usdtAmount;
        uint256 tokenAmount;
        bool active;
    }

    //Yafa places public OTC offer to entire community
    struct PublicOTCOffer {
        uint256 totalUsdtAmount;
        uint256 totalTokenAmount;
        uint256 remainingUsdtAmount;
        uint256 remainingTokenAmount;
        uint256 offerDuration;
        uint256 offerStartTime;
        bool active;
    }

    //Yafa places private OTC offer to a single individual
    struct PrivateOTCOffer {
        address recipient;
        uint256 usdtAmount;
        uint256 tokenAmount;
        uint256 offerDuration;
        uint256 offerStartTime;
        bool active;
    }
    
    mapping(address => VestingInfo) public vestingInfo;
    mapping(address => CommunityMemberOTCOffer) public communityMemberOffers;
    PublicOTCOffer public publicOffer; // Single public offer
    mapping(address => PrivateOTCOffer) private privateOffers;

    event TokensLocked(address indexed user, uint256 amount, uint256 timestamp);
    event TokensClaimed(address indexed user, uint256 amount, uint256 monthsClaimed);
    event CommunityMemberOfferCreated(address indexed user, uint256 usdtAmount, uint256 tokenAmount);
    event CommunityMemberOfferAccepted(address indexed user, uint256 usdtAmount, uint256 tokenAmount, uint256 percentage);
    event PublicOfferCreated(uint256 totalUsdtAmount, uint256 totalTokenAmount, uint256 duration);
    event PublicOfferAccepted(address indexed user, uint256 usdtAmount, uint256 tokenAmount, uint256 percentage);
    event PublicOfferRevoked(uint256 refundedUsdt, uint256 refundedTokens);
    event OfferExpired(string offerType);
    
    constructor(
        address _token,
        address _usdt
    ) {
        require(_token != address(0), "Invalid token address");
        require(_usdt != address(0), "Invalid USDT address");
        
        token = IERC20(_token);
        usdt = IERC20(_usdt);
        projectAddress = msg.sender; // Initialize project address as deployer
    }

    function initializeLocks(
        address[] calldata addys, 
        uint256[] calldata tokenAmts, 
        uint256[] calldata initialLocks,
        uint256[] calldata monthsVested
        ) external onlyOwner {
           
            require(addys.length == tokenAmts.length && 
            tokenAmts.length == initialLocks.length && 
            initialLocks.length == monthsVested.length, 
            "length mismatch");

            uint256 len = addys.length;

            for (uint256 i = 0; i < len; i++) {
                require(addys[i] != address(0), "invalid address");
                require(!vestingInfo[addys[i]].initialized, "already initialized");
                
                vestingInfo[addys[i]] = VestingInfo({
                    totalAmount: tokenAmts[i],
                    initialLockTime: 0,
                    initialLockDuration: initialLocks[i],
                    monthsVested: monthsVested[i],
                    monthsClaimed: 0,
                    totalClaimed: 0,
                    tokensVested: 0,
                    tokensOTCed: 0,
                    totalUsdtReceived: 0,
                    totalPendingTokens: tokenAmts[i],
                    established: true,
                    initialized: false
                });
            }
    }

    function lock() external nonReentrant {
        VestingInfo storage info = vestingInfo[msg.sender];
    
        require(info.established, "vesting not established");
        require(!info.initialized, "already initialized");
        require(info.totalAmount > 0, "no tokens to lock");
        
        // Transfer tokens from user to contract
        require(
            token.transferFrom(msg.sender, address(this), info.totalAmount),
            "token transfer failed"
        );
        
        // Set the initial lock time and mark as initialized
        info.initialLockTime = block.timestamp;
        info.initialized = true;
        
        emit TokensLocked(msg.sender, info.totalAmount, block.timestamp);
    }

    function claimVestedTokens() external nonReentrant {
        VestingInfo storage info = vestingInfo[msg.sender];
        require(info.initialized, "not initialized");
        require(info.totalClaimed < info.totalAmount, "all tokens claimed");

        // Check if initial lock period has passed
        require(
            block.timestamp >= info.initialLockTime + info.initialLockDuration,
            "initial lock period not over"
        );

        // Calculate months elapsed since initial lock ended
        uint256 lockEndTime = info.initialLockTime + info.initialLockDuration;
        uint256 monthsElapsed = (block.timestamp - lockEndTime) / 30 days;
        
        // Can't claim beyond total vesting period
        if (monthsElapsed > info.monthsVested) {
            monthsElapsed = info.monthsVested;
        }
        
        // Calculate claimable months (months elapsed minus already claimed)
        uint256 claimableMonths = monthsElapsed - info.monthsClaimed;
        require(claimableMonths > 0, "no tokens to claim yet");
        
        // Calculate base amount after OTC sales
        uint256 baseAmount = info.totalAmount - info.tokensOTCed;
        
        // Calculate monthly allowance based on remaining base amount
        uint256 monthlyAllowance = baseAmount / info.monthsVested;
        
        // Calculate tokens to claim
        uint256 tokensToClaim = claimableMonths * monthlyAllowance;
        
        // Handle final month rounding
        if (info.monthsClaimed + claimableMonths >= info.monthsVested) {
            // On final claim, give all remaining tokens
            tokensToClaim = baseAmount - info.totalClaimed;
        }
        
        // Ensure we don't exceed limits
        require(tokensToClaim > 0, "no tokens available");
        require(info.totalClaimed + tokensToClaim <= baseAmount, "exceeds available balance");
        
        // Update state
        info.monthsClaimed += claimableMonths;
        info.totalClaimed += tokensToClaim;
        info.tokensVested += tokensToClaim;
        info.totalPendingTokens -= tokensToClaim;
        
        // Transfer tokens
        require(token.transfer(msg.sender, tokensToClaim), "transfer failed");
        
        emit TokensClaimed(msg.sender, tokensToClaim, claimableMonths);
    }

    function communityMemberOTCOffer(uint256 _usdtAmt, uint256 _tokenAmt) external nonReentrant {
        require(_tokenAmt > 0, "Token amount must be greater than 0");
        require(_usdtAmt > 0, "USDT amount must be greater than 0");

        VestingInfo storage info = vestingInfo[msg.sender];

        require(info.initialized, "Vesting not initialized");
        require(info.totalAmount - info.totalClaimed >= _tokenAmt, "not enough tokens to place this offer");
        
        CommunityMemberOTCOffer storage offer = communityMemberOffers[msg.sender];

        offer.offerer = msg.sender;
        offer.usdtAmount = _usdtAmt;
        offer.tokenAmount = _tokenAmt;
        offer.active = true;

        emit CommunityMemberOfferCreated(msg.sender, _usdtAmt, _tokenAmt);
    }

    function acceptCommunityMemberOTCOffer(address _user, uint256 _percentage) external nonReentrant onlyOwner {
        require(_user != address(0), "Invalid user address");
        require(_percentage > 0 && _percentage <= 100, "Percentage must be between 1-100");

        CommunityMemberOTCOffer storage offer = communityMemberOffers[_user];
        VestingInfo storage info = vestingInfo[_user];

        require(offer.active, "No active offer from this user");
        require(offer.offerer == _user, "Offer mismatch");
        require(info.initialized, "User vesting not initialized");

        // Calculate the actual amounts based on percentage
        uint256 usdtToTransfer = (offer.usdtAmount * _percentage) / 100;
        uint256 tokensToTransfer = (offer.tokenAmount * _percentage) / 100;

        // Validate sufficient tokens are available (not yet claimed or OTCed)
        uint256 availableTokens = info.totalAmount - info.totalClaimed - info.tokensOTCed;
        require(availableTokens >= tokensToTransfer, "Insufficient available tokens");

        // Transfer USDT from contract to the vested individual
        require(
            usdt.transferFrom(address(this), _user, usdtToTransfer),
            "USDT transfer to user failed"
        );

        // Transfer tokens from contract to the project (owner)
        require(
            token.transfer(owner(), tokensToTransfer),
            "Token transfer to project failed"
        );

        // Update vesting info
        info.tokensOTCed += tokensToTransfer;
        info.totalUsdtReceived += usdtToTransfer;
        info.totalPendingTokens -= tokensToTransfer;

        // If 100% of offer was accepted, deactivate the offer
        if (_percentage == 100) {
            offer.active = false;
        } else {
            // Reduce the offer amounts by the accepted percentage
            offer.usdtAmount -= usdtToTransfer;
            offer.tokenAmount -= tokensToTransfer;
        }

        emit CommunityMemberOfferAccepted(_user, usdtToTransfer, tokensToTransfer, _percentage);
    }
    
    function revokeCommunityMemberOTCOffer() external nonReentrant {
        CommunityMemberOTCOffer storage offer = communityMemberOffers[msg.sender];
        require(offer.active, "No active offer to revoke");
        
        // Reset all values to 0
        offer.offerer = address(0);
        offer.usdtAmount = 0;
        offer.tokenAmount = 0;
        offer.active = false;
    }

    function publicOTCOffer(uint256 _usdtAmt, uint256 _tokenAmt, uint256 _duration) external onlyOwner nonReentrant {
        require(_tokenAmt > 0, "Token amount must be greater than 0");
        require(_usdtAmt > 0, "USDT amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(!publicOffer.active, "Public offer already active");

        // Transfer USDT from project to contract to make it available for claims
        require(
            usdt.transferFrom(msg.sender, address(this), _usdtAmt),
            "USDT transfer to contract failed"
        );
        
        publicOffer.totalUsdtAmount = _usdtAmt;
        publicOffer.totalTokenAmount = _tokenAmt;
        publicOffer.remainingUsdtAmount = _usdtAmt;
        publicOffer.remainingTokenAmount = _tokenAmt;
        publicOffer.offerDuration = _duration;
        publicOffer.offerStartTime = block.timestamp;
        publicOffer.active = true;

        emit PublicOfferCreated(_usdtAmt, _tokenAmt, _duration);
    }

    function revokePublicOTC() external onlyOwner nonReentrant {
        require(publicOffer.active, "No active public offer to revoke");

        uint256 refundUsdt = publicOffer.remainingUsdtAmount;
        uint256 refundTokens = publicOffer.remainingTokenAmount;

        // Refund remaining USDT to project
        if (refundUsdt > 0) {
            require(
                usdt.transfer(projectAddress, refundUsdt),
                "USDT refund failed"
            );
        }

        // Reset the public offer
        publicOffer.totalUsdtAmount = 0;
        publicOffer.totalTokenAmount = 0;
        publicOffer.remainingUsdtAmount = 0;
        publicOffer.remainingTokenAmount = 0;
        publicOffer.offerDuration = 0;
        publicOffer.offerStartTime = 0;
        publicOffer.active = false;

        emit PublicOfferRevoked(refundUsdt, refundTokens);
    }

    function acceptPublicOTC(uint256 _percentage) external nonReentrant {
        require(_percentage > 0 && _percentage <= 100, "Percentage must be between 1-100");
        require(publicOffer.active, "No active public offer");
        require(block.timestamp <= publicOffer.offerStartTime + publicOffer.offerDuration, "Offer expired");

        VestingInfo storage info = vestingInfo[msg.sender];
        require(info.initialized, "Vesting not initialized");

        // Calculate amounts based on percentage of remaining offer
        uint256 usdtToReceive = (publicOffer.remainingUsdtAmount * _percentage) / 100;
        uint256 tokensToGive = (publicOffer.remainingTokenAmount * _percentage) / 100;

        // Validate user has enough tokens available
        uint256 availableTokens = info.totalAmount - info.totalClaimed - info.tokensOTCed;
        require(availableTokens >= tokensToGive, "Insufficient available tokens");

        // Validate contract has enough USDT
        require(publicOffer.remainingUsdtAmount >= usdtToReceive, "Insufficient USDT in offer");

        // Transfer USDT from contract to user
        require(
            usdt.transfer(msg.sender, usdtToReceive),
            "USDT transfer to user failed"
        );

        // Transfer tokens from user's allocation to project
        require(
            token.transfer(projectAddress, tokensToGive),
            "Token transfer to project failed"
        );

        // Update user's vesting info
        info.tokensOTCed += tokensToGive;
        info.totalUsdtReceived += usdtToReceive;
        info.totalPendingTokens -= tokensToGive;

        // Update public offer remaining amounts
        publicOffer.remainingUsdtAmount -= usdtToReceive;
        publicOffer.remainingTokenAmount -= tokensToGive;

        // If offer is fully claimed, deactivate it
        if (publicOffer.remainingUsdtAmount == 0 || publicOffer.remainingTokenAmount == 0) {
            publicOffer.active = false;
        }

        emit PublicOfferAccepted(msg.sender, usdtToReceive, tokensToGive, _percentage);
    }

    function privateOTCOffer(address _recipient, uint256 _usdtAmt, uint256 _tokenAmt, uint256 _duration) external onlyOwner nonReentrant {
        require(_recipient != address(0), "Invalid recipient address");
        require(_tokenAmt > 0, "Token amount must be greater than 0");
        require(_usdtAmt > 0, "USDT amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        PrivateOTCOffer storage offer = privateOffers[_recipient];
        
        offer.recipient = _recipient;
        offer.usdtAmount = _usdtAmt;
        offer.tokenAmount = _tokenAmt;
        offer.offerDuration = _duration;
        offer.offerStartTime = block.timestamp;
        offer.active = true;
    }

    function acceptPrivateOTC() external nonReentrant {
        PrivateOTCOffer storage offer = privateOffers[msg.sender];
        
        require(offer.active, "No active private offer for you");
        require(offer.recipient == msg.sender, "Offer not for you");
        require(block.timestamp <= offer.offerStartTime + offer.offerDuration, "Offer expired");

        // Transfer USDT from user to contract
        require(
            usdt.transferFrom(msg.sender, address(this), offer.usdtAmount),
            "USDT transfer failed"
        );

        // Transfer tokens from contract to user
        require(
            token.transfer(msg.sender, offer.tokenAmount),
            "Token transfer failed"
        );

        // Deactivate offer after acceptance
        offer.active = false;
    }

    function revokePrivateOTC(address _recipient) external onlyOwner nonReentrant {
        PrivateOTCOffer storage offer = privateOffers[_recipient];
        require(offer.active, "No active offer to revoke");
        
        offer.active = false;
    }
    
    /**
     * @dev Get available tokens for a user (total amount minus claimed and OTCed)
     */
    function getUserAvailableTokens(address _user) public view returns (uint256) {
        VestingInfo storage info = vestingInfo[_user];
        return info.totalAmount - info.totalClaimed - info.tokensOTCed;
    }
    
    /**
     * @dev Get vesting status and details for a user
     */
    function getVestingStatus(address _user) external view returns (
        bool initialized,
        uint256 totalAmount,
        uint256 totalClaimed,
        uint256 tokensOTCed,
        uint256 totalUsdtReceived,
        uint256 availableTokens,
        uint256 monthsClaimed,
        uint256 monthsVested
    ) {
        VestingInfo storage info = vestingInfo[_user];
        
        initialized = info.initialized;
        totalAmount = info.totalAmount;
        totalClaimed = info.totalClaimed;
        tokensOTCed = info.tokensOTCed;
        totalUsdtReceived = info.totalUsdtReceived;
        availableTokens = getAvailableTokens(_user);
        monthsClaimed = info.monthsClaimed;
        monthsVested = info.monthsVested;
    }
    
    /**
     * @dev Get active public offer details
     */
    function getPublicOffer() external view returns (
        uint256 totalUsdtAmount,
        uint256 totalTokenAmount,
        uint256 remainingUsdtAmount,
        uint256 remainingTokenAmount,
        uint256 offerDuration,
        uint256 offerStartTime,
        uint256 timeRemaining,
        bool active,
        bool expired
    ) {
        totalUsdtAmount = publicOffer.totalUsdtAmount;
        totalTokenAmount = publicOffer.totalTokenAmount;
        remainingUsdtAmount = publicOffer.remainingUsdtAmount;
        remainingTokenAmount = publicOffer.remainingTokenAmount;
        offerDuration = publicOffer.offerDuration;
        offerStartTime = publicOffer.offerStartTime;
        
        uint256 endTime = offerStartTime + offerDuration;
        timeRemaining = endTime > block.timestamp ? endTime - block.timestamp : 0;
        active = publicOffer.active;
        expired = block.timestamp > endTime;
    }
    function getCommunityMemberOffer(address _user) external view returns (
        address offerer,
        uint256 usdtAmount,
        uint256 tokenAmount,
        bool active
    ) {
        CommunityMemberOTCOffer storage offer = communityMemberOffers[_user];
        
        offerer = offer.offerer;
        usdtAmount = offer.usdtAmount;
        tokenAmount = offer.tokenAmount;
        active = offer.active;
    }
    
    /**
     * @dev Get contract token balance
     */
    function getContractTokenBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @dev Get contract USDT balance
     */
    function getContractUSDTBalance() external view returns (uint256) {
        return usdt.balanceOf(address(this));
    }
}