import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export const CustomWalletButton: React.FC<{ className?: string }> = ({ className }) => {
  const { connected, publicKey, connect, disconnect, select, wallets } = useWallet();
  const { setVisible } = useWalletModal();
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);

  useEffect(() => {
    // Check if Phantom is installed in the browser
    const checkPhantom = () => {
      const isInstalled = window.phantom?.solana?.isPhantom || false;
      setIsPhantomInstalled(isInstalled);
    };

    checkPhantom();
    // Check again after a short delay in case Phantom is slow to inject
    const timer = setTimeout(checkPhantom, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClick = async () => {
    if (connected) {
      await disconnect();
    } else {
      // First check if Phantom is installed in the browser
      if (isPhantomInstalled || window.phantom?.solana?.isPhantom) {
        // Find Phantom wallet adapter
        const phantomWallet = wallets.find(wallet => wallet.adapter.name === 'Phantom');
        
        if (phantomWallet && phantomWallet.readyState === 'Installed') {
          try {
            select(phantomWallet.adapter.name);
            await connect();
          } catch (error) {
            console.error('Failed to connect:', error);
            // Only show modal if connection failed
            setVisible(true);
          }
        } else {
          // Phantom is installed but adapter not ready, try direct connection
          try {
            const phantomProvider = window.phantom?.solana;
            if (phantomProvider) {
              await phantomProvider.connect();
            } else {
              setVisible(true);
            }
          } catch (error) {
            console.error('Direct connection failed:', error);
            setVisible(true);
          }
        }
      } else {
        // Phantom not installed, show modal to download
        setVisible(true);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <button
      onClick={handleClick}
      className={className}
    >
      {connected && publicKey ? (
        formatAddress(publicKey.toString())
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
};