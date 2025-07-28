// Contract Configuration
export const CONTRACT_CONFIG = {
  // Replace these with your actual deployed contract addresses
  YAFA_LOCK_ADDRESS: '0x60886a69dB0dF9FBc03C420FfB16De4038279B2b', 
  YAFA_TOKEN_ADDRESS: '0xB95a30Af9A812a1C633A98fB2F5A7257aCdc2cE1',
  USDT_ADDRESS: '0x81eA976BdeEe2151171a7a2c19Bad80b6C629afd',
  CHAIN_ID: 8453, // Base Mainnet
  RPC_URL: 'https://base.drpc.org'
};

// ABI for the YafaLock contract 
export const YAFA_LOCK_ABI = [
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
    "name": "acceptPublicOTCOffer",
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
    "inputs": [],
    "name": "getOTCStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalUsdtSpent",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalTokensAcquired",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "contractTokenBalance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "contractUsdtBalance",
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
        "internalType": "bool",
        "name": "established",
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
      },
      {
        "internalType": "uint256",
        "name": "initialLockDuration",
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
        "name": "_users",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_amounts",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_lockDurations",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_monthsVested",
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
    "inputs": [],
    "name": "totalOTCTokensAcquired",
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
    "name": "totalOTCUsdtSpent",
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
];