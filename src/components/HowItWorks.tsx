import React from 'react';
import DecryptedText from './DecryptedText';

const HowItWorks = () => {
  const steps = [
    {
      step: "1",
      title: "Buy $BONKDROP",
      description: "Purchase at least 100,000 $BONKDROP tokens to become eligible for airdrops. The more BONKDROP you hold, the larger your airdrop will be. Our token is powered by revshare."
    },
    {
      step: "2",
      title: "Hold Tokens",
      description: "Keep the tokens in your wallet. There are no additional requirements- no quests, no social tasks, no point systems."
    },
    {
      step: "3",
      title: "Receive Airdrops",
      description: "Unlike pumpfun, we are actually doing airdrops. If you meet the holding requirement, you will automatically receive a BONK airdrop every 5 minutes."
    },
    {
      step: "4",
      title: "Stay Eligible",
      description: "As long as you continue holding the minimum required amount, you remain eligible for future airdrops."
    },
    {
      step: "5",
      title: "No Extra Steps",
      description: "Your eligibility is based solely on your wallet balance. We do not track engagement, activity, or community participation."
    },
    {
      step: "6",
      title: "Simple by Design",
      description: "The goal is to provide a direct and transparent airdrop experience - no gimmicks, no complexity. Fuck pumpfun, long live BONK."
    }
  ];

  return (
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
      
      <div className="text-center">
        <a
          href="https://revshare.dev/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-6 rounded-lg text-lg font-tech uppercase tracking-wider transition-all duration-300 transform hover:scale-105"
        >
          RevShare Documentation
        </a>
      </div>
    </div>
  );
};

export default HowItWorks;