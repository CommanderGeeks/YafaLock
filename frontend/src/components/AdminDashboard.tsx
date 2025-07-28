// Updated AdminDashboard component

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { StatCard, TransactionButton } from '../components/shared';
import { CreatePublicOfferModal } from '../components/modals';

interface CommunityOffer {
  user: string;
  usdtAmount: string;
  tokenAmount: string;
  pricePerToken: number;
}

export const AdminDashboard: React.FC = () => {
  const { web3State, otcStats, publicOffer, refreshData, loading } = useWeb3(); // Add publicOffer here
  const [isOwner, setIsOwner] = useState(false);
  const [communityOffers, setCommunityOffers] = useState<CommunityOffer[]>([]);
  const [showCreatePublicOffer, setShowCreatePublicOffer] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CommunityOffer | null>(null);
  const [acceptPercentage, setAcceptPercentage] = useState(100);

  // Check if connected wallet is the contract owner
  useEffect(() => {
    const checkOwnership = async () => {
      if (web3State.contract && web3State.account) {
        try {
          const owner = await web3State.contract.owner();
          setIsOwner(web3State.account.toLowerCase() === owner.toLowerCase());
        } catch (error) {
          console.error('Error checking ownership:', error);
          setIsOwner(false);
        }
      }
    };

    checkOwnership();
  }, [web3State.contract, web3State.account]);

  // Load community offers using the new contract function
  const loadCommunityOffers = async () => {
    if (!web3State.contract) return;
    
    setLoadingOffers(true);
    try {
      // Call the new getAllActiveOffers function
      const activeOffers = await web3State.contract.getAllActiveOffers();
      console.log('Raw active offers:', activeOffers);
      
      // Transform the data and calculate price per token, then sort by price
      const formattedOffers: CommunityOffer[] = activeOffers.map((offer: any) => {
        const usdtAmount = window.ethers.utils.formatUnits(offer.usdtAmount, 6);
        const tokenAmount = window.ethers.utils.formatUnits(offer.tokenAmount, 6);
        const pricePerToken = parseFloat(usdtAmount) / parseFloat(tokenAmount);
        
        return {
          user: offer.user,
          usdtAmount,
          tokenAmount,
          pricePerToken
        };
              }).sort((a: CommunityOffer, b: CommunityOffer) => a.pricePerToken - b.pricePerToken); // Sort by price ascending (cheapest first)
      
      setCommunityOffers(formattedOffers);
    } catch (error) {
      console.error('Error loading community offers:', error);
      setCommunityOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    if (isOwner && web3State.contract) {
      loadCommunityOffers();
    }
  }, [isOwner, web3State.contract]);

  const handleAcceptOffer = async (offer: CommunityOffer): Promise<void> => {
    setSelectedOffer(offer);
    setAcceptPercentage(100);
    setShowAcceptModal(true);
  };

  const handleAcceptCommunityOffer = async (): Promise<void> => {
    try {
      if (!web3State.contract || !selectedOffer) return;
      
      const tx = await web3State.contract.acceptCommunityMemberOTCOffer(
        selectedOffer.user, 
        acceptPercentage
      );
      await tx.wait();
      
      await loadCommunityOffers();
      await refreshData();
      setShowAcceptModal(false);
      setSelectedOffer(null);
    } catch (error) {
      console.error('Failed to accept community offer:', error);
    }
  };

  const formatNumber = (value: string, decimals: number = 2): string => {
    if (!value || value === '0') return '0';
    const num = parseFloat(value);
    if (num < 0.01) return '< 0.01';
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals 
    });
  };

  const formatCurrency = (value: string | number, symbol: string = '$'): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!num || num === 0) return `${symbol}0`;
    if (num < 0.01) return `${symbol}< 0.01`;
    return `${symbol}${num.toLocaleString(undefined, { 
      minimumFractionDigits: 4,
      maximumFractionDigits: 4 
    })}`;
  };

  // Don't show admin dashboard if not owner or not connected
  if (!web3State.connected || !isOwner) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage OTC offers and protocol operations</p>
          </div>
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

      {/* Admin Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total OTC Volume"
          value={otcStats ? formatCurrency(otcStats.totalUsdtSpent) : "Loading..."}
          subtitle="USDT spent on OTC trades"
          icon={DollarSign}
          trend="up"
        />
        <StatCard 
          title="Tokens Acquired"
          value={otcStats ? `${formatNumber(otcStats.totalTokensAcquired)} YAFA` : "Loading..."}
          subtitle="Via all OTC trades"
          icon={CheckCircle}
          trend="up"
        />
        <StatCard 
          title="Contract Balance"
          value={otcStats ? `${formatNumber(otcStats.contractTokenBalance)} YAFA` : "Loading..."}
          subtitle="Tokens in contract"
          icon={Users}
        />
        <StatCard 
          title="USDT Available"
          value={otcStats ? formatCurrency(otcStats.contractUsdtBalance) : "Loading..."}
          subtitle="For new offers"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Community Offers Management */}
        <div className="lg:col-span-2 bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Community OTC Offers</h3>
            <button 
              onClick={loadCommunityOffers}
              disabled={loadingOffers}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loadingOffers ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {communityOffers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active community offers</p>
                <p className="text-sm mt-1">Offers from community members will appear here</p>
              </div>
            ) : (
              communityOffers.map((offer, index) => (
                <div key={`${offer.user}-${index}`} className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {offer.user.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {offer.user.slice(0, 6)}...{offer.user.slice(-4)}
                        </p>
                        <p className="text-xs text-gray-400">Community Member</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-300 rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400">Offering</p>
                      <p className="text-white font-semibold">{formatNumber(offer.tokenAmount)} YAFA</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Asking</p>
                      <p className="text-emerald-400 font-semibold">{formatCurrency(offer.usdtAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Price per YAFA</p>
                      <p className="text-yellow-400 font-semibold">{formatCurrency(offer.pricePerToken)}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <TransactionButton 
                      onClick={() => handleAcceptOffer(offer)}
                      variant="success"
                      className="flex-1 text-xs py-2"
                    >
                      Accept Offer
                    </TransactionButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Public Offer Management */}
        <div className="lg:col-span-2 bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Public OTC Offers</h3>
            {!publicOffer?.active && (
              <button 
                onClick={() => setShowCreatePublicOffer(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold px-4 py-2 rounded-full transition-all duration-200 border border-emerald-400/30 hover:shadow-[0_0_20px_rgba(19,255,145,0.4)] text-sm flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Public Offer</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {publicOffer?.active ? (
              <div className="bg-gray-700/30 border border-emerald-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-lg">Active Public Offer</h4>
                      <p className="text-xs text-gray-400">Available to all community members</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Total USDT</p>
                    <p className="text-lg font-semibold text-white">{formatCurrency(publicOffer.totalUsdtAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Tokens</p>
                    <p className="text-lg font-semibold text-white">{formatNumber(publicOffer.totalTokenAmount)} YAFA</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Remaining USDT</p>
                    <p className="text-lg font-semibold text-emerald-400">{formatCurrency(publicOffer.remainingUsdtAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Remaining Tokens</p>
                    <p className="text-lg font-semibold text-emerald-400">{formatNumber(publicOffer.remainingTokenAmount)} YAFA</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Rate per YAFA</p>
                    <p className="text-lg font-semibold text-yellow-400">
                      {formatCurrency((parseFloat(publicOffer.remainingUsdtAmount) / parseFloat(publicOffer.remainingTokenAmount)).toString())}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Progress</p>
                    <p className="text-lg font-semibold text-white">
                      {((parseFloat(publicOffer.totalTokenAmount) - parseFloat(publicOffer.remainingTokenAmount)) / parseFloat(publicOffer.totalTokenAmount) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Time Remaining:</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium">
                        {Math.max(0, Math.floor((publicOffer.offerStartTime + publicOffer.offerDuration - Date.now() / 1000) / (24 * 60 * 60)))}d {Math.max(0, Math.floor(((publicOffer.offerStartTime + publicOffer.offerDuration - Date.now() / 1000) % (24 * 60 * 60)) / (60 * 60)))}h
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <TransactionButton 
                    onClick={async () => {
                      try {
                        if (!web3State.contract) return;
                        const tx = await web3State.contract.revokePublicOTC();
                        await tx.wait();
                        await refreshData();
                      } catch (error) {
                        console.error('Failed to revoke public offer:', error);
                      }
                    }}
                    variant="warning"
                    className="flex-1 text-sm"
                  >
                    Revoke Offer
                  </TransactionButton>
                  <button 
                    onClick={refreshData}
                    className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600/30 py-2 px-4 rounded-full transition-colors backdrop-blur-sm text-sm"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active public offers</p>
                <p className="text-sm mt-1">Create offers for the entire community</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accept Offer Modal */}
      {showAcceptModal && selectedOffer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <h2 className="text-xl font-semibold text-white">Accept Community Offer</h2>
              <button 
                onClick={() => setShowAcceptModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Offer Details</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>From: {selectedOffer.user.slice(0, 6)}...{selectedOffer.user.slice(-4)}</p>
                  <p>Offering: {formatNumber(selectedOffer.tokenAmount)} YAFA</p>
                  <p>Asking: {formatCurrency(selectedOffer.usdtAmount)}</p>
                  <p>Rate: {formatCurrency(selectedOffer.pricePerToken)} per YAFA</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Accept Percentage: {acceptPercentage}%
                </label>
                <input 
                  type="range"
                  min="1"
                  max="100"
                  value={acceptPercentage}
                  onChange={(e) => setAcceptPercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Transaction Summary</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>You will receive: {formatNumber((parseFloat(selectedOffer.tokenAmount) * acceptPercentage / 100).toString())} YAFA</p>
                  <p>You will pay: {formatCurrency((parseFloat(selectedOffer.usdtAmount) * acceptPercentage / 100).toString())}</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600/30 py-3 px-4 rounded-full transition-colors backdrop-blur-sm"
                >
                  Cancel
                </button>
                <TransactionButton 
                  onClick={handleAcceptCommunityOffer}
                  variant="success"
                  className="flex-1"
                >
                  Accept {acceptPercentage}%
                </TransactionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePublicOfferModal 
        isOpen={showCreatePublicOffer}
        onClose={() => setShowCreatePublicOffer(false)}
      />
    </div>
  );
};