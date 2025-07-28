// src/utils/tokenApproval.ts

import { CONTRACT_CONFIG } from '../config/contracts';

// Standard ERC20 ABI for approval functions
const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export interface ApprovalStatus {
  hasAllowance: boolean;
  currentAllowance: string;
  needsApproval: boolean;
  balance: string;
  hasBalance: boolean;
}

export class TokenApprovalHelper {
  private provider: any;
  private signer: any;
  private userAddress: string;

  constructor(provider: any, signer: any, userAddress: string) {
    this.provider = provider;
    this.signer = signer;
    this.userAddress = userAddress;
  }

  /**
   * Check USDT approval status for the lock contract
   */
  async checkUSDTApproval(requiredAmount: string): Promise<ApprovalStatus> {
    try {
      const usdtContract = new window.ethers.Contract(
        CONTRACT_CONFIG.USDT_ADDRESS,
        ERC20_ABI,
        this.provider
      );

      const requiredAmountWei = window.ethers.utils.parseUnits(requiredAmount, 6);
      
      // Get current allowance
      const allowance = await usdtContract.allowance(
        this.userAddress, 
        CONTRACT_CONFIG.YAFA_LOCK_ADDRESS
      );
      
      // Get user balance
      const balance = await usdtContract.balanceOf(this.userAddress);
      
      const hasAllowance = allowance.gte(requiredAmountWei);
      const hasBalance = balance.gte(requiredAmountWei);
      
      return {
        hasAllowance,
        currentAllowance: window.ethers.utils.formatUnits(allowance, 6),
        needsApproval: !hasAllowance,
        balance: window.ethers.utils.formatUnits(balance, 6),
        hasBalance
      };
    } catch (error) {
      console.error('Error checking USDT approval:', error);
      throw error;
    }
  }

  /**
   * Approve USDT spending for the lock contract
   */
  async approveUSDT(amount: string): Promise<string> {
    try {
      const usdtContract = new window.ethers.Contract(
        CONTRACT_CONFIG.USDT_ADDRESS,
        ERC20_ABI,
        this.signer
      );

      const amountWei = window.ethers.utils.parseUnits(amount, 6);
      
      console.log('Approving USDT spend:', {
        amount,
        amountWei: amountWei.toString(),
        spender: CONTRACT_CONFIG.YAFA_LOCK_ADDRESS
      });

      const tx = await usdtContract.approve(CONTRACT_CONFIG.YAFA_LOCK_ADDRESS, amountWei);
      console.log('Approval transaction sent:', tx.hash);
      
      await tx.wait();
      console.log('USDT approval confirmed');
      
      return tx.hash;
    } catch (error) {
      console.error('Error approving USDT:', error);
      throw error;
    }
  }

  /**
   * Approve maximum USDT amount (for convenience)
   */
  async approveMaxUSDT(): Promise<string> {
    try {
      const usdtContract = new window.ethers.Contract(
        CONTRACT_CONFIG.USDT_ADDRESS,
        ERC20_ABI,
        this.signer
      );

      // Max uint256 value for unlimited approval
      const maxAmount = window.ethers.constants.MaxUint256;
      
      console.log('Approving unlimited USDT spend');

      const tx = await usdtContract.approve(CONTRACT_CONFIG.YAFA_LOCK_ADDRESS, maxAmount);
      console.log('Max approval transaction sent:', tx.hash);
      
      await tx.wait();
      console.log('USDT max approval confirmed');
      
      return tx.hash;
    } catch (error) {
      console.error('Error approving max USDT:', error);
      throw error;
    }
  }

  /**
   * Check YAFA token approval status for the lock contract (for community offers)
   */
  async checkYAFAApproval(requiredAmount: string): Promise<ApprovalStatus> {
    try {
      const yafaContract = new window.ethers.Contract(
        CONTRACT_CONFIG.YAFA_TOKEN_ADDRESS,
        ERC20_ABI,
        this.provider
      );

      const requiredAmountWei = window.ethers.utils.parseUnits(requiredAmount, 6);
      
      const allowance = await yafaContract.allowance(
        this.userAddress, 
        CONTRACT_CONFIG.YAFA_LOCK_ADDRESS
      );
      
      const balance = await yafaContract.balanceOf(this.userAddress);
      
      const hasAllowance = allowance.gte(requiredAmountWei);
      const hasBalance = balance.gte(requiredAmountWei);
      
      return {
        hasAllowance,
        currentAllowance: window.ethers.utils.formatUnits(allowance, 6),
        needsApproval: !hasAllowance,
        balance: window.ethers.utils.formatUnits(balance, 6),
        hasBalance
      };
    } catch (error) {
      console.error('Error checking YAFA approval:', error);
      throw error;
    }
  }

  /**
   * Approve YAFA spending for the lock contract
   */
  async approveYAFA(amount: string): Promise<string> {
    try {
      const yafaContract = new window.ethers.Contract(
        CONTRACT_CONFIG.YAFA_TOKEN_ADDRESS,
        ERC20_ABI,
        this.signer
      );

      const amountWei = window.ethers.utils.parseUnits(amount, 6);
      
      const tx = await yafaContract.approve(CONTRACT_CONFIG.YAFA_LOCK_ADDRESS, amountWei);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('Error approving YAFA:', error);
      throw error;
    }
  }
}