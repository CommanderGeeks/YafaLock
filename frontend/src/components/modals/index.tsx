import React, { useState } from 'react';
import { Modal, TransactionButton, Countdown } from '../shared';
import { useWeb3 } from '../../contexts/Web3Context';

// Create Offer Modal
interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ isOpen, onClose }) => {
  const { web3State } = useWeb3();
  const [tokenAmount, setTokenAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');

  const handleSubmit = async (): Promise<void> => {
    try {
      if (!web3State.contract) return;
      
      const tokenAmountWei = window.ethers.utils.parseUnits(tokenAmount, 6); // Changed from 18 to 6
      const usdtAmountWei = window.ethers.utils.parseUnits(usdtAmount, 6);
      
      const tx = await web3State.contract.communityMemberOTCOffer(usdtAmountWei, tokenAmountWei);
      await tx.wait();
      
      onClose();
      setTokenAmount('');
      setUsdtAmount('');
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
            className="flex-1"
          >
            Create Offer
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
  const { web3State, publicOffer } = useWeb3();
  const [percentage, setPercentage] = useState(100);

  const handleSubmit = async (): Promise<void> => {
    try {
      if (!web3State.contract || !publicOffer) return;
      
      const tx = await web3State.contract.acceptPublicOTCOffer(percentage);
      await tx.wait();
      
      onClose();
      setPercentage(100);
    } catch (error) {
      console.error('Failed to claim public offer:', error);
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