import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CONTRACT_CONFIG, YAFA_LOCK_ABI } from '../config/contracts';
import type { Web3ContextType, Web3State, VestingStatus, PublicOffer, PrivateOffer, OTCStats } from '../types/contracts';

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
  const [otcStats, setOtcStats] = useState<OTCStats | null>(null);
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
      
      // Get vesting status using the new getter method
      try {
        const vestingData = await contract.getVestingStatus(account);
        console.log('Raw vesting data:', vestingData);
        console.log('Array length:', vestingData.length);
        console.log('Array contents:', vestingData.map((item, index) => `[${index}]: ${item.toString()}`));
        
        // Handle current contract format (10 elements) vs updated format (12 elements)
        if (vestingData.length === 12) {
          // Updated contract format: [initialized, established, totalAmount, totalClaimed, tokensOTCed, totalUsdtReceived, availableTokens, claimableNow, monthsClaimed, monthsVested, nextClaimTime, initialLockDuration]
          setVestingStatus({
            initialized: vestingData[0],
            established: vestingData[1],
            totalAmount: window.ethers.utils.formatUnits(vestingData[2] || 0, 6),
            totalClaimed: window.ethers.utils.formatUnits(vestingData[3] || 0, 6),
            tokensOTCed: window.ethers.utils.formatUnits(vestingData[4] || 0, 6),
            totalUsdtReceived: window.ethers.utils.formatUnits(vestingData[5] || 0, 6),
            availableTokens: window.ethers.utils.formatUnits(vestingData[6] || 0, 6),
            claimableNow: window.ethers.utils.formatUnits(vestingData[7] || 0, 6),
            monthsClaimed: vestingData[8] ? vestingData[8].toNumber() : 0,
            monthsVested: vestingData[9] ? vestingData[9].toNumber() : 0,
            nextClaimTime: vestingData[10] ? vestingData[10].toNumber() : 0,
            initialLockDuration: vestingData[11] ? vestingData[11].toNumber() : 0,
          });
        } else if (vestingData.length === 10) {
          // Current contract format: [initialized, totalAmount, totalClaimed, tokensOTCed, totalUsdtReceived, availableTokens, claimableNow, monthsClaimed, monthsVested, nextClaimTime]
          setVestingStatus({
            initialized: vestingData[0],
            established: parseFloat(window.ethers.utils.formatUnits(vestingData[1] || 0, 6)) > 0, // If has totalAmount, it's established
            totalAmount: window.ethers.utils.formatUnits(vestingData[1] || 0, 6),
            totalClaimed: window.ethers.utils.formatUnits(vestingData[2] || 0, 6),
            tokensOTCed: window.ethers.utils.formatUnits(vestingData[3] || 0, 6),
            totalUsdtReceived: window.ethers.utils.formatUnits(vestingData[4] || 0, 6),
            availableTokens: window.ethers.utils.formatUnits(vestingData[5] || 0, 6),
            claimableNow: window.ethers.utils.formatUnits(vestingData[6] || 0, 6),
            monthsClaimed: vestingData[7] ? vestingData[7].toNumber() : 0,
            monthsVested: vestingData[8] ? vestingData[8].toNumber() : 0,
            nextClaimTime: vestingData[9] ? vestingData[9].toNumber() : 0,
            initialLockDuration: 0, // Not available in current contract
          });
        } else {
          throw new Error(`Unexpected array length: ${vestingData.length}`);
        }
      } catch (vestingError) {
        console.error('Error fetching vesting data:', vestingError);
        // Set default vesting status if user hasn't initialized
        setVestingStatus({
          initialized: false,
          established: false,
          totalAmount: '0',
          totalClaimed: '0',
          tokensOTCed: '0',
          totalUsdtReceived: '0',
          availableTokens: '0',
          claimableNow: '0',
          monthsClaimed: 0,
          monthsVested: 0,
          nextClaimTime: 0,
          initialLockDuration: 0,
        });
      }
      
      // Get public offer using the new getter method
      try {
        const publicOfferData = await contract.getPublicOffer();
        console.log('Raw public offer data:', publicOfferData);
        
        // Handle array response - [totalUsdtAmount, totalTokenAmount, remainingUsdtAmount, remainingTokenAmount, offerDuration, offerStartTime, timeRemaining, active, expired]
        setPublicOffer({
          totalUsdtAmount: window.ethers.utils.formatUnits(publicOfferData[0], 6),
          totalTokenAmount: window.ethers.utils.formatUnits(publicOfferData[1], 6),
          remainingUsdtAmount: window.ethers.utils.formatUnits(publicOfferData[2], 6),
          remainingTokenAmount: window.ethers.utils.formatUnits(publicOfferData[3], 6),
          offerDuration: publicOfferData[4].toNumber(),
          offerStartTime: publicOfferData[5].toNumber(),
          timeRemaining: publicOfferData[6].toNumber(),
          active: publicOfferData[7],
          expired: publicOfferData[8],
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
      
      // Get private offer using the new getter method
      try {
        const privateOfferData = await contract.getPrivateOffer(account);
        console.log('Raw private offer data:', privateOfferData);
        
        // Handle array response - [recipient, usdtAmount, tokenAmount, offerDuration, offerStartTime, timeRemaining, active, expired]
        setPrivateOffer({
          recipient: privateOfferData[0],
          usdtAmount: window.ethers.utils.formatUnits(privateOfferData[1], 6),
          tokenAmount: window.ethers.utils.formatUnits(privateOfferData[2], 6),
          offerDuration: privateOfferData[3].toNumber(),
          offerStartTime: privateOfferData[4].toNumber(),
          timeRemaining: privateOfferData[5].toNumber(),
          active: privateOfferData[6],
          expired: privateOfferData[7],
        });
      } catch (privateOfferError) {
        console.error('Error fetching private offer:', privateOfferError);
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
      }

      // Get OTC statistics - use fallback methods if getOTCStats doesn't exist
      try {
        let otcStatsData;
        
        // Try the new method first
        try {
          otcStatsData = await contract.getOTCStats();
          console.log('Raw OTC stats data:', otcStatsData);
          
          // Handle array response - [totalUsdtSpent, totalTokensAcquired, contractTokenBalance, contractUsdtBalance]
          setOtcStats({
            totalUsdtSpent: window.ethers.utils.formatUnits(otcStatsData[0], 6),
            totalTokensAcquired: window.ethers.utils.formatUnits(otcStatsData[1], 6),
            contractTokenBalance: window.ethers.utils.formatUnits(otcStatsData[2], 6),
            contractUsdtBalance: window.ethers.utils.formatUnits(otcStatsData[3], 6),
          });
        } catch (newMethodError) {
          console.log('getOTCStats not available, using fallback methods');
          
          // Fallback to individual method calls
          const [totalUsdtSpent, totalTokensAcquired, contractTokenBalance, contractUsdtBalance] = await Promise.all([
            contract.totalOTCUsdtSpent ? contract.totalOTCUsdtSpent() : Promise.resolve(0),
            contract.totalOTCTokensAcquired ? contract.totalOTCTokensAcquired() : Promise.resolve(0),
            contract.getContractTokenBalance(),
            contract.getContractUSDTBalance()
          ]);
          
          setOtcStats({
            totalUsdtSpent: window.ethers.utils.formatUnits(totalUsdtSpent, 6),
            totalTokensAcquired: window.ethers.utils.formatUnits(totalTokensAcquired, 6),
            contractTokenBalance: window.ethers.utils.formatUnits(contractTokenBalance, 6),
            contractUsdtBalance: window.ethers.utils.formatUnits(contractUsdtBalance, 6),
          });
        }
      } catch (otcStatsError) {
        console.error('Error fetching OTC stats:', otcStatsError);
        setOtcStats({
          totalUsdtSpent: '0',
          totalTokensAcquired: '0',
          contractTokenBalance: '0',
          contractUsdtBalance: '0',
        });
      }
      
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
          setOtcStats(null);
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
    otcStats,
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