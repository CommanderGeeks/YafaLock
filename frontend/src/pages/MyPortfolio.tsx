import React, { useState } from 'react';
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

export const MyPortfolio: React.FC = () => {
  const { vestingStatus, privateOffer, publicOffer, web3State, refreshData, loading } = useWeb3();
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

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

  // Helper function to format currency
  const formatCurrency = (value: string | number, symbol: string = '$'): string => {
    if (!value || value === '0' || value === 0) return `${symbol}0`;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num < 0.01) return `${symbol}< 0.01`;
    return `${symbol}${num.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
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
    // We need to get the raw vesting info to show lock details
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

              {/* Initialize Button */}
              <div className="pt-4">
                <TransactionButton 
                  onClick={handleInitializeLock}
                  variant="primary"
                  className="w-full py-4 text-lg font-semibold"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Lock className="w-5 h-5" />
                    <span>Initialize & Lock Tokens</span>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Allocation"
          value={`${formatNumber(vestingStatus.totalAmount)} YAFA`}
          icon={Coins}
          trend="neutral"
        />
        <StatCard 
          title="Claimed"
          value={`${formatNumber(vestingStatus.totalClaimed)} YAFA`}
          subtitle={`${vestingStatus.monthsClaimed}/${vestingStatus.monthsVested} months`}
          icon={CheckCircle}
          trend="up"
        />
        <StatCard 
          title="Available to Claim"
          value={`${formatNumber(vestingStatus.claimableNow)} YAFA`}
          icon={TrendingUp}
          trend={parseFloat(vestingStatus.claimableNow) > 0 ? "up" : "neutral"}
        />
        <StatCard 
          title="USDT Received"
          value={formatCurrency(vestingStatus.totalUsdtReceived)}
          subtitle="From OTC trades"
          icon={DollarSign}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vesting Progress */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <h3 className="text-xl font-semibold text-white mb-4">Vesting Progress</h3>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{vestingStatus.monthsClaimed}/{vestingStatus.monthsVested} months</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-3">
              <div 
                className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
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

        {/* OTC Opportunities */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">OTC Opportunities</h3>
            <button 
              onClick={() => setShowCreateOffer(true)}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Private Offer */}
            {privateOffer?.active && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-emerald-300">Private Offer</h4>
                  <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded-full text-emerald-300">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-400">You Give</p>
                    <p className="text-white font-semibold">{formatNumber(privateOffer.tokenAmount)} YAFA</p>
                  </div>
                  <div>
                    <p className="text-gray-400">You Receive</p>
                    <p className="text-emerald-400 font-semibold">{formatCurrency(privateOffer.usdtAmount)}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <Countdown targetTimestamp={privateOffer.offerStartTime + privateOffer.offerDuration} />
                </div>
                <TransactionButton 
                  onClick={handleAcceptPrivateOffer}
                  variant="success"
                  className="w-full"
                >
                  Accept Private Offer
                </TransactionButton>
              </div>
            )}

            {/* Public Offer */}
            {publicOffer?.active && (
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">Public Offer</h4>
                  <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded-full text-emerald-300">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-400">Rate</p>
                    <p className="text-white font-semibold">
                      {formatCurrency(
                        (parseFloat(publicOffer.remainingUsdtAmount) / parseFloat(publicOffer.remainingTokenAmount)).toString()
                      )} / YAFA
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Available</p>
                    <p className="text-emerald-400 font-semibold">{formatNumber(publicOffer.remainingTokenAmount)} YAFA</p>
                  </div>
                </div>
                <div className="mb-3">
                  <Countdown targetTimestamp={publicOffer.offerStartTime + publicOffer.offerDuration} />
                </div>
                <button 
                  onClick={() => setShowClaimModal(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold py-3 px-4 rounded-full transition-all duration-200 border border-emerald-400/30 hover:shadow-[0_0_20px_rgba(19,255,145,0.4)]"
                >
                  Participate in Offer
                </button>
              </div>
            )}

            {!privateOffer?.active && !publicOffer?.active && (
              <div className="text-center py-8 text-gray-400">
                <p>No active OTC offers available</p>
                <p className="text-sm mt-2">Create a community offer to sell your tokens</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <h3 className="text-xl font-semibold text-white mb-4">Portfolio Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Allocated</p>
            <p className="text-lg font-semibold text-white">{formatNumber(vestingStatus.totalAmount)} YAFA</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Sold via OTC</p>
            <p className="text-lg font-semibold text-orange-400">{formatNumber(vestingStatus.tokensOTCed)} YAFA</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Available</p>
            <p className="text-lg font-semibold text-emerald-400">{formatNumber(vestingStatus.availableTokens)} YAFA</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total USDT Earned</p>
            <p className="text-lg font-semibold text-emerald-400">{formatCurrency(vestingStatus.totalUsdtReceived)}</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateOfferModal 
        isOpen={showCreateOffer}
        onClose={() => setShowCreateOffer(false)}
      />
      <ClaimPublicOfferModal 
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
    </div>
  );
};