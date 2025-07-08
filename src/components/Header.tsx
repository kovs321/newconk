
import React, { useState, useEffect } from 'react';

// Safe wallet imports with error handling
let useWallet: any;
let WalletMultiButton: any;

try {
  const walletAdapter = require('@solana/wallet-adapter-react');
  const walletAdapterUi = require('@solana/wallet-adapter-react-ui');
  useWallet = walletAdapter.useWallet;
  WalletMultiButton = walletAdapterUi.WalletMultiButton;
} catch (e) {
  console.warn('Wallet adapter not available, using fallback');
  const { useWalletFallback, WalletFallback } = require('./WalletFallback');
  useWallet = useWalletFallback;
  WalletMultiButton = WalletFallback;
}

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 bg-white z-50 transition-all duration-200 ${
      isScrolled ? 'border-b border-gray-200 shadow-sm' : ''
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-black text-gray-900">BONK STRATEGY</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-700 hover:text-gray-900 transition-colors">Home</a>
            <a href="#charts" className="text-gray-700 hover:text-gray-900 transition-colors">Charts</a>
            <a href="#voting" className="text-gray-700 hover:text-gray-900 transition-colors">Voting</a>
            <a href="#pitch" className="text-gray-700 hover:text-gray-900 transition-colors">Pitch Deck</a>
            <a href="#how" className="text-gray-700 hover:text-gray-900 transition-colors">How it Works</a>
          </nav>

          {/* Connect Wallet Button */}
          <div className="hidden md:block">
            <WalletMultiButton className="!bg-gray-900 !text-white !px-4 !py-2 !rounded-full !text-sm !font-medium hover:!bg-gray-800 !transition-colors !border-none" />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <a href="#home" className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">Home</a>
              <a href="#charts" className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">Charts</a>
              <a href="#voting" className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">Voting</a>
              <a href="#pitch" className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">Pitch Deck</a>
              <a href="#how" className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">How it Works</a>
              <div className="px-3 py-2">
                <WalletMultiButton className="!bg-gray-900 !text-white !px-3 !py-2 !rounded-md !text-sm !font-medium hover:!bg-gray-800 !transition-colors !border-none !w-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
