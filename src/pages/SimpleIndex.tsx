import React from 'react';
import VotingPanel from '../components/VotingPanel';

const SimpleIndex = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-black text-gray-900">BONK STRATEGY</h1>
            <button 
              className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800"
              onClick={() => alert('Connect Phantom wallet to vote!')}
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-5xl font-black text-gray-900 mb-4">BONK STRATEGY</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Diversified token rewards distribution strategy with community-driven governance
            </p>
          </div>
        </section>

        {/* Charts Placeholder */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Charts */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-50 rounded-lg p-6 shadow-sm h-96 flex items-center justify-center">
                  <p className="text-gray-500">Live Token Chart</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 shadow-sm h-80 flex items-center justify-center">
                  <p className="text-gray-500">WebSocket Chart</p>
                </div>
              </div>
              
              {/* Right Column - Token Distribution */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6 shadow-sm h-80 flex items-center justify-center">
                  <p className="text-gray-500">Token Distribution</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Voting Panel */}
        <section id="voting" className="py-12 px-4 bg-gray-50">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Vote for New Tokens</h3>
              <VotingPanel />
            </div>
          </div>
        </section>

        {/* Pitch Deck Placeholder */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-black text-gray-900 mb-6 text-center">Pitch Deck</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                    <h4 className="font-bold text-lg mb-2">Slide {i}</h4>
                    <p className="text-gray-600">Content coming soon...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SimpleIndex;