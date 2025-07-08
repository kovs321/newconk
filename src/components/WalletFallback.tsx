import React from 'react';

// Simple fallback wallet button when wallet adapters fail
export const WalletFallback: React.FC<{ className?: string }> = ({ className }) => {
  const handleConnectWallet = () => {
    alert('Please install Phantom wallet to vote. Visit phantom.app to get started.');
  };

  return (
    <button 
      onClick={handleConnectWallet}
      className={className}
    >
      Connect Wallet
    </button>
  );
};

// Fallback hook when useWallet is not available
export const useWalletFallback = () => ({
  connected: false,
  publicKey: null,
  connect: () => {},
  disconnect: () => {},
});