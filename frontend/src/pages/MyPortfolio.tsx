import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  RefreshCw, 
  AlertCircle, 
  Plus,
  Lock,
  Clock,
  Info
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { StatCard, TransactionButton, Countdown } from '../components/shared';
import { CreateOfferModal, ClaimPublicOfferModal } from '../components/modals';
import { CONTRACT_CONFIG } from '../config/contracts';

// Token Approval State Interface
interface TokenApprovalState {
  isCheckingApproval: boolean;
  isApproving: boolean;
  currentAllowance: string;
  needsApproval: boolean;
}

// ERC20 ABI for token interactions
const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export const MyPortfolio: React.FC = () => {
  const { vestingStatus, privateOffer, publicOffer, web3State, refreshData, loading } = useWeb3();
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [myOffer, setMyOffer] = useState<any>(null);
  const [loadingMyOffer, setLoadingMyOffer] = useState(false);
  
  // Token approval state
  const [approvalState, setApprovalState] = useState<TokenApprovalState>({
    isCheckingApproval: false,
    isApproving: false,
    currentAllowance: '0',
    needsApproval: false,
  });

  // Helper function to format numbers
  const formatNumber = (value: string | number, decimals: number = 2): string => {
    if (!value || value === '0' || value === 0) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num < 0.01) return '< 0.01';
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals 
    });
  };

  // Check token allowance function
  const checkTokenApproval = async (): Promise<void> => {
    if (!web3State.provider || !web3State.account || !vestingStatus?.totalAmount) return;
    
    setApprovalState(prev => ({ ...prev, isCheckingApproval: true }));
    
    try {
      const tokenContract = new window.ethers.Contract(
        CONTRACT_CONFIG.YAFA_TOKEN_ADDRESS,
        ERC20_ABI,
        web3State.provider
      );
      
      const allowance = await tokenContract.allowance(
        web3State.account,
        CONTRACT_CONFIG.YAFA_LOCK_ADDRESS
      );
      
      const currentAllowanceFormatted = window.ethers.utils.formatUnits(allowance, 6);
      const needsApproval = allowance.lt(window.ethers.utils.parseUnits(vestingStatus.totalAmount, 6));
      
      setApprovalState(prev => ({
        ...prev,
        currentAllowance: currentAllowanceFormatted,
        needsApproval,
        isCheckingApproval: false
      }));
    } catch (error) {
      console.error('Error checking allowance:', error);
      setApprovalState(prev => ({ 
        ...prev, 
        isCheckingApproval: false,
        needsApproval: true // Assume approval needed if check fails
      }));
    }
  };

  // Handle token approval
  const handleApproveTokens = async (): Promise<void> => {
    if (!web3State.provider || !web3State.account || !vestingStatus?.totalAmount) return;
    
    setApprovalState(prev => ({ ...prev, isApproving: true }));
    
    try {
      const signer = web3State.provider.getSigner();
      const tokenContract = new window.ethers.Contract(
        CONTRACT_CONFIG.YAFA_TOKEN_ADDRESS,
        ERC20_ABI,
        signer
      );
      
      const amountToApprove = window.ethers.utils.parseUnits(vestingStatus.totalAmount, 6);
      
      const tx = await tokenContract.approve(CONTRACT_CONFIG.YAFA_LOCK_ADDRESS, amountToApprove);
      await tx.wait();
      
      // Recheck approval after successful transaction
      await checkTokenApproval();
    } catch (error) {
      console.error('Failed to approve tokens:', error);
      setApprovalState(prev => ({ ...prev, isApproving: false }));
    }
  };

  // Load user's community offer
  const loadMyOffer = async () => {
    if (!web3State.contract || !web3State.account) return;
    
    setLoadingMyOffer(true);
    try {
      const offerData = await web3State.contract.getCommunityMemberOffer(web3State.account);
      console.log('My offer data:', offerData);
      
      // Handle array response - [offerer, usdtAmount, tokenAmount, active]
      if (offerData[3]) { // if active
        setMyOffer({
          offerer: offerData[0],
          usdtAmount: window.ethers.utils.formatUnits(offerData[1], 6),
          tokenAmount: window.ethers.utils.formatUnits(offerData[2], 6),
          active: offerData[3],
        });
      } else {
        setMyOffer(null);
      }
    } catch (error) {
      console.error('Error loading my offer:', error);
      setMyOffer(null);
    } finally {
      setLoadingMyOffer(false);
    }
  };

  // Load my offer when component mounts or wallet changes
  useEffect(() => {
    if (web3State.connected && vestingStatus?.initialized) {
      loadMyOffer();
    }
  }, [web3State.connected, web3State.account, vestingStatus?.initialized]);

  // Check approval when component loads and when relevant state changes
  useEffect(() => {
    if (vestingStatus?.established && !vestingStatus?.initialized && web3State.connected) {
      checkTokenApproval();
    }
  }, [vestingStatus, web3State.connected, web3State.account]);

  const handleRevokeOffer = async (): Promise<void> => {
    try {
      if (!web3State.contract) return;
      
      const tx = await web3State.contract.revokeCommunityMemberOTCOffer();
      await tx.wait();
      
      await loadMyOffer();
      await refreshData();
    } catch (error) {
      console.error('Failed to revoke offer:', error);
    }
  };

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return 'No duration set';
    
    const days = Math.floor(seconds / (24 * 60 * 60));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years >= 1) {
      const remainingMonths = Math.floor((days % 365) / 30);
      return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
    } else if (months >= 1) {
      const remainingDays = days % 30;
      return `${months} month${months !== 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`;
    } else if (days >= 1) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(seconds / (60 * 60));
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  };

  const handleInitializeLock = async (): Promise<void> => {
    try {
      if (!web3State.contract) return;
      
      // First check if approval is needed
      await checkTokenApproval();
      
      // If approval is needed, don't proceed with lock
      if (approvalState.needsApproval) {
        console.log('Token approval needed before locking');
        return;
      }
      
      const tx = await web3State.contract.lock();
      await tx.wait();
      await refreshData();
    } catch (error) {
      console.error('Failed to initialize lock:', error);
    }
  };

  const handleClaimVested = async (): Promise<void> => {
    try {
      if (!web3State.contract) return;
      
      const tx = await web3State.contract.claimVestedTokens();
      await tx.wait();
      await refreshData();
    } catch (error) {
      console.error('Failed to claim tokens:', error);
    }
  };

  const handleAcceptPrivateOffer = async (): Promise<void> => {
    try {
      if (!web3State.contract) return;
      
      const tx = await web3State.contract.acceptPrivateOTC();
      await tx.wait();
      await refreshData();
    } catch (error) {
      console.error('Failed to accept private offer:', error);
    }
  };

  // Not connected state
  if (!web3State.connected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Wallet className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400 text-lg mb-4">Please connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!vestingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // No lock initialization available
  if (!vestingStatus.established) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Portfolio</h1>
            <p className="text-gray-400 mt-1">Wallet: {web3State.account?.slice(0, 6)}...{web3State.account?.slice(-4)}</p>
          </div>
          <TransactionButton 
            onClick={refreshData}
            disabled={loading}
            variant="secondary"
          >
            <div className="flex items-center space-x-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </div>
          </TransactionButton>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Lock Initialization Available</h2>
            <p className="text-gray-400 mb-6">
              You do not currently have a vesting allocation set up for this wallet address. 
              Please contact the project team if you believe this is an error.
            </p>
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
              <p className="text-sm text-gray-400">
                Connected Wallet: <span className="text-white font-mono">{web3State.account}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lock available but not initialized
  if (vestingStatus.established && !vestingStatus.initialized) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Portfolio</h1>
            <p className="text-gray-400 mt-1">Wallet: {web3State.account?.slice(0, 6)}...{web3State.account?.slice(-4)}</p>
          </div>
          <TransactionButton 
            onClick={refreshData}
            disabled={loading}
            variant="secondary"
          >
            <div className="flex items-center space-x-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </div>
          </TransactionButton>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-8 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <div className="text-center mb-8">
              <Lock className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">Initialize Your Token Lock</h2>
              <p className="text-gray-400">
                You have a vesting allocation ready to be initialized. Review the details below and confirm to start your vesting schedule.
              </p>
            </div>

            <div className="space-y-6">
              {/* Allocation Details */}
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-emerald-400" />
                  Your Allocation Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Allocation</p>
                    <p className="text-xl font-bold text-white">
                      {formatNumber(vestingStatus.totalAmount)} YAFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Vesting Period</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {vestingStatus.monthsVested} months
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-600/30">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Initial Lock Duration</p>
                    <p className="text-lg font-semibold text-orange-400">
                      {formatDuration(vestingStatus.initialLockDuration)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      No tokens can be claimed during this initial period
                    </p>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-emerald-400" />
                  What Happens When You Initialize
                </h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p>Your vesting schedule will begin immediately</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p>Tokens will unlock monthly over {vestingStatus.monthsVested} months</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p>You can participate in OTC trading opportunities</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p>This action cannot be undone once confirmed</p>
                  </div>
                </div>
              </div>

              {/* Token Approval Section - Show if approval needed */}
              {approvalState.needsApproval && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Token Approval Required
                  </h3>
                  <div className="space-y-3 text-sm text-gray-300 mb-4">
                    <p>Before you can lock your tokens, you need to approve the contract to transfer them.</p>
                    <div className="flex items-center justify-between bg-gray-700/30 rounded p-3">
                      <span>Amount to approve:</span>
                      <span className="font-semibold text-white">{formatNumber(vestingStatus.totalAmount)} YAFA</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-700/30 rounded p-3">
                      <span>Current allowance:</span>
                      <span className="font-semibold text-white">{formatNumber(approvalState.currentAllowance)} YAFA</span>
                    </div>
                  </div>
                  <TransactionButton 
                    onClick={handleApproveTokens}
                    disabled={approvalState.isApproving || approvalState.isCheckingApproval}
                    variant="warning"
                    className="w-full py-3 text-lg font-semibold"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {approvalState.isApproving ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      <span>
                        {approvalState.isApproving ? 'Approving...' : 'Approve Tokens'}
                      </span>
                    </div>
                  </TransactionButton>
                </div>
              )}

              {/* Initialize Button - Show if approved or approval not needed */}
              <div className="pt-4">
                <TransactionButton 
                  onClick={handleInitializeLock}
                  disabled={approvalState.needsApproval || approvalState.isCheckingApproval}
                  variant="primary"
                  className="w-full py-4 text-lg font-semibold"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {approvalState.isCheckingApproval ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                    <span>
                      {approvalState.isCheckingApproval 
                        ? 'Checking Approval...' 
                        : approvalState.needsApproval 
                          ? 'Approve Tokens First' 
                          : 'Initialize & Lock Tokens'
                      }
                    </span>
                  </div>
                </TransactionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lock initialized - show full portfolio
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Portfolio</h1>
          <p className="text-gray-400 mt-1">Wallet: {web3State.account?.slice(0, 6)}...{web3State.account?.slice(-4)}</p>
        </div>
        <TransactionButton 
          onClick={refreshData}
          disabled={loading}
          variant="secondary"
        >
          <div className="flex items-center space-x-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </div>
        </TransactionButton>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Coins}
          title="Total Allocation"
          value={`${formatNumber(vestingStatus.totalAmount)} YAFA`}
          trend="up"
        />
        <StatCard
          icon={CheckCircle}
          title="Tokens Claimed"
          value={`${formatNumber(vestingStatus.totalClaimed)} YAFA`}
          trend="up"
        />
        <StatCard
          icon={DollarSign}
          title="USDT Received (OTC)"
          value={`$${formatNumber(vestingStatus.totalUsdtReceived)}`}
          trend="up"
        />
        <StatCard
          icon={TrendingUp}
          title="Progress"
          value={`${vestingStatus.monthsVested > 0 ? Math.round((vestingStatus.monthsClaimed / vestingStatus.monthsVested) * 100) : 0}%`}
          trend="up"
        />
      </div>

      {/* Vesting Progress */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <h3 className="text-xl font-semibold text-white mb-6">Vesting Progress</h3>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Months Claimed: {vestingStatus.monthsClaimed}/{vestingStatus.monthsVested}</span>
              <span>{vestingStatus.monthsVested > 0 ? Math.round((vestingStatus.monthsClaimed / vestingStatus.monthsVested) * 100) : 0}% Complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-green-400 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${vestingStatus.monthsVested > 0 ? (vestingStatus.monthsClaimed / vestingStatus.monthsVested) * 100 : 0}%`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Started</span>
              <span>{vestingStatus.monthsVested > 0 ? Math.round((vestingStatus.monthsClaimed / vestingStatus.monthsVested) * 100) : 0}%</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Claim Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Available to Claim</p>
                <p className="text-2xl font-bold text-white">{formatNumber(vestingStatus.claimableNow)} YAFA</p>
              </div>
              <TransactionButton 
                onClick={handleClaimVested}
                disabled={parseFloat(vestingStatus.claimableNow) === 0}
                variant="success"
              >
                Claim Tokens
              </TransactionButton>
            </div>

            {vestingStatus.nextClaimTime > 0 && (
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-3">
                <p className="text-sm text-gray-400 mb-1">Next Claim Available</p>
                <Countdown targetTimestamp={vestingStatus.nextClaimTime} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Active OTC Offer */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">My Active OTC Offer</h3>
          {loadingMyOffer && (
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          )}
        </div>

        {myOffer ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-400">Your Offer</p>
                <p className="text-lg font-semibold text-white">
                  {formatNumber(myOffer.tokenAmount)} YAFA → ${formatNumber(myOffer.usdtAmount)} USDT
                </p>
              </div>
              <TransactionButton
                onClick={handleRevokeOffer}
                variant="warning"
                className="px-4 py-2 text-sm"
              >
                Revoke
              </TransactionButton>
            </div>
            <div className="text-xs text-emerald-400">
              ✓ Active - Waiting for project acceptance
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <DollarSign className="w-12 h-12 mx-auto mb-2" />
              <p>No active OTC offer</p>
            </div>
            <button
              onClick={() => setShowCreateOffer(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold px-6 py-3 rounded-full transition-all duration-200 border border-emerald-400/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Create OTC Offer
            </button>
          </div>
        )}
      </div>

      {/* OTC Opportunities */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">OTC Opportunities</h3>
          <button 
            onClick={() => setShowCreateOffer(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold px-4 py-2 rounded-full transition-all duration-200 border border-emerald-400/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Create Offer
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Public OTC Offer */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Public Offer</h4>
            {publicOffer?.active ? (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Available:</span>
                    <span className="text-white">{formatNumber(publicOffer.remainingTokenAmount)} YAFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white">${(parseFloat(publicOffer.remainingUsdtAmount) / parseFloat(publicOffer.remainingTokenAmount)).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total USDT:</span>
                    <span className="text-white">${formatNumber(publicOffer.remainingUsdtAmount)}</span>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button 
                    onClick={() => setShowClaimModal(true)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold px-4 py-2 rounded-full transition-all duration-200 border border-emerald-400/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    Participate
                  </button>
                </div>
                <div className="mt-3 text-xs text-blue-400">
                  <Countdown targetTimestamp={publicOffer.offerStartTime + publicOffer.offerDuration} />
                </div>
              </div>
            ) : (
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4 text-center">
                <p className="text-gray-400">No active public offer</p>
              </div>
            )}
          </div>

          {/* Private OTC Offer */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Private Offer</h4>
            {privateOffer?.active ? (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tokens:</span>
                    <span className="text-white">{formatNumber(privateOffer.tokenAmount)} YAFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white">${(parseFloat(privateOffer.usdtAmount) / parseFloat(privateOffer.tokenAmount)).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total USDT:</span>
                    <span className="text-white">${formatNumber(privateOffer.usdtAmount)}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <TransactionButton 
                    onClick={handleAcceptPrivateOffer}
                    variant="primary"
                    className="w-full"
                  >
                    Accept Offer
                  </TransactionButton>
                </div>
                <div className="mt-3 text-xs text-purple-400">
                  <Countdown targetTimestamp={privateOffer.offerStartTime + privateOffer.offerDuration} />
                </div>
              </div>
            ) : (
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4 text-center">
                <p className="text-gray-400">No private offer available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateOffer && (
        <CreateOfferModal
          isOpen={showCreateOffer}
          onClose={() => {
            setShowCreateOffer(false);
            loadMyOffer();
            refreshData();
          }}
        />
      )}

      {showClaimModal && publicOffer && (
        <ClaimPublicOfferModal
          isOpen={showClaimModal}
          onClose={() => {
            setShowClaimModal(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
};