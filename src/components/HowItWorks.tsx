import React from 'react';

const HowItWorks = () => {
  const steps = [
    {
      step: "1",
      title: "Connect Wallet",
      description: "Connect your Solana wallet to get started with BONK Strategy and access the platform features.",
      icon: "🔗"
    },
    {
      step: "2",
      title: "Stake Tokens",
      description: "Deposit your tokens into the strategy pool to start earning rewards from the diversified portfolio.",
      icon: "💰"
    },
    {
      step: "3",
      title: "Participate in Governance",
      description: "Vote on new token additions, strategy changes, and parameter adjustments to shape the future.",
      icon: "🗳️"
    },
    {
      step: "4",
      title: "Track Performance",
      description: "Monitor your investment performance, view detailed analytics, and track your earnings over time.",
      icon: "📊"
    },
    {
      step: "5",
      title: "Claim Rewards",
      description: "Automatically receive your share of rewards from the strategy's diversified token portfolio.",
      icon: "🎁"
    },
    {
      step: "6",
      title: "Compound Growth",
      description: "Reinvest your rewards to compound your returns and maximize your long-term growth potential.",
      icon: "📈"
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {steps.map((step, index) => (
        <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">{step.icon}</div>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full text-sm font-bold mb-2">
              {step.step}
            </div>
            <h4 className="text-lg font-semibold text-gray-900">{step.title}</h4>
          </div>
          <p className="text-gray-600 text-center leading-relaxed">{step.description}</p>
        </div>
      ))}
    </div>
  );
};

export default HowItWorks;