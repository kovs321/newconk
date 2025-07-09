
import React from 'react';
import TokenDistributionChart from '../components/TokenDistributionChart';
import PerformanceChart from '../components/PerformanceChart';
import VolumeChart from '../components/VolumeChart';
import InteractiveChart from '../components/InteractiveChart';
import BasicWebSocketChart from '../components/BasicWebSocketChart';
import VotingPanel from '../components/VotingPanel';
import PitchDeck from '../components/PitchDeck';
import HowItWorks from '../components/HowItWorks';
import { Header } from '../components/Header';
import { ErrorBoundary } from '../components/ErrorBoundary';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />

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

        {/* Charts Section */}
        <section id="charts" className="py-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left Column - Two charts stacked */}
              <div className="lg:col-span-3 space-y-6">
                {/* Trading Chart */}
                <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                  <InteractiveChart />
                </div>
                
                {/* Basic WebSocket Chart */}
                <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-4">Live WebSocket Chart</h3>
                  <BasicWebSocketChart />
                </div>
              </div>
              
              {/* Right Column - Token Distribution */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-4">Token Distribution</h3>
                  <div className="h-80">
                    <TokenDistributionChart />
                  </div>
                  
                  {/* Description */}
                  <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="text-md font-bold text-black mb-3">About BSTR Token Redistribution</h4>
                    <p className="text-sm text-black leading-relaxed">
                      This platform operates a unique token redistribution system designed to reward top BSTR token holders. 
                      Holders who maintain 0.5% or more of the total BSTR supply qualify for our redistribution program. 
                      These qualifying holders will receive proportional distributions of the four tokens we actively track 
                      and monitor in the charts displayed on the left: BONK, Hosico, USELESS, and IKUN.
                    </p>
                    <p className="text-sm text-black leading-relaxed mt-3">
                      The redistribution occurs based on real-time price movements and trading volumes of these four tokens. 
                      Our advanced averaging algorithm continuously monitors market conditions to ensure fair and timely 
                      distribution to eligible BSTR holders. By holding a significant stake in BSTR, you gain exposure to 
                      a diversified portfolio of promising tokens while benefiting from community-driven governance and 
                      transparent distribution mechanisms.
                    </p>
                    <p className="text-sm text-black leading-relaxed mt-3">
                      Vote for new tokens to be added to the redistribution pool using the voting panel below. 
                      Your voice matters in shaping the future of our token ecosystem and determining which 
                      assets deserve inclusion in our carefully curated redistribution strategy.
                    </p>
                  </div>
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

        {/* Pitch Deck Section */}
        <section id="pitch" className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-black text-gray-900 mb-6 text-center">Pitch Deck</h3>
              <PitchDeck />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="py-12 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h3 className="text-2xl font-black text-gray-900 text-center mb-8">How It Works</h3>
            <HowItWorks />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
