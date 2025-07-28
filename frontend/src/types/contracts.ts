// Contract Types and Interfaces
export interface VestingStatus {
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

export interface PublicOffer {
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

export interface PrivateOffer {
  recipient: string;
  usdtAmount: string;
  tokenAmount: string;
  offerDuration: number;
  offerStartTime: number;
  timeRemaining: number;
  active: boolean;
  expired: boolean;
}

export interface CommunityMemberOffer {
  offerer: string;
  usdtAmount: string;
  tokenAmount: string;
  active: boolean;
}

export interface OTCStats {
  totalUsdtSpent: string;
  totalTokensAcquired: string;
  contractTokenBalance: string;
  contractUsdtBalance: string;
}

export interface Web3State {
  account: string | null;
  connected: boolean;
  contract: any;
  provider: any;
  signer: any;
}

export interface Web3ContextType {
  web3State: Web3State;
  connectWallet: () => Promise<void>;
  refreshData: () => Promise<void>;
  vestingStatus: VestingStatus | null;
  publicOffer: PublicOffer | null;
  privateOffer: PrivateOffer | null;
  otcStats: OTCStats | null;
  loading: boolean;
  error: string | null;
}

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
    ethers?: any;
  }
}