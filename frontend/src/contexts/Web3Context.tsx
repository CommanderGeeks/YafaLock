import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CONTRACT_CONFIG, YAFA_LOCK_ABI } from '../config/contracts';
import type { Web3ContextType, Web3State, VestingStatus, PublicOffer, PrivateOffer } from '../types/contracts';

// Create the context
const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

// Web3 Provider Component
export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
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

  const connectWallet = async (): Promise<void> => {
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
    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshDataWithContract = async (contract: any, account: string): Promise<void> => {
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
      
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async (): Promise<void> => {
    if (web3State.contract && web3State.account) {
      await refreshDataWithContract(web3State.contract, web3State.account);
    }
  };

  // Check for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setWeb3State({
            account: null,
            connected: false,
            contract: null,
            provider: null,
            signer: null,
          });
          setVestingStatus(null);
          setPublicOffer(null);
          setPrivateOffer(null);
        } else {
          // Account changed
          connectWallet();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  const value: Web3ContextType = {
    web3State,
    connectWallet,
    refreshData,
    vestingStatus,
    publicOffer,
    privateOffer,
    loading,
    error,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom Hook
export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};