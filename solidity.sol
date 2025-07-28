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
    
    // NEW: Array to track addresses with active community offers
    address[] public activeOfferAddresses;

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

    // NEW: Struct for returning active offer data to frontend
    struct ActiveOfferData {
        address user;
        uint256 tokenAmount;
        uint256 usdtAmount;
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

        info.initialized = true;
        info.initialLockTime = block.timestamp;
        info.tokensVested = info.totalAmount;
        
        remainingVestedPeople++;
        
        emit TokensLocked(msg.sender, info.totalAmount, block.timestamp);
    }

    function getUserAvailableTokens(address _user) public view returns (uint256) {
        VestingInfo storage info = vestingInfo[_user];
        if (!info.initialized) return 0;
        
        uint256 elapsedTime = block.timestamp - info.initialLockTime;
        
        // Check if still in initial lock period
        if (elapsedTime < info.initialLockDuration) {
            return 0;
        }
        
        // Calculate months passed since lock period ended
        uint256 monthsPassed = (elapsedTime - info.initialLockDuration) / (30 days);
        if (monthsPassed > info.monthsVested) {
            monthsPassed = info.monthsVested;
        }
        
        uint256 vestedTokens = (info.totalAmount * monthsPassed) / info.monthsVested;
        uint256 availableTokens = vestedTokens - info.totalClaimed - info.tokensOTCed;
        
        return availableTokens;
    }

    function claimVestedTokens() external nonReentrant {
        VestingInfo storage info = vestingInfo[msg.sender];
        require(info.initialized, "vesting not initialized");
        
        uint256 availableTokens = getUserAvailableTokens(msg.sender);
        require(availableTokens > 0, "no tokens available to claim");
        
        uint256 elapsedTime = block.timestamp - info.initialLockTime;
        uint256 monthsPassed = (elapsedTime - info.initialLockDuration) / (30 days);
        if (monthsPassed > info.monthsVested) {
            monthsPassed = info.monthsVested;
        }
        
        info.totalClaimed += availableTokens;
        info.monthsClaimed = monthsPassed;
        
        // Calculate next claim time
        uint256 nextClaimTime = 0;
        if (monthsPassed < info.monthsVested) {
            nextClaimTime = info.initialLockTime + info.initialLockDuration + ((monthsPassed + 1) * 30 days);
        }
        
        // Transfer tokens to user
        require(token.transfer(msg.sender, availableTokens), "token transfer failed");

        if (info.totalAmount == info.totalClaimed) {
            remainingVestedPeople--;
        }
        
        emit TokensClaimed(msg.sender, availableTokens, info.monthsClaimed);
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

        // Create the offer
        offer.offerer = msg.sender;
        offer.usdtAmount = _usdtAmt;
        offer.tokenAmount = _tokenAmt;
        offer.active = true;

        // Add to active offers array (duplicate check not needed since we already checked !offer.active)
        activeOfferAddresses.push(msg.sender);

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
            // Full acceptance - deactivate offer and remove from array
            offer.active = false;
            _removeFromActiveOffers(_user);
        }

        emit CommunityMemberOfferAccepted(_user, usdtToPay, tokensToReceive, _percentage);
    }

    function revokeCommunityMemberOTCOffer() external {
        CommunityMemberOTCOffer storage offer = communityMemberOffers[msg.sender];
        require(offer.active, "No active offer to revoke");
        require(offer.offerer == msg.sender, "Not your offer");
        
        offer.active = false;
        _removeFromActiveOffers(msg.sender);
    }

    // NEW: Internal function to remove address from activeOfferAddresses array
    function _removeFromActiveOffers(address _user) internal {
        for (uint256 i = 0; i < activeOfferAddresses.length; i++) {
            if (activeOfferAddresses[i] == _user) {
                // Swap with last element and pop
                activeOfferAddresses[i] = activeOfferAddresses[activeOfferAddresses.length - 1];
                activeOfferAddresses.pop();
                break;
            }
        }
    }

    // NEW: Function to get all active community offers for admin dashboard
    function getAllActiveOffers() external view returns (ActiveOfferData[] memory) {
        ActiveOfferData[] memory activeOffers = new ActiveOfferData[](activeOfferAddresses.length);
        
        for (uint256 i = 0; i < activeOfferAddresses.length; i++) {
            address userAddress = activeOfferAddresses[i];
            CommunityMemberOTCOffer storage offer = communityMemberOffers[userAddress];
            
            activeOffers[i] = ActiveOfferData({
                user: userAddress,
                tokenAmount: offer.tokenAmount,
                usdtAmount: offer.usdtAmount
            });
        }
        
        return activeOffers;
    }

    // NEW: Function to get the count of active offers
    function getActiveOffersCount() external view returns (uint256) {
        return activeOfferAddresses.length;
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
        require(usdt.transfer(msg.sender, usdtToReceive), "USDT transfer failed");

        // Transfer tokens from contract to owner
        require(token.transfer(owner(), tokensToGive), "Token transfer failed");

        // Update user's vesting info
        info.tokensOTCed += tokensToGive;
        info.totalUsdtReceived += usdtToReceive;

        // Update global tracking
        totalOTCUsdtSpent += usdtToReceive;
        totalOTCTokensAcquired += tokensToGive;

        // Update offer amounts
        publicOffer.remainingUsdtAmount -= usdtToReceive;
        publicOffer.remainingTokenAmount -= tokensToGive;

        // If offer is fully consumed, deactivate it
        if (publicOffer.remainingUsdtAmount == 0 || publicOffer.remainingTokenAmount == 0) {
            publicOffer.active = false;
        }

        emit PublicOfferAccepted(msg.sender, usdtToReceive, tokensToGive, _percentage);
    }

    function revokePublicOTC() external onlyOwner {
        require(publicOffer.active, "No active public offer");
        
        uint256 refundUsdt = publicOffer.remainingUsdtAmount;
        uint256 refundTokens = publicOffer.remainingTokenAmount;
        
        // Transfer remaining USDT back to owner
        if (refundUsdt > 0) {
            require(usdt.transfer(owner(), refundUsdt), "USDT refund failed");
        }
        
        // Reset the offer
        publicOffer.active = false;
        publicOffer.remainingUsdtAmount = 0;
        publicOffer.remainingTokenAmount = 0;
        
        emit PublicOfferRevoked(refundUsdt, refundTokens);
    }

    function privateOTCOffer(address _recipient, uint256 _usdtAmt, uint256 _tokenAmt, uint256 _duration) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient address");
        require(_usdtAmt > 0, "USDT amount must be greater than 0");
        require(_tokenAmt > 0, "Token amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(!privateOffers[_recipient].active, "Private offer already exists for this user");

        // Transfer USDT from owner to contract for the offer
        require(
            usdt.transferFrom(msg.sender, address(this), _usdtAmt),
            "USDT transfer failed"
        );

        privateOffers[_recipient] = PrivateOTCOffer({
            recipient: _recipient,
            usdtAmount: _usdtAmt,
            tokenAmount: _tokenAmt,
            offerDuration: _duration,
            offerStartTime: block.timestamp,
            active: true
        });

        emit PrivateOfferCreated(_recipient, _usdtAmt, _tokenAmt, _duration);
    }

    function acceptPrivateOTC() external nonReentrant {
        PrivateOTCOffer storage offer = privateOffers[msg.sender];
        require(offer.active, "No active private offer");
        require(offer.recipient == msg.sender, "Not your offer");
        require(block.timestamp <= offer.offerStartTime + offer.offerDuration, "Offer expired");

        VestingInfo storage info = vestingInfo[msg.sender];
        require(info.initialized, "Vesting not initialized");

        uint256 availableTokens = getUserAvailableTokens(msg.sender);
        require(availableTokens >= offer.tokenAmount, "Insufficient available tokens");

        // Transfer USDT from contract to user
        require(usdt.transfer(msg.sender, offer.usdtAmount), "USDT transfer failed");

        // Transfer tokens from contract to owner
        require(token.transfer(owner(), offer.tokenAmount), "Token transfer failed");

        // Update user's vesting info
        info.tokensOTCed += offer.tokenAmount;
        info.totalUsdtReceived += offer.usdtAmount;

        // Update global tracking
        totalOTCUsdtSpent += offer.usdtAmount;
        totalOTCTokensAcquired += offer.tokenAmount;

        // Deactivate the offer
        offer.active = false;

        emit PrivateOfferAccepted(msg.sender, offer.usdtAmount, offer.tokenAmount);
    }

    function revokePrivateOTC(address _recipient) external onlyOwner {
        PrivateOTCOffer storage offer = privateOffers[_recipient];
        require(offer.active, "No active private offer for this user");
        
        uint256 refundAmount = offer.usdtAmount;
        
        // Transfer USDT back to owner
        require(usdt.transfer(owner(), refundAmount), "USDT refund failed");
        
        // Deactivate the offer
        offer.active = false;
    }

    /**
     * @dev Get next claim time for a user
     */
    function getNextClaimTime(address _user) external view returns (uint256) {
        VestingInfo storage info = vestingInfo[_user];
        if (!info.initialized) return 0;
        
        uint256 elapsedTime = block.timestamp - info.initialLockTime;
        
        // Still in initial lock period
        if (elapsedTime < info.initialLockDuration) {
            return info.initialLockTime + info.initialLockDuration;
        }
        
        uint256 monthsPassed = (elapsedTime - info.initialLockDuration) / (30 days);
        
        // All months vested
        if (monthsPassed >= info.monthsVested) {
            return 0; // No more claims
        }
        
        return info.initialLockTime + info.initialLockDuration + ((monthsPassed + 1) * 30 days);
    }

    /**
     * @dev Get claimable tokens for a user
     */
    function getClaimableTokens(address _user) external view returns (uint256) {
        return getUserAvailableTokens(_user);
    }

    /**
     * @dev Get comprehensive vesting status for a user
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
        availableTokens = info.totalAmount - info.totalClaimed - info.tokensOTCed;
        claimableNow = getUserAvailableTokens(_user);
        monthsClaimed = info.monthsClaimed;
        monthsVested = info.monthsVested;
        nextClaimTime = this.getNextClaimTime(_user);
        initialLockDuration = info.initialLockDuration;
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