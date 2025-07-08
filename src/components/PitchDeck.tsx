import React from 'react';

const PitchDeck = () => {
  const keyPoints = [
    {
      title: "Strategy Overview",
      content: "BONK Strategy provides diversified exposure to high-quality tokens through community governance and algorithmic rebalancing."
    },
    {
      title: "Revenue Model",
      content: "Generate yield through staking, liquidity provision, and strategic token allocation with transparent fee structure."
    },
    {
      title: "Risk Management",
      content: "Multi-layered risk controls including position limits, correlation analysis, and automated rebalancing triggers."
    },
    {
      title: "Community Governance",
      content: "Token holders vote on new additions, strategy changes, and parameter adjustments through decentralized voting."
    },
    {
      title: "Performance Metrics",
      content: "Track key metrics including APY, Sharpe ratio, maximum drawdown, and total value locked (TVL)."
    },
    {
      title: "Roadmap",
      content: "Q4 2024: Launch, Q1 2025: Advanced analytics, Q2 2025: Cross-chain expansion, Q3 2025: Institutional features."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {keyPoints.map((point, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">{point.title}</h4>
            <p className="text-gray-600 leading-relaxed">{point.content}</p>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <button className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors">
          Download Full Deck
        </button>
      </div>
    </div>
  );
};

export default PitchDeck;