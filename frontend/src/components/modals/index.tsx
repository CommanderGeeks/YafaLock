// src/components/modals/index.tsx

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Modal, TransactionButton, Countdown } from '../shared';
import { useWeb3 } from '../../contexts/Web3Context';
import { TokenApprovalHelper, ApprovalStatus } from '../../utils/tokenApproval';

// Create Offer Modal (Community Members)
interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ isOpen, onClose }) => {
  const { web3State, refreshData } = useWeb3();
  const [tokenAmount, setTokenAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');

  const handleSubmit = async (): Promise<void> => {
    try {
      if (!web3State.contract) return;
      
      const tokenAmountWei = window.ethers.utils.parseUnits(tokenAmount, 6);
      const usdtAmountWei = window.ethers.utils.parseUnits(usdtAmount, 6);
      
      const tx = await web3State.contract.communityMemberOTCOffer(usdtAmountWei, tokenAmountWei);
      await tx.wait();
      
      await refreshData();
      onClose();
      setTokenAmount('');
      setUsdtAmount('');
    } catch (error) {
      console.error('Failed to create offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create offer: ${errorMessage}`);
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
            className="flex-1"
          >
            Create Offer
          </TransactionButton>
        </div>
      </div>
    </Modal>
  );
};

// Create Public Offer Modal (Admin only) - WITH APPROVAL LOGIC
interface CreatePublicOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePublicOfferModal: React.FC<CreatePublicOfferModalProps> = ({ isOpen, onClose }) => {
  const { web3State, refreshData } = useWeb3();
  const [usdtAmount, setUsdtAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [duration, setDuration] = useState('7'); // days
  
  // Approval states
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [approving, setApproving] = useState(false);

  // Check approval status when amount changes
  useEffect(() => {
    if (usdtAmount && web3State.provider && web3State.signer && web3State.account) {
      checkApprovalStatus();
    } else {
      setApprovalStatus(null);
    }
  }, [usdtAmount, web3State.provider, web3State.signer, web3State.account]);

  const checkApprovalStatus = async () => {
    if (!usdtAmount || !web3State.provider || !web3State.signer || !web3State.account) return;
    
    setCheckingApproval(true);
    try {
      const approvalHelper = new TokenApprovalHelper(
        web3State.provider,
        web3State.signer,
        web3State.account
      );
      
      const status = await approvalHelper.checkUSDTApproval(usdtAmount);
      setApprovalStatus(status);
    } catch (error) {
      console.error('Error checking approval status:', error);
      setApprovalStatus(null);
    } finally {
      setCheckingApproval(false);
    }
  };

  const handleApprove = async () => {
    if (!usdtAmount || !web3State.provider || !web3State.signer || !web3State.account) return;
    
    setApproving(true);
    try {
      const approvalHelper = new TokenApprovalHelper(
        web3State.provider,
        web3State.signer,
        web3State.account
      );
      
      // Approve the exact amount + 10% buffer to account for any precision issues
      const approvalAmount = (parseFloat(usdtAmount) * 1.1).toString();
      await approvalHelper.approveUSDT(approvalAmount);
      
      // Recheck approval status
      await checkApprovalStatus();
    } catch (error) {
      console.error('Error approving USDT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to approve USDT: ${errorMessage}`);
    } finally {
      setApproving(false);
    }
  };

  const handleApproveMax = async () => {
    if (!web3State.provider || !web3State.signer || !web3State.account) return;
    
    setApproving(true);
    try {
      const approvalHelper = new TokenApprovalHelper(
        web3State.provider,
        web3State.signer,
        web3State.account
      );
      
      await approvalHelper.approveMaxUSDT();
      
      // Recheck approval status
      await checkApprovalStatus();
    } catch (error) {
      console.error('Error approving max USDT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to approve USDT: ${errorMessage}`);
    } finally {
      setApproving(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      if (!web3State.contract) {
        console.error('Contract not available');
        return;
      }

      // Final approval check before creating offer
      if (approvalStatus && !approvalStatus.hasAllowance) {
        alert('Please approve USDT spending first');
        return;
      }

      if (approvalStatus && !approvalStatus.hasBalance) {
        alert('Insufficient USDT balance');
        return;
      }
      
      console.log('Creating public offer with:', {
        usdtAmount,
        tokenAmount,
        duration
      });

      const usdtAmountWei = window.ethers.utils.parseUnits(usdtAmount, 6);
      const tokenAmountWei = window.ethers.utils.parseUnits(tokenAmount, 6);
      const durationSeconds = parseInt(duration) * 24 * 60 * 60;
      
      const tx = await web3State.contract.publicOTCOffer(usdtAmountWei, tokenAmountWei, durationSeconds);
      console.log('Transaction sent:', tx.hash);
      
      await tx.wait();
      console.log('Transaction confirmed');
      
      await refreshData();
      
      // Close modal and reset form
      onClose();
      setUsdtAmount('');
      setTokenAmount('');
      setDuration('7');
      setApprovalStatus(null);
      
      console.log('Public offer created successfully');
    } catch (error) {
      console.error('Failed to create public offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create public offer: ${errorMessage}`);
    }
  };

  const calculateRate = (): string => {
    if (!usdtAmount || !tokenAmount || parseFloat(tokenAmount) === 0) return '0';
    return (parseFloat(usdtAmount) / parseFloat(tokenAmount)).toFixed(4);
  };

  const canCreateOffer = () => {
    return usdtAmount && 
           tokenAmount && 
           web3State.contract && 
           approvalStatus?.hasAllowance && 
           approvalStatus?.hasBalance;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Public OTC Offer">
      <div className="space-y-4">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-400 mr-3" />
            <div className="text-sm text-orange-200">
              <p className="font-medium">Admin Only</p>
              <p>This will create a public offer that any community member can participate in.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">USDT Amount</label>
          <input 
            type="number" 
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-sm"
            placeholder="Enter USDT amount"
            step="0.01"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Token Amount (YAFA)</label>
          <input 
            type="number" 
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-sm"
            placeholder="Enter token amount"
            step="0.000001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Duration (Days)</label>
          <select 
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-sm"
          >
            <option value="1">1 Day</option>
            <option value="3">3 Days</option>
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
            <option value="30">30 Days</option>
          </select>
        </div>

        {/* Approval Status Section */}
        {usdtAmount && (
          <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2 flex items-center">
              <span>USDT Approval Status</span>
              {checkingApproval && <Clock className="w-4 h-4 ml-2 animate-spin" />}
            </h4>
            
            {approvalStatus && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Balance:</span>
                  <span className={`font-semibold ${approvalStatus.hasBalance ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${parseFloat(approvalStatus.balance).toFixed(2)} USDT
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Allowance:</span>
                  <span className={`font-semibold ${approvalStatus.hasAllowance ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    ${parseFloat(approvalStatus.currentAllowance).toFixed(2)} USDT
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Status:</span>
                  <div className="flex items-center">
                    {approvalStatus.hasAllowance ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400 mr-1" />
                        <span className="text-emerald-400 font-semibold">Approved</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-yellow-400 font-semibold">Needs Approval</span>
                      </>
                    )}
                  </div>
                </div>

                {!approvalStatus.hasBalance && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-200 text-xs">
                    Insufficient USDT balance. You need ${usdtAmount} USDT but only have ${parseFloat(approvalStatus.balance).toFixed(2)} USDT.
                  </div>
                )}
                
                {!approvalStatus.hasAllowance && approvalStatus.hasBalance && (
                  <div className="mt-3 space-y-2">
                    <div className="flex space-x-2">
                      <TransactionButton 
                        onClick={handleApprove}
                        disabled={approving}
                        variant="warning"
                        className="flex-1 text-xs py-2"
                      >
                        {approving ? 'Approving...' : `Approve ${usdtAmount} USDT`}
                      </TransactionButton>
                      <TransactionButton 
                        onClick={handleApproveMax}
                        disabled={approving}
                        variant="secondary"
                        className="flex-1 text-xs py-2"
                      >
                        {approving ? 'Approving...' : 'Approve Max'}
                      </TransactionButton>
                    </div>
                    <p className="text-xs text-gray-400">
                      Choose "Approve Max" for unlimited approval (recommended for frequent use)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Offer Summary */}
        {usdtAmount && tokenAmount && (
          <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Offer Summary</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p>Rate: <span className="font-semibold text-emerald-400">${calculateRate()} per YAFA</span></p>
              <p>Duration: <span className="font-semibold text-white">{duration} days</span></p>
              <p className="text-xs text-gray-400 mt-2">Community members can participate with any percentage of this offer</p>
            </div>
          </div>
        )}
        
        <div className="flex space-x-3 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600/30 py-3 px-4 rounded-full transition-colors backdrop-blur-sm"
          >
            Cancel
          </button>
          <TransactionButton 
            onClick={handleSubmit}
            disabled={!canCreateOffer()}
            variant="primary"
            className="flex-1"
          >
            Create Public Offer
          </TransactionButton>
        </div>
      </div>
    </Modal>
  );
};

// Claim Public Offer Modal
interface ClaimPublicOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimPublicOfferModal: React.FC<ClaimPublicOfferModalProps> = ({ isOpen, onClose }) => {
  const { web3State, publicOffer, refreshData } = useWeb3();
  const [percentage, setPercentage] = useState(100);

  const handleSubmit = async (): Promise<void> => {
    try {
      if (!web3State.contract || !publicOffer) return;
      
      const tx = await web3State.contract.acceptPublicOTCOffer(percentage);
      await tx.wait();
      
      await refreshData();
      onClose();
      setPercentage(100);
    } catch (error) {
      console.error('Failed to claim public offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to claim public offer: ${errorMessage}`);
    }
  };

  if (!publicOffer) return null;

  const claimAmount = ((parseFloat(publicOffer.remainingTokenAmount) * percentage) / 100).toFixed(6);
  const costAmount = ((parseFloat(publicOffer.remainingUsdtAmount) * percentage) / 100).toFixed(2);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Claim Public Offer">
      <div className="space-y-4">
        <div className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">Available Offer</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p>Rate: ${(parseFloat(publicOffer.remainingUsdtAmount) / parseFloat(publicOffer.remainingTokenAmount)).toFixed(4)} per YAFA</p>
            <p>Total Available: {parseFloat(publicOffer.remainingTokenAmount).toFixed(6)} YAFA</p>
            <p>Time Remaining: <Countdown targetTimestamp={publicOffer.offerStartTime + publicOffer.offerDuration} /></p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Participation Percentage: {percentage}%
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
            <p>You will receive: <span className="font-semibold text-emerald-400">{claimAmount} YAFA tokens</span></p>
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
            className="flex-1"
          >
            Claim {percentage}%
          </TransactionButton>
        </div>
      </div>
    </Modal>
  );
};