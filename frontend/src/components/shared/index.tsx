import React, { useState, useEffect, ReactNode } from 'react';
import { Clock, RefreshCw, X } from 'lucide-react';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className = "" 
}) => (
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

// Countdown Component
interface CountdownProps {
  targetTimestamp: number;
}

export const Countdown: React.FC<CountdownProps> = ({ targetTimestamp }) => {
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

// Transaction Button Component
interface TransactionButtonProps {
  onClick: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'secondary';
  className?: string;
}

export const TransactionButton: React.FC<TransactionButtonProps> = ({ 
  onClick, 
  children, 
  disabled = false, 
  variant = 'primary',
  className = ""
}) => {
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
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
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

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
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