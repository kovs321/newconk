
import React from 'react';
import TokenDistributionChart from '../components/TokenDistributionChart';
import PerformanceChart from '../components/PerformanceChart';
import VotingPanel from '../components/VotingPanel';
import PitchDeck from '../components/PitchDeck';
import HowItWorks from '../components/HowItWorks';
import { Header } from '../components/Header';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">BONK STRATEGY</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Diversified token rewards distribution strategy with community-driven governance
            </p>
          </div>
        </section>

        {/* Charts Section */}
        <section id="charts" className="py-12 px-4">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Token Distribution Chart */}
              <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Distribution</h3>
                <div className="h-64">
                  <TokenDistributionChart />
                </div>
              </div>
              
              {/* Performance Chart */}
              <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Performance</h3>
                <div className="h-64">
                  <PerformanceChart />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Voting Panel */}
        <section id="voting" className="py-12 px-4 bg-gray-50">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Vote for New Tokens</h3>
              <VotingPanel />
            </div>
          </div>
        </section>

        {/* Pitch Deck Section */}
        <section id="pitch" className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Pitch Deck</h3>
              <PitchDeck />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="py-12 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h3 className="text-2xl font-semibold text-gray-900 text-center mb-8">How It Works</h3>
            <HowItWorks />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
