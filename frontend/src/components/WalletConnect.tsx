import React from 'react';
import { Wallet } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

export const WalletConnect: React.FC = () => {
  const { web3State, connectWallet, loading } = useWeb3();

  return (
    <div className="flex items-center space-x-3">
      {web3State.connected ? (
        <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full border border-gray-200/50 shadow-sm">
          <Wallet className="w-4 h-4" />
          <span className="font-medium text-sm">
            {web3State.account?.slice(0, 6)}...{web3State.account?.slice(-4)}
          </span>
        </div>
      ) : (
        <button 
          onClick={connectWallet}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold px-6 py-2.5 rounded-full transition-all duration-200 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(19,255,145,0.4)] border border-emerald-400/30"
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
};