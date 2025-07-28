import React from 'react';
import { Coins, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { StatCard, Countdown } from '../components/shared';

export const ProtocolOverview: React.FC = () => {
  const { publicOffer, otcStats } = useWeb3();

  const formatNumber = (value: string | undefined, decimals: number = 2): string => {
    if (!value || value === '0') return '0';
    const num = parseFloat(value);
    if (num < 0.01) return '< 0.01';
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals 
    });
  };

  const formatCurrency = (value: string | undefined, symbol: string = '$'): string => {
    if (!value || value === '0') return `${symbol}0`;
    const num = parseFloat(value);
    if (num < 0.01) return `${symbol}< 0.01`;
    return `${symbol}${num.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const countActiveOffers = (): number => {
    let count = 0;
    if (publicOffer?.active) count++;
    // Add community offers count when available
    return count;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Protocol Overview</h1>
          <p className="text-gray-400 mt-1">Real-time treasury and platform statistics</p>
        </div>
      </div>
      
      {/* Updated: Changed from grid-cols-2 max-w-2xl to grid-cols-4 full width */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Supply Locked"
          value={otcStats ? `${formatNumber(otcStats.contractTokenBalance)} YAFA` : "Loading..."}
          icon={Coins}
          trend="up"
        />
        <StatCard 
          title="OTC Spend"
          value={otcStats ? formatCurrency(otcStats.totalUsdtSpent) : "Loading..."}
          subtitle="Cumulative USDT"
          icon={DollarSign}
          trend="up"
        />
        <StatCard 
          title="Tokens Acquired"
          value={otcStats ? `${formatNumber(otcStats.totalTokensAcquired)} YAFA` : "Loading..."}
          subtitle="Via OTC trades"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard 
          title="Active Offers"
          value={countActiveOffers().toString()}
          subtitle="Public + Community"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <h3 className="text-xl font-semibold text-white mb-4">Upcoming Unlocks</h3>
          <div className="text-center py-12 text-gray-400">
            Connect wallet to view unlock schedule
          </div>
        </div>

        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Current Public Offer</h3>
            {publicOffer?.active && (
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                Active
              </span>
            )}
          </div>
          {publicOffer?.active ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Remaining Tokens</p>
                  <p className="font-semibold text-lg text-white">
                    {formatNumber(publicOffer.remainingTokenAmount)} YAFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Remaining USDT</p>
                  <p className="font-semibold text-lg text-emerald-400">
                    {formatCurrency(publicOffer.remainingUsdtAmount)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Time Remaining</p>
                <Countdown targetTimestamp={publicOffer.offerStartTime + publicOffer.offerDuration} />
              </div>
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-3">
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Total Offer: {formatNumber(publicOffer.totalTokenAmount)} YAFA for {formatCurrency(publicOffer.totalUsdtAmount)}</p>
                  <p>Progress: {publicOffer.totalTokenAmount && publicOffer.remainingTokenAmount ? 
                    `${(((parseFloat(publicOffer.totalTokenAmount) - parseFloat(publicOffer.remainingTokenAmount)) / parseFloat(publicOffer.totalTokenAmount)) * 100).toFixed(1)}%` : 
                    '0%'} completed</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No active public offer</p>
          )}
        </div>
      </div>

      {/* Additional Stats Section */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <h3 className="text-xl font-semibold text-white mb-4">Contract Balances</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">YAFA Token Balance</p>
            <p className="text-2xl font-bold text-white">
              {otcStats ? formatNumber(otcStats.contractTokenBalance) : "Loading..."}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total tokens in contract</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">USDT Balance</p>
            <p className="text-2xl font-bold text-emerald-400">
              {otcStats ? formatCurrency(otcStats.contractUsdtBalance) : "Loading..."}
            </p>
            <p className="text-xs text-gray-500 mt-1">Available for offers</p>
          </div>
        </div>
      </div>
    </div>
  );
};