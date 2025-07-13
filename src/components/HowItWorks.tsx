import React from 'react';
import DecryptedText from './DecryptedText';

const HowItWorks = () => {
  const steps = [
    {
      step: "1",
      title: "Connect Wallet",
      description: "Connect your Solana wallet to get started with BONKDROP and access exclusive airdrop opportunities."
    },
    {
      step: "2",
      title: "Join Community",
      description: "Participate in our community activities and engage with social channels to increase your airdrop eligibility."
    },
    {
      step: "3",
      title: "Track Activity",
      description: "Monitor your engagement score and track real-time airdrop opportunities across multiple token projects."
    },
    {
      step: "4",
      title: "View Analytics",
      description: "Access detailed analytics of your community participation and track your airdrop history and rewards."
    },
    {
      step: "5",
      title: "Claim Airdrops",
      description: "Automatically receive eligible airdrops based on your community engagement and participation score."
    },
    {
      step: "6",
      title: "Maximize Rewards",
      description: "Increase engagement activities to boost your eligibility for future airdrops and exclusive token distributions."
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {steps.map((step, index) => (
        <div key={index} className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-500 text-black rounded-full text-sm font-bold mb-4">
              {step.step}
            </div>
            <h4 className="text-lg font-semibold text-orange-500 font-tech uppercase tracking-wider">
              <DecryptedText 
                text={step.title}
                speed={70}
                maxIterations={10}
                sequential={true}
                revealDirection="center"
                animateOn="view"
                className="text-orange-500"
                encryptedClassName="text-gray-500"
              />
            </h4>
          </div>
          <p className="text-gray-300 text-center leading-relaxed font-tech">{step.description}</p>
        </div>
      ))}
    </div>
  );
};

export default HowItWorks;