
import React from 'react';
import { Header } from '../components/Header';
import Canvas from '../components/Canvas';
import VotingPanel from '../components/VotingPanel';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Canvas Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Digital Canvas</h2>
              <Canvas />
            </div>
            
            {/* Voting Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <VotingPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
