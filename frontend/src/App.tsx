import React, { useState } from 'react';
import { TrendingUp, Wallet } from 'lucide-react';
import { Web3Provider } from './contexts/Web3Context';
import { WalletConnect } from './components/WalletConnect';
import { ProtocolOverview } from './pages/ProtocolOverview';
import { MyPortfolio } from './pages/MyPortfolio';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'protocol' | 'portfolio'>('protocol');

  const navigation = [
    { id: 'protocol' as const, label: 'Protocol Overview', icon: TrendingUp },
    { id: 'portfolio' as const, label: 'My Portfolio', icon: Wallet },
  ];

  return (
    <Web3Provider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <header className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <span className="text-gray-900 font-bold text-sm">Y</span>
                  </div>
                  <h1 className="text-xl font-semibold text-white">Yafa Project</h1>
                </div>
                
                <nav className="flex space-x-1">
                  {navigation.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentView === item.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <WalletConnect />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === 'protocol' && <ProtocolOverview />}
          {currentView === 'portfolio' && <MyPortfolio />}
        </main>
      </div>
    </Web3Provider>
  );
};

export default App;