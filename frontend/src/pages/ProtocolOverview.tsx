import React from 'react';
import { Coins, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { StatCard, Countdown } from '../components/shared';

export const ProtocolOverview: React.FC = () => {
  const { publicOffer } = useWeb3();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Protocol Overview</h1>
          <p className="text-gray-400 mt-1">Real-time treasury and platform statistics</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        <StatCard 
          title="Total Supply Locked"
          value="Loading..."
          icon={Coins}
          trend="up"
        />
        <StatCard 
          title="OTC Spend"
          value="Loading..."
          subtitle="Cumulative USDT"
          icon={DollarSign}
          trend="up"
        />
        <StatCard 
          title="Tokens Acquired"
          value="Loading..."
          subtitle="Via OTC trades"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard 
          title="Active Offers"
          value={publicOffer?.active ? "1+" : "0"}
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
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="font-semibold text-lg text-white">{parseFloat(publicOffer.remainingTokenAmount).toFixed(2)} YAFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Price</p>
                  <p className="font-semibold text-lg text-emerald-400">${parseFloat(publicOffer.remainingUsdtAmount).toFixed(2)} USDT</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Time Remaining</p>
                <Countdown targetTimestamp={publicOffer.offerStartTime + publicOffer.offerDuration} />
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No active public offer</p>
          )}
        </div>
      </div>
    </div>
  );
};