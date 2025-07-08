
import React, { useState } from 'react';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">BONK STRATEGY</h1>
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
          <button className="hidden md:block bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
            Connect Wallet
          </button>

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
              <button className="w-full text-left bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                Connect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
