
import React from 'react';
import TokenDistributionChart from '../components/TokenDistributionChart';
import PerformanceChart from '../components/PerformanceChart';
import VolumeChart from '../components/VolumeChart';
import InteractiveChart from '../components/InteractiveChart';
import BasicWebSocketChart from '../components/BasicWebSocketChart';
import PitchDeck from '../components/PitchDeck';
import HowItWorks from '../components/HowItWorks';
import { Header } from '../components/Header';
import TextPressure from '../components/TextPressure';

const Index = () => {
  console.log('Index component loading with BONKDROP');
  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto text-center">
            <div style={{position: 'relative', height: '100px', paddingTop: '20px'}} className="mb-4 flex items-start justify-center">
              <TextPressure
                text="BONKDROP"
                flex={false}
                alpha={false}
                stroke={false}
                width={true}
                weight={true}
                italic={true}
                textColor="#ffffff"
                strokeColor="#ff0000"
                minFontSize={64}
                scale={false}
                className="font-logo"
              />
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-tech font-medium">
              Experience the ultimate BONK airdrop platform with interactive rewards and community engagement
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
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-sm">
                  <InteractiveChart />
                </div>
                
                {/* BSTR Chart */}
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-black text-white mb-4 font-tech tracking-wide">BSTR Chart</h3>
                  <BasicWebSocketChart />
                </div>
              </div>
              
              {/* Right Column - Token Distribution */}
              <div className="lg:col-span-2">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-black text-white mb-4 font-tech tracking-wide">Token Distribution</h3>
                  <div className="h-80">
                    <TokenDistributionChart />
                  </div>
                  
                  {/* Description */}
                  <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
                    <h4 className="text-md font-bold text-white mb-3 font-tech uppercase tracking-wider">About BONKDROP Airdrops</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      BONKDROP is an innovative airdrop platform that rewards active community members with exclusive BONK token distributions. 
                      Participants can earn airdrop eligibility through various engagement activities including social interactions, 
                      trading volume, and community participation. Our platform tracks and monitors multiple tokens to provide 
                      comprehensive airdrop opportunities for the Solana ecosystem.
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed mt-3">
                      Airdrops are distributed based on real-time activity metrics and community engagement scores. 
                      Our advanced scoring algorithm continuously evaluates user participation to ensure fair and transparent 
                      distribution to eligible participants. By staying active in the BONKDROP ecosystem, users gain access to 
                      exclusive token airdrops while benefiting from a transparent and automated distribution system.
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed mt-3">
                      New airdrop opportunities are regularly added based on strategic partnerships and 
                      community feedback. Our team continuously evaluates emerging projects to provide the most 
                      valuable airdrop opportunities for BONKDROP participants.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pitch Deck Section */}
        <section id="pitch" className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-black text-white mb-6 text-center font-logo tracking-wider">Pitch Deck</h3>
              <PitchDeck />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="py-12 px-4 bg-gray-900">
          <div className="container mx-auto max-w-6xl">
            <h3 className="text-2xl font-black text-white text-center mb-8 font-logo tracking-wider">How It Works</h3>
            <HowItWorks />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
