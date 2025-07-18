import React from 'react';
import DecryptedText from './DecryptedText';

const StimulusCountdown: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto mb-12">
      <div className="text-center">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-300 mb-4 font-tech uppercase tracking-wider">
            Unlike pumpfun, we are actually doing an airdrop.
          </h3>
          <p className="text-xl text-gray-400 font-tech">
            Hold $BONKDROP & to receive a BONK airdrop
          </p>
        </div>
        
        <div className="flex justify-center items-center mb-6">
          {/* Static 5 mins display */}
          <div className="bg-gray-800 rounded-lg p-6 min-w-[150px] border border-gray-700">
            <div className="text-5xl font-black text-orange-500 font-mono">
              5 mins
            </div>
            <div className="text-sm text-gray-500 font-tech uppercase tracking-wider mt-2">
              Interval
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default StimulusCountdown;