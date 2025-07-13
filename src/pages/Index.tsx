
import React from 'react';
import PerformanceChart from '../components/PerformanceChart';
import VolumeChart from '../components/VolumeChart';
import InteractiveChart from '../components/InteractiveChart';
import HowItWorks from '../components/HowItWorks';
import { Header } from '../components/Header';
import DecryptedText from '../components/DecryptedText';
import IkunHoldersBoard from '../components/IkunHoldersBoard';
import StimulusCountdown from '../components/StimulusCountdown';

const Index = () => {
  console.log('Index component loading with BONKDROP');
  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-800 border-2 border-orange-500 p-2 mr-4 flex items-center justify-center">
                <img 
                  src="https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I" 
                  alt="BONK"
                  className="w-full h-full rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <h2 className="text-6xl md:text-7xl font-black text-orange-500 font-logo tracking-wider">
                <DecryptedText 
                  text="BONKDROP"
                  speed={80}
                  maxIterations={15}
                  sequential={true}
                  revealDirection="center"
                  animateOn="view"
                  characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
                  className="text-orange-500"
                  encryptedClassName="text-gray-500"
                />
              </h2>
            </div>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto font-tech font-medium mb-12">
              Fair airdrop distribution for all holders - Earn rewards as fast as NOW
            </p>
            
            {/* Stimulus Countdown */}
            <StimulusCountdown />
            
            {/* Requirements */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 text-center">
                <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-3"></div>
                <span className="text-gray-300 font-tech text-lg">Hold 100,000+ BONKDROP tokens</span>
              </div>
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 text-center">
                <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-3"></div>
                <span className="text-gray-300 font-tech text-lg">Automatic stimulus every 5 minutes</span>
              </div>
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 text-center">
                <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-3"></div>
                <span className="text-gray-300 font-tech text-lg">Fair distribution based on holdings</span>
              </div>
            </div>

          </div>
        </section>

        {/* IKUN Holders Leaderboard Section */}
        <section className="py-16 px-4 bg-gray-900">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-orange-500 mb-4 font-logo tracking-wider">
                <DecryptedText 
                  text="Growing Community"
                  speed={70}
                  maxIterations={10}
                  sequential={true}
                  revealDirection="center"
                  animateOn="view"
                  className="text-orange-500"
                  encryptedClassName="text-gray-500"
                />
              </h2>
              <p className="text-xl text-gray-300 font-tech">
                Real-time tracking of IKUN holders in our ecosystem
              </p>
            </div>
            <div className="bg-black border border-gray-600 rounded-lg p-6">
              <IkunHoldersBoard />
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section id="charts" className="py-16 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-orange-500 mb-4 font-logo tracking-wider">
                <DecryptedText 
                  text="BONK Price Analytics"
                  speed={70}
                  maxIterations={10}
                  sequential={true}
                  revealDirection="center"
                  animateOn="view"
                  className="text-orange-500"
                  encryptedClassName="text-gray-500"
                />
              </h2>
              <p className="text-xl text-gray-300 font-tech">
                Real-time price tracking and market insights
              </p>
            </div>
            {/* Full Width Chart */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-sm">
              <InteractiveChart />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-black text-orange-500 mb-6 text-center font-logo tracking-wider">
                <DecryptedText 
                  text="How It Works"
                  speed={80}
                  maxIterations={12}
                  sequential={true}
                  revealDirection="center"
                  animateOn="view"
                  className="text-orange-500"
                  encryptedClassName="text-gray-500"
                />
              </h3>
              <HowItWorks />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Index;
