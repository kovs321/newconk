import React from 'react';
import DecryptedText from './DecryptedText';

interface BonkdropLogoProps {
  className?: string;
}

const BonkdropLogo: React.FC<BonkdropLogoProps> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <DecryptedText 
        text="B"
        speed={80}
        maxIterations={15}
        sequential={true}
        revealDirection="center"
        animateOn="view"
        characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
        className="text-orange-500"
        encryptedClassName="text-gray-500"
      />
      <div className="inline-flex items-center justify-center" style={{ width: '0.8em', height: '0.8em', verticalAlign: 'middle' }}>
        <img 
          src="https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I" 
          alt="O"
          className="w-full h-full rounded-full"
          style={{ display: 'inline-block' }}
        />
      </div>
      <DecryptedText 
        text="NKDROP"
        speed={80}
        maxIterations={15}
        sequential={true}
        revealDirection="center"
        animateOn="view"
        characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
        className="text-orange-500"
        encryptedClassName="text-gray-500"
      />
    </div>
  );
};

export default BonkdropLogo;