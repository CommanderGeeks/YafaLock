import React, { useState } from 'react';
import { 
  Coins, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  RefreshCw, 
  AlertCircle, 
  Plus 
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { StatCard, TransactionButton, Countdown } from '../components/shared';
import { CreateOfferModal, ClaimPublicOfferModal } from '../components/modals';

export const MyPortfolio: React.FC = () => {
  const { vestingStatus, privateOffer, publicOffer, web3State, refreshData, loading } = useWeb3();
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const handleLockTokens = async (): Promise<void> => {
    try {
      if (!web3State.contract) return;
      
      const tx = await web3State.contract.lock();
      await tx.wait();
      await refreshData();
    } catch (error) {
      console.error('Failed to lock tokens:', error);
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

  if (!vestingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

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

      {!vestingStatus.initialized && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-400 mr-3" />
            <span className="text-orange-200">Your vesting is not initialized. Contact the project team.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Allocation"
          value={`${parseFloat(vestingStatus.totalAmount).toFixed(2)} YAFA`}
          icon={Coins}
        />
        <StatCard 
          title="Claimable Now"
          value={`${parseFloat(vestingStatus.claimableNow).toFixed(2)} YAFA`}
          icon={CheckCircle}
          trend="up"
        />
        <StatCard 
          title="OTC Received"
          value={`$${parseFloat(vestingStatus.totalUsdtReceived).toFixed(2)}`}
          subtitle="USDT from sales"
          icon={DollarSign}
          trend="up"
        />
        <StatCard 
          title="Tokens Sold"
          value={`${parseFloat(vestingStatus.tokensOTCed).toFixed(2)} YAFA`}
          subtitle="Via OTC trades"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <h3 className="text-xl font-semibold text-white mb-6">Vesting Progress</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-300">Progress</span>
                <span className="text-gray-400">
                  {vestingStatus.monthsVested > 0 ? ((vestingStatus.monthsClaimed / vestingStatus.monthsVested) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{ 
                    width: `${vestingStatus.monthsVested > 0 ? (vestingStatus.monthsClaimed / vestingStatus.monthsVested) * 100 : 0}%` 
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{vestingStatus.monthsClaimed} months claimed</span>
                <span>{vestingStatus.monthsVested} total months</span>
              </div>
            </div>
            
            {vestingStatus.nextClaimTime > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-emerald-400">Next Unlock</p>
                    <p className="text-sm text-gray-300">
                      {parseFloat(vestingStatus.claimableNow).toFixed(2)} YAFA available
                    </p>
                  </div>
                  <div className="text-right">
                    <Countdown targetTimestamp={vestingStatus.nextClaimTime} />
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {!vestingStatus.initialized ? (
                <TransactionButton onClick={handleLockTokens} variant="primary">
                  <div className="w-full">Initialize & Lock Tokens</div>
                </TransactionButton>
              ) : (
                <TransactionButton 
                  onClick={handleClaimVested}
                  disabled={parseFloat(vestingStatus.claimableNow) === 0}
                  variant="success"
                >
                  <div className="w-full">Claim Available Tokens</div>
                </TransactionButton>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {privateOffer?.active && (
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Private Offer for You</h3>
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300">
                  Private
                </span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">You Get</p>
                    <p className="font-semibold text-lg text-emerald-400">${parseFloat(privateOffer.usdtAmount).toFixed(2)} USDT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">You Give</p>
                    <p className="font-semibold text-lg text-white">{parseFloat(privateOffer.tokenAmount).toFixed(2)} YAFA</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Expires</p>
                  <Countdown targetTimestamp={privateOffer.offerStartTime + privateOffer.offerDuration} />
                </div>
                <TransactionButton 
                  onClick={handleAcceptPrivateOffer}
                  disabled={privateOffer.expired}
                  variant="warning"
                >
                  <div className="w-full">Accept Offer</div>
                </TransactionButton>
              </div>
            </div>
          )}

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setShowCreateOffer(true)}
                disabled={!vestingStatus.initialized}
                className="w-full flex items-center justify-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600/30 py-3 rounded-full transition-colors disabled:opacity-50 backdrop-blur-sm"
              >
                <Plus className="w-5 h-5" />
                <span>Create Offer</span>
              </button>
              <button 
                onClick={() => setShowClaimModal(true)}
                disabled={!publicOffer?.active}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold py-3 rounded-full transition-all duration-200 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(19,255,145,0.4)] border border-emerald-400/30"
              >
                <DollarSign className="w-5 h-5" />
                <span>Claim Public Offer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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