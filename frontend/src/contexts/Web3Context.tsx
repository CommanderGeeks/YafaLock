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
        
        console.log('Connecting wallet...');
        
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        console.log('Accounts:', accounts);
        
        if (accounts.length > 0) {
          // Check if ethers is available
          if (!window.ethers) {
            throw new Error('Ethers.js library not loaded');
          }
          
          // Create ethers provider and signer
          const provider = new window.ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          
          // Check network
          const network = await provider.getNetwork();
          console.log('Current network:', network);
          
          if (network.chainId !== CONTRACT_CONFIG.CHAIN_ID) {
            console.warn(`Wrong network. Expected ${CONTRACT_CONFIG.CHAIN_ID}, got ${network.chainId}`);
            // You might want to prompt user to switch networks here
          }
          
          // Create contract instance
          const contract = new window.ethers.Contract(
            CONTRACT_CONFIG.YAFA_LOCK_ADDRESS,
            YAFA_LOCK_ABI,
            signer
          );
          
          console.log('Contract created:', contract.address);
          
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
      console.error('Wallet connection error:', err);
      setError(`Failed to connect wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshDataWithContract = async (contract: any, account: string): Promise<void> => {
    try {
      setLoading(true);
      console.log('Refreshing contract data for account:', account);
      
      // Get vesting status using the actual contract method
      try {
        const vestingData = await contract.vestingInfo(account);
        console.log('Raw vesting data:', vestingData);
        
        // Calculate derived values
        const totalAmount = vestingData.totalAmount;
        const monthsVested = vestingData.monthsVested;
        const monthsClaimed = vestingData.monthsClaimed;
        const totalClaimed = vestingData.totalClaimed;
        const tokensOTCed = vestingData.tokensOTCed;
        const totalUsdtReceived = vestingData.totalUsdtReceived;
        
        // Calculate available and claimable tokens
        // This logic should match your smart contract's calculation
        const currentTime = Math.floor(Date.now() / 1000);
        const monthsSinceStart = monthsVested.toNumber();
        const availableForClaim = monthsSinceStart > monthsClaimed.toNumber() ? 
          totalAmount.div(24).mul(monthsSinceStart - monthsClaimed.toNumber()) : 0;
        
        setVestingStatus({
          initialized: vestingData.initialized,
          totalAmount: window.ethers.utils.formatUnits(totalAmount, 18),
          totalClaimed: window.ethers.utils.formatUnits(totalClaimed, 18),
          tokensOTCed: window.ethers.utils.formatUnits(tokensOTCed, 18),
          totalUsdtReceived: window.ethers.utils.formatUnits(totalUsdtReceived, 6),
          availableTokens: window.ethers.utils.formatUnits(totalAmount.sub(totalClaimed).sub(tokensOTCed), 18),
          claimableNow: window.ethers.utils.formatUnits(availableForClaim, 18),
          monthsClaimed: monthsClaimed.toNumber(),
          monthsVested: monthsVested.toNumber(),
          nextClaimTime: vestingData.initialLockTime.toNumber() + ((monthsClaimed.toNumber() + 1) * 30 * 24 * 60 * 60), // Rough calculation
        });
      } catch (vestingError) {
        console.error('Error fetching vesting data:', vestingError);
        // Set default vesting status if user hasn't initialized
        setVestingStatus({
          initialized: false,
          totalAmount: '0',
          totalClaimed: '0',
          tokensOTCed: '0',
          totalUsdtReceived: '0',
          availableTokens: '0',
          claimableNow: '0',
          monthsClaimed: 0,
          monthsVested: 0,
          nextClaimTime: 0,
        });
      }
      
      // Get public offer using the actual contract method
      try {
        const publicOfferData = await contract.publicOffer();
        console.log('Raw public offer data:', publicOfferData);
        
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = Math.max(0, publicOfferData.offerStartTime.toNumber() + publicOfferData.offerDuration.toNumber() - currentTime);
        const expired = timeRemaining === 0;
        
        setPublicOffer({
          totalUsdtAmount: window.ethers.utils.formatUnits(publicOfferData.totalUsdtAmount, 6),
          totalTokenAmount: window.ethers.utils.formatUnits(publicOfferData.totalTokenAmount, 18),
          remainingUsdtAmount: window.ethers.utils.formatUnits(publicOfferData.remainingUsdtAmount, 6),
          remainingTokenAmount: window.ethers.utils.formatUnits(publicOfferData.remainingTokenAmount, 18),
          offerDuration: publicOfferData.offerDuration.toNumber(),
          offerStartTime: publicOfferData.offerStartTime.toNumber(),
          timeRemaining,
          active: publicOfferData.active && !expired,
          expired,
        });
      } catch (publicOfferError) {
        console.error('Error fetching public offer:', publicOfferError);
        setPublicOffer({
          totalUsdtAmount: '0',
          totalTokenAmount: '0',
          remainingUsdtAmount: '0',
          remainingTokenAmount: '0',
          offerDuration: 0,
          offerStartTime: 0,
          timeRemaining: 0,
          active: false,
          expired: true,
        });
      }
      
      // Note: Private offers might need to be fetched differently
      // since there's no direct getter in the contract
      setPrivateOffer({
        recipient: '',
        usdtAmount: '0',
        tokenAmount: '0',
        offerDuration: 0,
        offerStartTime: 0,
        timeRemaining: 0,
        active: false,
        expired: true,
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

      const handleChainChanged = (chainId: string) => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Auto-connect if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();
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