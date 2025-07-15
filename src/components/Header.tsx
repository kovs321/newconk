
import React, { useState, useEffect } from 'react';
import DecryptedText from './DecryptedText';

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
    <header className={`fixed top-0 left-0 right-0 bg-black z-50 transition-all duration-200 ${
      isScrolled ? 'border-b border-gray-600 shadow-sm' : 'border-b border-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-black text-orange-500 font-logo tracking-wider">
              <DecryptedText 
                text="BONKDROP"
                speed={100}
                maxIterations={10}
                sequential={true}
                revealDirection="start"
                animateOn="hover"
                className="text-orange-500"
                encryptedClassName="text-gray-400"
              />
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-300 hover:text-orange-400 transition-colors">
              <DecryptedText 
                text="Home"
                speed={80}
                maxIterations={8}
                sequential={true}
                revealDirection="start"
                animateOn="hover"
                className="text-gray-300"
                encryptedClassName="text-gray-500"
              />
            </a>
            <a href="#charts" className="text-gray-300 hover:text-orange-400 transition-colors">
              <DecryptedText 
                text="Charts"
                speed={80}
                maxIterations={8}
                sequential={true}
                revealDirection="start"
                animateOn="hover"
                className="text-gray-300"
                encryptedClassName="text-gray-500"
              />
            </a>
            <a href="#how-it-works" className="text-gray-300 hover:text-orange-400 transition-colors">
              <DecryptedText 
                text="How To Claim"
                speed={80}
                maxIterations={8}
                sequential={true}
                revealDirection="start"
                animateOn="hover"
                className="text-gray-300"
                encryptedClassName="text-gray-500"
              />
            </a>
          </nav>

          {/* Follow Us and RevShare Docs Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="https://x.com/thebonkstrategy"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-orange-500 hover:text-black transition-colors"
            >
              Follow Us
            </a>
            <a
              href="https://revshare.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-orange-500 hover:text-black transition-colors"
            >
              RevShare Docs
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-orange-400 hover:bg-gray-800 transition-colors"
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
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black border-t border-gray-700">
              <a href="#home" className="block px-3 py-2 text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-md transition-colors">
                <DecryptedText 
                  text="Home"
                  speed={80}
                  maxIterations={8}
                  sequential={true}
                  revealDirection="start"
                  animateOn="hover"
                  className="text-gray-300"
                  encryptedClassName="text-gray-500"
                />
              </a>
              <a href="#charts" className="block px-3 py-2 text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-md transition-colors">
                <DecryptedText 
                  text="Charts"
                  speed={80}
                  maxIterations={8}
                  sequential={true}
                  revealDirection="start"
                  animateOn="hover"
                  className="text-gray-300"
                  encryptedClassName="text-gray-500"
                />
              </a>
              <a href="#how-it-works" className="block px-3 py-2 text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-md transition-colors">
                <DecryptedText 
                  text="How To Claim"
                  speed={80}
                  maxIterations={8}
                  sequential={true}
                  revealDirection="start"
                  animateOn="hover"
                  className="text-gray-300"
                  encryptedClassName="text-gray-500"
                />
              </a>
              <div className="px-3 py-2 space-y-2">
                <a
                  href="https://x.com/thebonkstrategy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gray-800 text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-500 hover:text-black transition-colors text-center"
                >
                  Follow Us
                </a>
                <a
                  href="https://revshare.dev/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gray-800 text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-500 hover:text-black transition-colors text-center"
                >
                  RevShare Docs
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
