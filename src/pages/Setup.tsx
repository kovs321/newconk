import React from 'react';
import SupabaseSetup from '../components/SupabaseSetup';

const Setup: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">BONK STRATEGY Setup</h1>
          <p className="text-xl text-gray-600">Initialize your voting system</p>
        </div>
        
        <SupabaseSetup />
        
        <div className="text-center mt-8">
          <a 
            href="/" 
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            ← Back to main site
          </a>
        </div>
      </div>
    </div>
  );
};

export default Setup;