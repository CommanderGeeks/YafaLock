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
    
    // Global OTC tracking
    uint256 public totalOTCUsdtSpent;
    uint256 public totalOTCTokensAcquired;
    
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
    event PrivateOfferCreated(address indexed recipient, uint256 usdtAmount, uint256 tokenAmount, uint256 duration);
    event PrivateOfferAccepted(address indexed user, uint256 usdtAmount, uint256 tokenAmount);
    
    constructor(address _token, address _usdt) {
        token = IERC20(_token);
        usdt = IERC20(_usdt);
        projectAddress = msg.sender;
    }

    function initializeLocks(
        address[] calldata _users,
        uint256[] calldata _amounts,
        uint256[] calldata _lockDurations,
        uint256[] calldata _monthsVested
    ) external onlyOwner {
        require(_users.length == _amounts.length, "Arrays length mismatch");
        require(_users.length == _lockDurations.length, "Arrays length mismatch");
        require(_users.length == _monthsVested.length, "Arrays length mismatch");
        
        uint256 totalTokensNeeded = 0;
        
        for (uint256 i = 0; i < _users.length; i++) {
            require(_amounts[i] > 0, "Amount must be greater than 0");
            require(_lockDurations[i] > 0, "Lock duration must be greater than 0");
            require(_monthsVested[i] > 0, "Months vested must be greater than 0");
            require(!vestingInfo[_users[i]].established, "User vesting already established");
            
            vestingInfo[_users[i]] = VestingInfo({
                totalAmount: _amounts[i],
                initialLockTime: 0,
                initialLockDuration: _lockDurations[i],
                monthsVested: _monthsVested[i],
                monthsClaimed: 0,
                totalClaimed: 0,
                tokensVested: 0,
                tokensOTCed: 0,
                totalUsdtReceived: 0,
                totalPendingTokens: _amounts[i],
                established: true,
                initialized: false
            });
            
            totalTokensNeeded += _amounts[i];
        }
        
        remainingVestedPeople += _users.length;
    }

    function lock() external {
        VestingInfo storage info = vestingInfo[msg.sender];
        require(info.established, "vesting not established");
        require(!info.initialized, "already locked");

         // Transfer tokens from user to contract for vesting
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
            // User has completed vesting, decrease remaining people count
            if (remainingVestedPeople > 0) {
                remainingVestedPeople--;
            }
        }
        
        // Ensure we don't exceed limits
        require(tokensToClaim > 0, "no tokens available");
        require(info.totalClaimed + tokensToClaim <= baseAmount, "exceeds available balance");
        
        // Update state
        info.monthsClaimed += claimableMonths;
        info.totalClaimed += tokensToClaim;
        info.tokensVested += tokensToClaim;
        info.totalPendingTokens -= tokensToClaim;
        
        // Transfer tokens to user
        require(token.transfer(msg.sender, tokensToClaim), "token transfer failed");
        
        emit TokensClaimed(msg.sender, tokensToClaim, info.monthsClaimed);
    }

    function communityMemberOTCOffer(uint256 _usdtAmt, uint256 _tokenAmt) external {
        require(_usdtAmt > 0, "USDT amount must be greater than 0");
        require(_tokenAmt > 0, "Token amount must be greater than 0");

        VestingInfo storage info = vestingInfo[msg.sender];
        require(info.initialized, "Vesting not initialized");

        uint256 availableTokens = getUserAvailableTokens(msg.sender);
        require(availableTokens >= _tokenAmt, "Insufficient available tokens");

        CommunityMemberOTCOffer storage offer = communityMemberOffers[msg.sender];
        require(!offer.active, "You already have an active offer");

        offer.offerer = msg.sender;
        offer.usdtAmount = _usdtAmt;
        offer.tokenAmount = _tokenAmt;
        offer.active = true;

        emit CommunityMemberOfferCreated(msg.sender, _usdtAmt, _tokenAmt);
    }

    function acceptCommunityMemberOTCOffer(address _user, uint256 _percentage) external onlyOwner nonReentrant {
        require(_percentage > 0 && _percentage <= 100, "Invalid percentage");
        
        CommunityMemberOTCOffer storage offer = communityMemberOffers[_user];
        VestingInfo storage info = vestingInfo[_user];
        
        require(offer.active, "No active offer");
        require(offer.offerer == _user, "Invalid offer");

        // Calculate partial amounts based on percentage
        uint256 usdtToPay = (offer.usdtAmount * _percentage) / 100;
        uint256 tokensToReceive = (offer.tokenAmount * _percentage) / 100;

        // Validate user still has enough tokens available
        uint256 availableTokens = getUserAvailableTokens(_user);
        require(availableTokens >= tokensToReceive, "User doesn't have enough available tokens");

        // Transfer USDT from project to user
        require(
            usdt.transferFrom(owner(), _user, usdtToPay),
            "USDT transfer failed"
        );

        // Transfer tokens from contract to project
        require(
            token.transfer(owner(), tokensToReceive),
            "Token transfer failed"
        );

        // Update user's vesting info
        info.tokensOTCed += tokensToReceive;
        info.totalUsdtReceived += usdtToPay;
        info.totalPendingTokens -= tokensToReceive;

        // Update global OTC tracking
        totalOTCUsdtSpent += usdtToPay;
        totalOTCTokensAcquired += tokensToReceive;

        // If partial acceptance, update offer amounts
        if (_percentage < 100) {
            offer.usdtAmount -= usdtToPay;
            offer.tokenAmount -= tokensToReceive;
        } else {
            // Full acceptance - deactivate offer
            offer.active = false;
        }

        emit CommunityMemberOfferAccepted(_user, usdtToPay, tokensToReceive, _percentage);
    }

    function revokeCommunityMemberOTCOffer() external {
        CommunityMemberOTCOffer storage offer = communityMemberOffers[msg.sender];
        require(offer.active, "No active offer to revoke");
        require(offer.offerer == msg.sender, "Not your offer");
        
        offer.active = false;
    }

    function publicOTCOffer(uint256 _usdtAmt, uint256 _tokenAmt, uint256 _duration) external onlyOwner {
        require(_usdtAmt > 0, "USDT amount must be greater than 0");
        require(_tokenAmt > 0, "Token amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(!publicOffer.active, "Public offer already active");

        // Transfer USDT from owner to contract for the offer
        require(
            usdt.transferFrom(msg.sender, address(this), _usdtAmt),
            "USDT transfer failed"
        );

        publicOffer = PublicOTCOffer({
            totalUsdtAmount: _usdtAmt,
            totalTokenAmount: _tokenAmt,
            remainingUsdtAmount: _usdtAmt,
            remainingTokenAmount: _tokenAmt,
            offerDuration: _duration,
            offerStartTime: block.timestamp,
            active: true
        });

        emit PublicOfferCreated(_usdtAmt, _tokenAmt, _duration);
    }

    function acceptPublicOTCOffer(uint256 _percentage) external nonReentrant {
        require(_percentage > 0 && _percentage <= 100, "Invalid percentage");
        require(publicOffer.active, "No active public offer");
        require(block.timestamp <= publicOffer.offerStartTime + publicOffer.offerDuration, "Offer expired");

        VestingInfo storage info = vestingInfo[msg.sender];
        require(info.initialized, "Vesting not initialized");

        // Calculate amounts based on percentage
        uint256 usdtToReceive = (publicOffer.remainingUsdtAmount * _percentage) / 100;
        uint256 tokensToGive = (publicOffer.remainingTokenAmount * _percentage) / 100;

        // Validate user has enough tokens available
        uint256 availableTokens = getUserAvailableTokens(msg.sender);
        require(availableTokens >= tokensToGive, "Insufficient available tokens");

        // Transfer USDT from contract to user
        require(
            usdt.transfer(msg.sender, usdtToReceive),
            "USDT transfer failed"
        );

        // Transfer tokens from contract to project (owner)
        require(
            token.transfer(owner(), tokensToGive),
            "Token transfer failed"
        );

        // Update user's vesting info
        info.tokensOTCed += tokensToGive;
        info.totalUsdtReceived += usdtToReceive;
        info.totalPendingTokens -= tokensToGive;

        // Update global OTC tracking
        totalOTCUsdtSpent += usdtToReceive;
        totalOTCTokensAcquired += tokensToGive;

        // Update public offer amounts
        publicOffer.remainingUsdtAmount -= usdtToReceive;
        publicOffer.remainingTokenAmount -= tokensToGive;

        // If offer is fully consumed, deactivate it
        if (publicOffer.remainingUsdtAmount == 0 || publicOffer.remainingTokenAmount == 0) {
            publicOffer.active = false;
        }

        emit PublicOfferAccepted(msg.sender, usdtToReceive, tokensToGive, _percentage);
    }

    function revokePublicOTC() external onlyOwner nonReentrant {
        require(publicOffer.active, "No active public offer");
        
        uint256 refundUsdt = publicOffer.remainingUsdtAmount;
        uint256 refundTokens = publicOffer.remainingTokenAmount;
        
        // Refund remaining USDT to owner
        if (refundUsdt > 0) {
            require(usdt.transfer(owner(), refundUsdt), "USDT refund failed");
        }
        
        publicOffer.active = false;
        publicOffer.remainingUsdtAmount = 0;
        publicOffer.remainingTokenAmount = 0;
        
        emit PublicOfferRevoked(refundUsdt, refundTokens);
    }

    function privateOTCOffer(address _recipient, uint256 _usdtAmt, uint256 _tokenAmt, uint256 _duration) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        require(_tokenAmt > 0, "Token amount must be greater than 0");
        require(_usdtAmt > 0, "USDT amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        VestingInfo storage info = vestingInfo[_recipient];
        require(info.initialized, "Recipient vesting not initialized");
        require(getUserAvailableTokens(_recipient) >= _tokenAmt, "Recipient doesn't have enough tokens");

        PrivateOTCOffer storage offer = privateOffers[_recipient];
        
        offer.recipient = _recipient;
        offer.usdtAmount = _usdtAmt;
        offer.tokenAmount = _tokenAmt;
        offer.offerDuration = _duration;
        offer.offerStartTime = block.timestamp;
        offer.active = true;

        emit PrivateOfferCreated(_recipient, _usdtAmt, _tokenAmt, _duration);
    }

    function acceptPrivateOTC() external nonReentrant {
        PrivateOTCOffer storage offer = privateOffers[msg.sender];
        VestingInfo storage info = vestingInfo[msg.sender];
        
        require(offer.active, "No active private offer for you");
        require(offer.recipient == msg.sender, "Offer not for you");
        require(block.timestamp <= offer.offerStartTime + offer.offerDuration, "Offer expired");

        // Validate user has enough tokens available
        uint256 availableTokens = getUserAvailableTokens(msg.sender);
        require(availableTokens >= offer.tokenAmount, "Insufficient available tokens");

        // Transfer USDT from project to user
        require(
            usdt.transferFrom(owner(), msg.sender, offer.usdtAmount),
            "USDT transfer failed"
        );

        // Transfer tokens from contract to project
        require(
            token.transfer(owner(), offer.tokenAmount),
            "Token transfer failed"
        );

        // Update user's vesting info
        info.tokensOTCed += offer.tokenAmount;
        info.totalUsdtReceived += offer.usdtAmount;
        info.totalPendingTokens -= offer.tokenAmount;

        // Update global OTC tracking
        totalOTCUsdtSpent += offer.usdtAmount;
        totalOTCTokensAcquired += offer.tokenAmount;

        // Deactivate offer after acceptance
        offer.active = false;

        emit PrivateOfferAccepted(msg.sender, offer.usdtAmount, offer.tokenAmount);
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
     * @dev Get claimable tokens for a user right now
     */
    function getClaimableTokens(address _user) public view returns (uint256) {
        VestingInfo storage info = vestingInfo[_user];
        
        if (!info.initialized || info.totalClaimed >= info.totalAmount) {
            return 0;
        }

        // Check if initial lock period has passed
        if (block.timestamp < info.initialLockTime + info.initialLockDuration) {
            return 0;
        }

        // Calculate months elapsed since initial lock ended
        uint256 lockEndTime = info.initialLockTime + info.initialLockDuration;
        uint256 monthsElapsed = (block.timestamp - lockEndTime) / 30 days;
        
        // Can't claim beyond total vesting period
        if (monthsElapsed > info.monthsVested) {
            monthsElapsed = info.monthsVested;
        }
        
        // Calculate claimable months (months elapsed minus already claimed)
        uint256 claimableMonths = monthsElapsed - info.monthsClaimed;
        
        if (claimableMonths == 0) {
            return 0;
        }
        
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
        
        return tokensToClaim;
    }

    /**
     * @dev Get next claim time for a user
     */
    function getNextClaimTime(address _user) external view returns (uint256) {
        VestingInfo storage info = vestingInfo[_user];
        
        if (!info.initialized) {
            return 0;
        }
        
        // If initial lock period hasn't ended
        if (block.timestamp < info.initialLockTime + info.initialLockDuration) {
            return info.initialLockTime + info.initialLockDuration;
        }
        
        // If all months are claimed
        if (info.monthsClaimed >= info.monthsVested) {
            return 0; // No more claims possible
        }
        
        // Calculate next claim time
        uint256 lockEndTime = info.initialLockTime + info.initialLockDuration;
        return lockEndTime + ((info.monthsClaimed + 1) * 30 days);
    }

    /**
     * @dev Get vesting status for a user
     */
    function getVestingStatus(address _user) external view returns (
        bool initialized,
        bool established,
        uint256 totalAmount,
        uint256 totalClaimed,
        uint256 tokensOTCed,
        uint256 totalUsdtReceived,
        uint256 availableTokens,
        uint256 claimableNow,
        uint256 monthsClaimed,
        uint256 monthsVested,
        uint256 nextClaimTime,
        uint256 initialLockDuration
    ) {
        VestingInfo storage info = vestingInfo[_user];
        
        initialized = info.initialized;
        established = info.established;
        totalAmount = info.totalAmount;
        totalClaimed = info.totalClaimed;
        tokensOTCed = info.tokensOTCed;
        totalUsdtReceived = info.totalUsdtReceived;
        availableTokens = getUserAvailableTokens(_user);
        claimableNow = getClaimableTokens(_user);
        monthsClaimed = info.monthsClaimed;
        monthsVested = info.monthsVested;
        initialLockDuration = info.initialLockDuration;
        
        // Calculate next claim time
        if (!info.initialized) {
            nextClaimTime = 0;
        } else if (block.timestamp < info.initialLockTime + info.initialLockDuration) {
            nextClaimTime = info.initialLockTime + info.initialLockDuration;
        } else if (info.monthsClaimed >= info.monthsVested) {
            nextClaimTime = 0; // No more claims possible
        } else {
            uint256 lockEndTime = info.initialLockTime + info.initialLockDuration;
            nextClaimTime = lockEndTime + ((info.monthsClaimed + 1) * 30 days);
        }
    }

    /**
     * @dev Get public offer details
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
        
        uint256 endTime = publicOffer.offerStartTime + publicOffer.offerDuration;
        timeRemaining = block.timestamp < endTime ? endTime - block.timestamp : 0;
        active = publicOffer.active;
        expired = block.timestamp > endTime;
    }

    /**
     * @dev Get private offer details for a user
     */
    function getPrivateOffer(address _user) external view returns (
        address recipient,
        uint256 usdtAmount,
        uint256 tokenAmount,
        uint256 offerDuration,
        uint256 offerStartTime,
        uint256 timeRemaining,
        bool active,
        bool expired
    ) {
        PrivateOTCOffer storage offer = privateOffers[_user];
        
        recipient = offer.recipient;
        usdtAmount = offer.usdtAmount;
        tokenAmount = offer.tokenAmount;
        offerDuration = offer.offerDuration;
        offerStartTime = offer.offerStartTime;
        
        uint256 endTime = offer.offerStartTime + offer.offerDuration;
        timeRemaining = block.timestamp < endTime ? endTime - block.timestamp : 0;
        active = offer.active;
        expired = block.timestamp > endTime;
    }

    /**
     * @dev Get community member offer details
     */
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
     * @dev Get protocol-wide OTC statistics
     */
    function getOTCStats() external view returns (
        uint256 totalUsdtSpent,
        uint256 totalTokensAcquired,
        uint256 contractTokenBalance,
        uint256 contractUsdtBalance
    ) {
        totalUsdtSpent = totalOTCUsdtSpent;
        totalTokensAcquired = totalOTCTokensAcquired;
        contractTokenBalance = token.balanceOf(address(this));
        contractUsdtBalance = usdt.balanceOf(address(this));
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