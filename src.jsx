import React, { useState, useEffect, createContext, useContext } from 'react';
import { Clock, TrendingUp, DollarSign, Coins, Users, Calendar, ChevronDown, Moon, Sun, Wallet, RefreshCw, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';

// Types
interface UnlockEvent {
  date: Date;
  amount: string;
  recipient: string;
}

interface Offer {
  id: string;
  type: 'public' | 'private' | 'community';
  offerer: string;
  recipient?: string;
  usdtAmount: string;
  tokenAmount: string;
  expiryDate?: Date;
  active: boolean;
  percentage?: number;
}

interface ProtocolStats {
  totalSupplyLocked: string;
  totalOTCSpend: string;
  totalTokensAcquired: string;
  upcomingUnlocks: UnlockEvent[];
  activeOffers: Offer[];
}

interface UserPortfolio {
  address: string;
  lockedBalance: string;
  totalAmount: string;
  tokensOTCed: string;
  totalUsdtReceived: string;
  nextUnlockDate: Date | null;
  nextUnlockAmount: string;
  claimableNow: string;
  privateOffer?: Offer;
}

// Context
const OfferContext = createContext<{
  offers: Offer[];
  refreshOffers: () => void;
}>({
  offers: [],
  refreshOffers: () => {}
});

// Custom Hooks
const useProtocolStats = () => {
  const [stats, setStats] = useState<ProtocolStats>({
    totalSupplyLocked: '15,240,000',
    totalOTCSpend: '2,450,000',
    totalTokensAcquired: '890,000',
    upcomingUnlocks: [
      { date: new Date('2024-08-15'), amount: '1,200,000', recipient: '0x123...abc' },
      { date: new Date('2024-09-15'), amount: '850,000', recipient: '0x456...def' },
      { date: new Date('2024-10-15'), amount: '600,000', recipient: '0x789...ghi' },
    ],
    activeOffers: []
  });

  const [loading, setLoading] = useState(false);

  const refreshStats = async () => {
    setLoading(true);
    // TODO: Integrate with smart contract
    setTimeout(() => setLoading(false), 1000);
  };

  return { stats, loading, refreshStats };
};

const useUserPortfolio = (address: string) => {
  const [portfolio, setPortfolio] = useState<UserPortfolio>({
    address,
    lockedBalance: '45,000',
    totalAmount: '50,000',
    tokensOTCed: '5,000',
    totalUsdtReceived: '12,500',
    nextUnlockDate: new Date('2024-08-15'),
    nextUnlockAmount: '15,000',
    claimableNow: '5,000',
    privateOffer: {
      id: '1',
      type: 'private',
      offerer: 'Yafa Project',
      recipient: address,
      usdtAmount: '25,000',
      tokenAmount: '10,000',
      expiryDate: new Date('2024-08-30'),
      active: true
    }
  });

  const [loading, setLoading] = useState(false);

  const refreshPortfolio = async () => {
    setLoading(true);
    // TODO: Integrate with smart contract
    setTimeout(() => setLoading(false), 1000);
  };

  return { portfolio, loading, refreshPortfolio };
};

// Components
const WalletConnect = () => {
  const [connected, setConnected] = useState(true);
  const [address] = useState('0x742d35Cc6634C0532925a3b8D8C6C2c0532925');

  return (
    <div className="flex items-center space-x-3">
      {connected ? (
        <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
          <Wallet className="w-4 h-4" />
          <span className="font-medium text-sm">{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
      ) : (
        <button 
          onClick={() => setConnected(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-600 font-light text-sm">{title}</p>
        <p className="text-2xl font-medium text-gray-900 mt-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${trend === 'up' ? 'bg-green-100 text-green-600' : trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const Countdown = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft('Expired');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center space-x-1 text-sm">
      <Clock className="w-4 h-4 text-gray-500" />
      <span className="font-medium">{timeLeft}</span>
    </div>
  );
};

const OfferTable = ({ offers, title, actions = true }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Type</th>
            <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Amount</th>
            <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Price</th>
            <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Expires</th>
            {actions && <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  offer.type === 'public' ? 'bg-blue-100 text-blue-800' :
                  offer.type === 'private' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {offer.type}
                </span>
              </td>
              <td className="py-3 px-2 font-medium">{offer.tokenAmount} YAFA</td>
              <td className="py-3 px-2">${offer.usdtAmount} USDT</td>
              <td className="py-3 px-2">
                {offer.expiryDate ? <Countdown targetDate={offer.expiryDate} /> : 'No expiry'}
              </td>
              {actions && (
                <td className="py-3 px-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {offers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No active offers
        </div>
      )}
    </div>
  </div>
);

const ProgressBar = ({ current, total, label }) => {
  const percentage = (current / total) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{current.toLocaleString()}</span>
        <span>{total.toLocaleString()}</span>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-medium text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const CreateOfferModal = ({ isOpen, onClose }) => {
  const [offerType, setOfferType] = useState('community');
  const [tokenAmount, setTokenAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');

  const handleSubmit = () => {
    // TODO: Submit offer to smart contract
    console.log('Creating offer:', { offerType, tokenAmount, usdtAmount });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Offer">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Offer Type</label>
          <select 
            value={offerType} 
            onChange={(e) => setOfferType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="community">Community Offer</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Token Amount (YAFA)</label>
          <input 
            type="number" 
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter token amount"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">USDT Amount</label>
          <input 
            type="number" 
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter USDT amount"
          />
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Offer
          </button>
        </div>
      </div>
    </Modal>
  );
};

const ClaimPublicOfferModal = ({ isOpen, onClose, offer }) => {
  const [percentage, setPercentage] = useState(100);

  const handleSubmit = () => {
    // TODO: Submit claim to smart contract
    console.log('Claiming offer:', { percentage, offer });
    onClose();
  };

  if (!offer) return null;

  const claimAmount = (parseFloat(offer.tokenAmount.replace(',', '')) * percentage / 100).toLocaleString();
  const costAmount = (parseFloat(offer.usdtAmount.replace(',', '')) * percentage / 100).toLocaleString();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Claim Public Offer">
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Offer Details</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>Available: {offer.tokenAmount} YAFA</p>
            <p>Price: ${offer.usdtAmount} USDT</p>
            <p>Expires: <Countdown targetDate={offer.expiryDate} /></p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Percentage to Claim: {percentage}%
          </label>
          <input 
            type="range"
            min="1"
            max="100"
            value={percentage}
            onChange={(e) => setPercentage(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Claim Summary</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p>You will receive: <span className="font-medium">{claimAmount} YAFA</span></p>
            <p>You will pay: <span className="font-medium">${costAmount} USDT</span></p>
          </div>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Claim {percentage}%
          </button>
        </div>
      </div>
    </Modal>
  );
};

const ProtocolOverview = () => {
  const { stats, loading, refreshStats } = useProtocolStats();

  const publicOffer = {
    id: 'pub-1',
    type: 'public',
    offerer: 'Yafa Project',
    usdtAmount: '100,000',
    tokenAmount: '40,000',
    expiryDate: new Date('2024-08-30'),
    active: true
  };

  const communityOffers = [
    {
      id: 'comm-1',
      type: 'community',
      offerer: '0x123...abc',
      usdtAmount: '25,000',
      tokenAmount: '10,000',
      active: true
    },
    {
      id: 'comm-2', 
      type: 'community',
      offerer: '0x456...def',
      usdtAmount: '50,000',
      tokenAmount: '20,000',
      active: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-gray-900">Protocol Overview</h1>
          <p className="text-gray-600 mt-1">Real-time treasury and platform statistics</p>
        </div>
        <button 
          onClick={refreshStats}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Supply Locked"
          value={`${stats.totalSupplyLocked} YAFA`}
          icon={Coins}
          trend="up"
        />
        <StatCard 
          title="OTC Spend"
          value={`$${stats.totalOTCSpend}`}
          subtitle="Cumulative USDT"
          icon={DollarSign}
          trend="up"
        />
        <StatCard 
          title="Tokens Acquired"
          value={`${stats.totalTokensAcquired} YAFA`}
          subtitle="Via OTC trades"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard 
          title="Active Offers"
          value={communityOffers.length + 1}
          subtitle="Public + Community"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Unlocks</h3>
          <div className="space-y-4">
            {stats.upcomingUnlocks.map((unlock, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">{unlock.amount} YAFA</p>
                  <p className="text-sm text-gray-600">{unlock.recipient}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {unlock.date.toLocaleDateString()}
                  </p>
                  <Countdown targetDate={unlock.date} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Current Public Offer</h3>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Active
            </span>
          </div>
          {publicOffer ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">{publicOffer.tokenAmount} YAFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-medium">${publicOffer.usdtAmount} USDT</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Time Remaining</p>
                <Countdown targetDate={publicOffer.expiryDate} />
              </div>
              <ProgressBar 
                current={25000} 
                total={40000} 
                label="Claimed Progress"
              />
            </div>
          ) : (
            <p className="text-gray-500">No active public offer</p>
          )}
        </div>
      </div>

      <OfferTable 
        offers={communityOffers}
        title="Community Offers to Protocol"
        actions={false}
      />
    </div>
  );
};

const MyPortfolio = () => {
  const { portfolio, loading, refreshPortfolio } = useUserPortfolio('0x742d35Cc6634C0532925a3b8D8C6C2c0532925');
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const publicOffer = {
    id: 'pub-1',
    type: 'public',
    offerer: 'Yafa Project',
    usdtAmount: '100,000',
    tokenAmount: '40,000',
    expiryDate: new Date('2024-08-30'),
    active: true
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-gray-900">My Portfolio</h1>
          <p className="text-gray-600 mt-1">Wallet: {portfolio.address.slice(0, 6)}...{portfolio.address.slice(-4)}</p>
        </div>
        <button 
          onClick={refreshPortfolio}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Locked Balance"
          value={`${portfolio.lockedBalance} YAFA`}
          icon={Coins}
        />
        <StatCard 
          title="Claimable Now"
          value={`${portfolio.claimableNow} YAFA`}
          icon={CheckCircle}
          trend="up"
        />
        <StatCard 
          title="OTC Received"
          value={`$${portfolio.totalUsdtReceived}`}
          subtitle="USDT from sales"
          icon={DollarSign}
          trend="up"
        />
        <StatCard 
          title="Tokens Sold"
          value={`${portfolio.tokensOTCed} YAFA`}
          subtitle="Via OTC trades"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Unlock Schedule</h3>
          <div className="space-y-4">
            <ProgressBar 
              current={parseInt(portfolio.lockedBalance.replace(',', ''))} 
              total={parseInt(portfolio.totalAmount.replace(',', ''))} 
              label="Vesting Progress"
            />
            {portfolio.nextUnlockDate && (
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">Next Unlock</p>
                    <p className="text-sm text-blue-700">{portfolio.nextUnlockAmount} YAFA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-900">
                      {portfolio.nextUnlockDate.toLocaleDateString()}
                    </p>
                    <Countdown targetDate={portfolio.nextUnlockDate} />
                  </div>
                </div>
              </div>
            )}
            <button className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium">
              Claim Available Tokens
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {portfolio.privateOffer && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Private Offer for You</h3>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  Private
                </span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">You Get</p>
                    <p className="font-medium">${portfolio.privateOffer.usdtAmount} USDT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">You Give</p>
                    <p className="font-medium">{portfolio.privateOffer.tokenAmount} YAFA</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Expires</p>
                  <Countdown targetDate={portfolio.privateOffer.expiryDate} />
                </div>
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Accept Offer
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setShowCreateOffer(true)}
                className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Offer</span>
              </button>
              <button 
                onClick={() => setShowClaimModal(true)}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors"
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
        offer={publicOffer}
      />
    </div>
  );
};

const OfferCentre = () => {
  const [activeTab, setActiveTab] = useState('public');

  const publicOffers = [
    {
      id: 'pub-1',
      type: 'public',
      offerer: 'Yafa Project',
      usdtAmount: '100,000',
      tokenAmount: '40,000',
      expiryDate: new Date('2024-08-30'),
      active: true
    }
  ];

  const privateOffers = [
    {
      id: 'priv-1',
      type: 'private',
      offerer: 'Yafa Project',
      recipient: '0x123...abc',
      usdtAmount: '25,000',
      tokenAmount: '10,000',
      expiryDate: new Date('2024-08-25'),
      active: true
    }
  ];

  const communityOffers = [
    {
      id: 'comm-1',
      type: 'community',
      offerer: '0x456...def',
      usdtAmount: '50,000',
      tokenAmount: '20,000',
      active: true
    }
  ];

  const tabs = [
    { id: 'public', label: 'Public', count: publicOffers.length },
    { id: 'private', label: 'Private', count: privateOffers.length },
    { id: 'community', label: 'Community', count: communityOffers.length }
  ];

  const getCurrentOffers = () => {
    switch (activeTab) {
      case 'public': return publicOffers;
      case 'private': return privateOffers;
      case 'community': return communityOffers;
      default: return [];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-gray-900">Offer Centre</h1>
        <p className="text-gray-600 mt-1">All active offers across the platform</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Offerer</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Price</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Expires</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentOffers().map((offer) => (
                  <tr key={offer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        offer.type === 'public' ? 'bg-blue-100 text-blue-800' :
                        offer.type === 'private' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {offer.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium">
                      {offer.offerer === 'Yafa Project' ? 'Yafa Project' : 
                       `${offer.offerer.slice(0, 6)}...${offer.offerer.slice(-4)}`}
                    </td>
                    <td className="py-3 px-2 font-medium">{offer.tokenAmount} YAFA</td>
                    <td className="py-3 px-2">${offer.usdtAmount} USDT</td>
                    <td className="py-3 px-2">
                      {offer.expiryDate ? <Countdown targetDate={offer.expiryDate} /> : 'No expiry'}
                    </td>
                    <td className="py-3 px-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        {activeTab === 'public' ? 'Claim' : activeTab === 'private' ? 'Accept' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getCurrentOffers().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No active {activeTab} offers
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('protocol');
  const [darkMode, setDarkMode] = useState(false);

  const navigation = [
    { id: 'protocol', label: 'Protocol Overview', icon: TrendingUp },
    { id: 'portfolio', label: 'My Portfolio', icon: Wallet },
    { id: 'offers', label: 'Offer Centre', icon: Users }
  ];

  return (
    <OfferContext.Provider value={{ offers: [], refreshOffers: () => {} }}>
      <div className={`min-h-screen transition-colors ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Y</span>
                  </div>
                  <h1 className="text-xl font-medium text-gray-900">Yafa Project</h1>
                </div>
                
                <nav className="flex space-x-1">
                  {navigation.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentView === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <WalletConnect />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === 'protocol' && <ProtocolOverview />}
          {currentView === 'portfolio' && <MyPortfolio />}
          {currentView === 'offers' && <OfferCentre />}
        </main>
      </div>
    </OfferContext.Provider>
  );
};

export default App;