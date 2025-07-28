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
  offerer: string;
  usdtAmount: string;
  tokenAmount: string;
  active: boolean;
}

export const AdminDashboard: React.FC = () => {
  const { web3State, otcStats, refreshData, loading } = useWeb3();
  const [isOwner, setIsOwner] = useState(false);
  const [communityOffers, setCommunityOffers] = useState<CommunityOffer[]>([]);
  const [showCreatePublicOffer, setShowCreatePublicOffer] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);

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

  // Load community offers (you'd need to implement this via events or other method)
  const loadCommunityOffers = async () => {
    if (!web3State.contract) return;
    
    setLoadingOffers(true);
    try {
      // Note: This would require implementing a way to get all active offers
      // For now, this is a placeholder - you'd need to either:
      // 1. Add a function to get all active offers to the contract
      // 2. Use event filtering to get all CommunityMemberOfferCreated events
      // 3. Maintain an off-chain index
      
      // Placeholder for now
      setCommunityOffers([]);
    } catch (error) {
      console.error('Error loading community offers:', error);
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      loadCommunityOffers();
    }
  }, [isOwner, web3State.contract]);

  const handleAcceptCommunityOffer = async (userAddress: string, percentage: number): Promise<void> => {
    try {
      if (!web3State.contract) return;
      
      const tx = await web3State.contract.acceptCommunityMemberOTCOffer(userAddress, percentage);
      await tx.wait();
      
      await loadCommunityOffers();
      await refreshData();
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

  const formatCurrency = (value: string, symbol: string = '$'): string => {
    if (!value || value === '0') return `${symbol}0`;
    const num = parseFloat(value);
    if (num < 0.01) return `${symbol}< 0.01`;
    return `${symbol}${num.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
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
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
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
                <div key={index} className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {offer.offerer.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {offer.offerer.slice(0, 6)}...{offer.offerer.slice(-4)}
                        </p>
                        <p className="text-xs text-gray-400">Community Member</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {offer.active && (
                        <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-300 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400">Offering</p>
                      <p className="text-white font-semibold">{formatNumber(offer.tokenAmount)} YAFA</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Asking</p>
                      <p className="text-emerald-400 font-semibold">{formatCurrency(offer.usdtAmount)}</p>
                    </div>
                  </div>

                  {offer.active && (
                    <div className="flex space-x-2">
                      <TransactionButton 
                        onClick={() => handleAcceptCommunityOffer(offer.offerer, 25)}
                        variant="secondary"
                        className="flex-1 text-xs"
                      >
                        Accept 25%
                      </TransactionButton>
                      <TransactionButton 
                        onClick={() => handleAcceptCommunityOffer(offer.offerer, 50)}
                        variant="secondary"
                        className="flex-1 text-xs"
                      >
                        Accept 50%
                      </TransactionButton>
                      <TransactionButton 
                        onClick={() => handleAcceptCommunityOffer(offer.offerer, 100)}
                        variant="success"
                        className="flex-1 text-xs"
                      >
                        Accept All
                      </TransactionButton>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Public Offer Management */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Public OTC Offers</h3>
            <button 
              onClick={() => setShowCreatePublicOffer(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold px-4 py-2 rounded-full transition-all duration-200 border border-emerald-400/30 hover:shadow-[0_0_20px_rgba(19,255,145,0.4)] text-sm flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Public Offer</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-center py-8 text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active public offers</p>
              <p className="text-sm mt-1">Create offers for the entire community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePublicOfferModal 
        isOpen={showCreatePublicOffer}
        onClose={() => setShowCreatePublicOffer(false)}
      />
    </div>
  );
};