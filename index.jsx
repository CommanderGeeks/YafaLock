import React, { useState, useEffect, createContext, useContext } from 'react';
import { Clock, TrendingUp, DollarSign, Coins, Users, Calendar, ChevronDown, Moon, Sun, Wallet, RefreshCw, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';

// Contract Configuration
const CONTRACT_CONFIG = {
  // Replace these with your actual deployed contract addresses
  YAFA_LOCK_ADDRESS: '0x97ce16B79Bd47a6A24558F9d87F1D4f09a3e6504',
  YAFA_TOKEN_ADDRESS: '0xB95a30Af9A812a1C633A98fB2F5A7257aCdc2cE1',
  USDT_ADDRESS: '0x81eA976BdeEe2151171a7a2c19Bad80b6C629afd',
  CHAIN_ID: 8453, // Base Mainnet
  RPC_URL: 'https://base.drpc.org'
};

// ABI for the YafaLock contract 
const YAFA_LOCK_ABI = [
  [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_token",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_usdt",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "usdtAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "percentage",
				"type": "uint256"
			}
		],
		"name": "CommunityMemberOfferAccepted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "usdtAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			}
		],
		"name": "CommunityMemberOfferCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "offerType",
				"type": "string"
			}
		],
		"name": "OfferExpired",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "usdtAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			}
		],
		"name": "PrivateOfferAccepted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "usdtAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "duration",
				"type": "uint256"
			}
		],
		"name": "PrivateOfferCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "usdtAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "percentage",
				"type": "uint256"
			}
		],
		"name": "PublicOfferAccepted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalUsdtAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalTokenAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "duration",
				"type": "uint256"
			}
		],
		"name": "PublicOfferCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "refundedUsdt",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "refundedTokens",
				"type": "uint256"
			}
		],
		"name": "PublicOfferRevoked",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "monthsClaimed",
				"type": "uint256"
			}
		],
		"name": "TokensClaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "TokensLocked",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_percentage",
				"type": "uint256"
			}
		],
		"name": "acceptCommunityMemberOTCOffer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "acceptPrivateOTC",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_percentage",
				"type": "uint256"
			}
		],
		"name": "acceptPublicOTC",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "claimVestedTokens",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_usdtAmt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_tokenAmt",
				"type": "uint256"
			}
		],
		"name": "communityMemberOTCOffer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "communityMemberOffers",
		"outputs": [
			{
				"internalType": "address",
				"name": "offerer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "usdtAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllActiveOffers",
		"outputs": [
			{
				"internalType": "bool",
				"name": "publicOfferActive",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "publicOfferUsdt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "publicOfferTokens",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getClaimableTokens",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getCommunityMemberOffer",
		"outputs": [
			{
				"internalType": "address",
				"name": "offerer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "usdtAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractTokenBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractUSDTBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getNextClaimTime",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getPrivateOffer",
		"outputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "usdtAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tokenAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "offerDuration",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "offerStartTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timeRemaining",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "expired",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPublicOffer",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalUsdtAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalTokenAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "remainingUsdtAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "remainingTokenAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "offerDuration",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "offerStartTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timeRemaining",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "expired",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalClaimableTokens",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getUserAvailableTokens",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getVestingStatus",
		"outputs": [
			{
				"internalType": "bool",
				"name": "initialized",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "totalAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalClaimed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tokensOTCed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalUsdtReceived",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "availableTokens",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "claimableNow",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "monthsClaimed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "monthsVested",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "nextClaimTime",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "addys",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "tokenAmts",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "initialLocks",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "monthsVested",
				"type": "uint256[]"
			}
		],
		"name": "initializeLocks",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lock",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_usdtAmt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_tokenAmt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_duration",
				"type": "uint256"
			}
		],
		"name": "privateOTCOffer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "projectAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_usdtAmt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_tokenAmt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_duration",
				"type": "uint256"
			}
		],
		"name": "publicOTCOffer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "publicOffer",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalUsdtAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalTokenAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "remainingUsdtAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "remainingTokenAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "offerDuration",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "offerStartTime",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "remainingVestedPeople",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "revokeCommunityMemberOTCOffer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_recipient",
				"type": "address"
			}
		],
		"name": "revokePrivateOTC",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "revokePublicOTC",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "token",
		"outputs": [
			{
				"internalType": "contract IERC20",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "usdt",
		"outputs": [
			{
				"internalType": "contract IERC20",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "vestingInfo",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "initialLockTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "initialLockDuration",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "monthsVested",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "monthsClaimed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalClaimed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tokensVested",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tokensOTCed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalUsdtReceived",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalPendingTokens",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "established",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "initialized",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
];

// Types
interface VestingStatus {
  initialized: boolean;
  totalAmount: string;
  totalClaimed: string;
  tokensOTCed: string;
  totalUsdtReceived: string;
  availableTokens: string;
  claimableNow: string;
  monthsClaimed: number;
  monthsVested: number;
  nextClaimTime: number;
}

interface PublicOffer {
  totalUsdtAmount: string;
  totalTokenAmount: string;
  remainingUsdtAmount: string;
  remainingTokenAmount: string;
  offerDuration: number;
  offerStartTime: number;
  timeRemaining: number;
  active: boolean;
  expired: boolean;
}

interface PrivateOffer {
  recipient: string;
  usdtAmount: string;
  tokenAmount: string;
  offerDuration: number;
  offerStartTime: number;
  timeRemaining: number;
  active: boolean;
  expired: boolean;
}

interface Web3State {
  account: string | null;
  connected: boolean;
  contract: any;
  provider: any;
  signer: any;
}

// Web3 Context
const Web3Context = createContext<{
  web3State: Web3State;
  connectWallet: () => Promise<void>;
  refreshData: () => Promise<void>;
  vestingStatus: VestingStatus | null;
  publicOffer: PublicOffer | null;
  privateOffer: PrivateOffer | null;
  loading: boolean;
  error: string | null;
}>({
  web3State: { account: null, connected: false, contract: null, provider: null, signer: null },
  connectWallet: async () => {},
  refreshData: async () => {},
  vestingStatus: null,
  publicOffer: null,
  privateOffer: null,
  loading: false,
  error: null,
});

// Web3 Provider Component
const Web3Provider = ({ children }) => {
  const [web3State, setWeb3State] = useState<Web3State>({
    account: null,
    connected: false,
    contract: null,
    provider: null,
    signer: null,
  });
  const [vestingStatus, setVestingStatus] = useState<VestingStatus | null>(null);
  const [publicOffer, setPublicOffer] = useState<PublicOffer | null>(null);
  const [privateOffer, setPrivateOffer] = useState<PrivateOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        setLoading(true);
        setError(null);
        
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          // Create ethers provider and signer
          const provider = new window.ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          
          // Create contract instance
          const contract = new window.ethers.Contract(
            CONTRACT_CONFIG.YAFA_LOCK_ADDRESS,
            YAFA_LOCK_ABI,
            signer
          );
          
          setWeb3State({
            account: accounts[0],
            connected: true,
            contract,
            provider,
            signer,
          });
          
          // Load initial data
          await refreshDataWithContract(contract, accounts[0]);
        }
      } else {
        setError('Please install MetaMask or another Web3 wallet');
      }
    } catch (err) {
      setError(`Failed to connect wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshDataWithContract = async (contract: any, account: string) => {
    try {
      setLoading(true);
      
      // Get vesting status
      const vestingData = await contract.getVestingStatus(account);
      setVestingStatus({
        initialized: vestingData.initialized,
        totalAmount: window.ethers.utils.formatUnits(vestingData.totalAmount, 18),
        totalClaimed: window.ethers.utils.formatUnits(vestingData.totalClaimed, 18),
        tokensOTCed: window.ethers.utils.formatUnits(vestingData.tokensOTCed, 18),
        totalUsdtReceived: window.ethers.utils.formatUnits(vestingData.totalUsdtReceived, 6),
        availableTokens: window.ethers.utils.formatUnits(vestingData.availableTokens, 18),
        claimableNow: window.ethers.utils.formatUnits(vestingData.claimableNow, 18),
        monthsClaimed: vestingData.monthsClaimed.toNumber(),
        monthsVested: vestingData.monthsVested.toNumber(),
        nextClaimTime: vestingData.nextClaimTime.toNumber(),
      });
      
      // Get public offer
      const publicOfferData = await contract.getPublicOffer();
      setPublicOffer({
        totalUsdtAmount: window.ethers.utils.formatUnits(publicOfferData.totalUsdtAmount, 6),
        totalTokenAmount: window.ethers.utils.formatUnits(publicOfferData.totalTokenAmount, 18),
        remainingUsdtAmount: window.ethers.utils.formatUnits(publicOfferData.remainingUsdtAmount, 6),
        remainingTokenAmount: window.ethers.utils.formatUnits(publicOfferData.remainingTokenAmount, 18),
        offerDuration: publicOfferData.offerDuration.toNumber(),
        offerStartTime: publicOfferData.offerStartTime.toNumber(),
        timeRemaining: publicOfferData.timeRemaining.toNumber(),
        active: publicOfferData.active,
        expired: publicOfferData.expired,
      });
      
      // Get private offer
      const privateOfferData = await contract.getPrivateOffer(account);
      setPrivateOffer({
        recipient: privateOfferData.recipient,
        usdtAmount: window.ethers.utils.formatUnits(privateOfferData.usdtAmount, 6),
        tokenAmount: window.ethers.utils.formatUnits(privateOfferData.tokenAmount, 18),
        offerDuration: privateOfferData.offerDuration.toNumber(),
        offerStartTime: privateOfferData.offerStartTime.toNumber(),
        timeRemaining: privateOfferData.timeRemaining.toNumber(),
        active: privateOfferData.active,
        expired: privateOfferData.expired,
      });
      
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (web3State.contract && web3State.account) {
      await refreshDataWithContract(web3State.contract, web3State.account);
    }
  };

  return (
    <Web3Context.Provider value={{
      web3State,
      connectWallet,
      refreshData,
      vestingStatus,
      publicOffer,
      privateOffer,
      loading,
      error,
    }}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom Hook
const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

// Components
const WalletConnect = () => {
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

const StatCard = ({ title, value, subtitle, icon: Icon, trend, className = "" }) => (
  <div className={`bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${className}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-gray-400 font-medium text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg border ${
        trend === 'up' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 
        trend === 'down' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 
        'bg-gray-700/40 border-gray-600/30 text-gray-400'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const Countdown = ({ targetTimestamp }: { targetTimestamp: number }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetTimestamp) {
      setTimeLeft('No expiry');
      return;
    }

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const difference = targetTimestamp - now;

      if (difference > 0) {
        const days = Math.floor(difference / (24 * 60 * 60));
        const hours = Math.floor((difference % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((difference % (60 * 60)) / 60);
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft('Expired');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTimestamp]);

  return (
    <div className="flex items-center space-x-1 text-sm">
      <Clock className="w-4 h-4 text-gray-400" />
      <span className="font-medium text-gray-300">{timeLeft}</span>
    </div>
  );
};

const TransactionButton = ({ onClick, children, disabled = false, variant = 'primary' }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      await onClick();
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = "px-6 py-3 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 border";
  const variantClasses = {
    primary: "bg-emerald-500 hover:bg-emerald-400 text-gray-900 border-emerald-400/30 hover:shadow-[0_0_20px_rgba(19,255,145,0.4)]",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30 hover:shadow-[0_0_20px_rgba(19,255,145,0.3)]",
    warning: "bg-orange-500 hover:bg-orange-400 text-gray-900 border-orange-400/30 hover:shadow-[0_0_20px_rgba(251,146,60,0.4)]",
    secondary: "bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border-gray-600/30 backdrop-blur-sm"
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
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
  const { web3State } = useWeb3();
  const [tokenAmount, setTokenAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');

  const handleSubmit = async () => {
    try {
      if (!web3State.contract) return;
      
      const tokenAmountWei = window.ethers.utils.parseUnits(tokenAmount, 18);
      const usdtAmountWei = window.ethers.utils.parseUnits(usdtAmount, 6);
      
      const tx = await web3State.contract.communityMemberOTCOffer(usdtAmountWei, tokenAmountWei);
      await tx.wait();
      
      onClose();
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Community Offer">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Token Amount (YAFA)</label>
          <input 
            type="number" 
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-sm"
            placeholder="Enter token amount"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">USDT Amount</label>
          <input 
            type="number" 
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-sm"
            placeholder="Enter USDT amount"
          />
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600/30 py-3 px-4 rounded-full transition-colors backdrop-blur-sm"
          >
            Cancel
          </button>
          <TransactionButton 
            onClick={handleSubmit}
            disabled={!tokenAmount || !usdtAmount}
            variant="primary"
          >
            <div className="flex-1">Create Offer</div>
          </TransactionButton>
        </div>
      </div>
    </Modal>
  );
};

const ClaimPublicOfferModal = ({ isOpen, onClose }) => {
  const { web3State, publicOffer } = useWeb3();
  const [percentage, setPercentage] = useState(100);

  const handleSubmit = async () => {
    try {
      if (!web3State.contract) return;
      
      const tx = await web3State.contract.acceptPublicOTC(percentage);
      await tx.wait();
      
      onClose();
    } catch (error) {
      console.error('Failed to claim offer:', error);
    }
  };

  if (!publicOffer || !publicOffer.active) return null;

  const claimAmount = (parseFloat(publicOffer.remainingTokenAmount) * percentage / 100).toFixed(4);
  const costAmount = (parseFloat(publicOffer.remainingUsdtAmount) * percentage / 100).toFixed(2);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Claim Public Offer">
      <div className="space-y-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <h4 className="font-semibold text-emerald-400 mb-2">Offer Details</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p>Available: <span className="text-white font-medium">{parseFloat(publicOffer.remainingTokenAmount).toFixed(4)} YAFA</span></p>
            <p>Price: <span className="text-white font-medium">${parseFloat(publicOffer.remainingUsdtAmount).toFixed(2)} USDT</span></p>
            <p>Expires: <Countdown targetTimestamp={publicOffer.offerStartTime + publicOffer.offerDuration} /></p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Percentage to Claim: <span className="text-emerald-400">{percentage}%</span>
          </label>
          <input 
            type="range"
            min="1"
            max="100"
            value={percentage}
            onChange={(e) => setPercentage(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #374151 ${percentage}%, #374151 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">Claim Summary</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p>You will receive: <span className="font-semibold text-emerald-400">{claimAmount} YAFA</span></p>
            <p>You will pay: <span className="font-semibold text-emerald-400">${costAmount} USDT</span></p>
          </div>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600/30 py-3 px-4 rounded-full transition-colors backdrop-blur-sm"
          >
            Cancel
          </button>
          <TransactionButton 
            onClick={handleSubmit}
            variant="success"
          >
            <div className="flex-1">Claim {percentage}%</div>
          </TransactionButton>
        </div>
      </div>
    </Modal>
  );
};

const MyPortfolio = () => {
  const { vestingStatus, privateOffer, publicOffer, web3State, refreshData, loading } = useWeb3();
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const handleLockTokens = async () => {
    try {
      if (!web3State.contract) return;
      
      const tx = await web3State.contract.lock();
      await tx.wait();
      await refreshData();
    } catch (error) {
      console.error('Failed to lock tokens:', error);
    }
  };

  const handleClaimVested = async () => {
    try {
      if (!web3State.contract) return;
      
      const tx = await web3State.contract.claimVestedTokens();
      await tx.wait();
      await refreshData();
    } catch (error) {
      console.error('Failed to claim tokens:', error);
    }
  };

  const handleAcceptPrivateOffer = async () => {
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
          <WalletConnect />
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

const ProtocolOverview = () => {
  const { publicOffer, loading } = useWeb3();

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

const App = () => {
  const [currentView, setCurrentView] = useState('protocol');

  const navigation = [
    { id: 'protocol', label: 'Protocol Overview', icon: TrendingUp },
    { id: 'portfolio', label: 'My Portfolio', icon: Wallet },
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