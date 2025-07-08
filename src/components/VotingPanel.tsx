import React, { useState } from 'react';

interface VotingItem {
  id: string;
  symbol: string;
  name: string;
  votes: number;
  totalVotes: number;
  userVoted?: boolean;
}

const VotingPanel = () => {
  const [votingItems, setVotingItems] = useState<VotingItem[]>([
    { id: '1', symbol: 'ORCA', name: 'Orca Protocol', votes: 1250, totalVotes: 5000 },
    { id: '2', symbol: 'RAY', name: 'Raydium', votes: 1800, totalVotes: 5000 },
    { id: '3', symbol: 'SERUM', name: 'Serum', votes: 980, totalVotes: 5000 },
    { id: '4', symbol: 'MNGO', name: 'Mango Markets', votes: 970, totalVotes: 5000 },
  ]);

  const handleVote = (itemId: string) => {
    setVotingItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, votes: item.votes + 1, userVoted: true }
          : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {votingItems.map((item) => {
        const percentage = (item.votes / item.totalVotes) * 100;
        
        return (
          <div key={item.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">{item.symbol}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">{item.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{item.votes}</p>
                <p className="text-sm text-gray-500">votes</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-medium text-gray-700">{percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
            
            <button
              onClick={() => handleVote(item.id)}
              disabled={item.userVoted}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                item.userVoted
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {item.userVoted ? 'Voted' : 'Vote'}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default VotingPanel;