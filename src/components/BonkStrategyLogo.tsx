import React from 'react';

interface BonkStrategyLogoProps {
  className?: string;
}

export const BonkStrategyLogo: React.FC<BonkStrategyLogoProps> = ({ className = '' }) => {
  return (
    <img 
      src="/bonkstrategy-logo.png" 
      alt="BonkStrategy" 
      className={className}
    />
  );
};