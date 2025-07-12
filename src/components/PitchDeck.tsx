import React from 'react';

const PitchDeck = () => {
  const keyPoints = [
    {
      title: "Platform Overview",
      content: "BONKDROP delivers exclusive airdrop opportunities to community members through engagement-based rewards and strategic partnerships."
    },
    {
      title: "Airdrop Model",
      content: "Distribute tokens through community engagement metrics, social activity, and participation in ecosystem events with transparent allocation."
    },
    {
      title: "Risk Management",
      content: "Multi-layered risk controls including position limits, correlation analysis, and automated rebalancing triggers."
    },
    {
      title: "Community Rewards",
      content: "Reward active community members with exclusive airdrops based on engagement scores, social participation, and ecosystem contribution."
    },
    {
      title: "Engagement Metrics",
      content: "Track community activity including social engagement, trading volume, participation rates, and total airdrop distribution."
    },
    {
      title: "Roadmap",
      content: "Q4 2024: Platform launch, Q1 2025: Mobile app, Q2 2025: Multi-chain airdrops, Q3 2025: DAO governance and advanced rewards."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {keyPoints.map((point, index) => (
          <div key={index} className="bg-gray-800 border border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-white mb-3 font-tech uppercase tracking-wider">{point.title}</h4>
            <p className="text-gray-300 leading-relaxed font-tech">{point.content}</p>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <button className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors font-tech uppercase tracking-wider">
          Download Full Deck
        </button>
      </div>
    </div>
  );
};

export default PitchDeck;