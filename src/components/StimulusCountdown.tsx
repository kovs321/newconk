import React, { useState, useEffect } from 'react';
import DecryptedText from './DecryptedText';

const StimulusCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 5, seconds: 0 });
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime.minutes === 0 && prevTime.seconds === 0) {
            // Reset to 5 minutes when countdown reaches 0
            return { minutes: 5, seconds: 0 };
          } else if (prevTime.seconds === 0) {
            return { minutes: prevTime.minutes - 1, seconds: 59 };
          } else {
            return { ...prevTime, seconds: prevTime.seconds - 1 };
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (time: number) => {
    return time.toString().padStart(2, '0');
  };

  return (
    <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl p-6 border-2 border-orange-400 shadow-lg max-w-2xl mx-auto mb-12">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-black mb-2 font-tech uppercase tracking-wider">
          <DecryptedText 
            text="Next Stimulus Airdrop"
            speed={80}
            maxIterations={10}
            sequential={true}
            revealDirection="center"
            animateOn="view"
            className="text-black"
            encryptedClassName="text-orange-800"
          />
        </h3>
        
        <div className="flex justify-center items-center space-x-4 mb-4">
          {/* Minutes */}
          <div className="bg-black rounded-lg p-4 min-w-[80px]">
            <div className="text-4xl font-black text-orange-500 font-mono">
              {formatTime(timeLeft.minutes)}
            </div>
            <div className="text-sm text-gray-400 font-tech uppercase tracking-wider">
              Minutes
            </div>
          </div>
          
          {/* Colon */}
          <div className="text-4xl font-black text-black animate-pulse">:</div>
          
          {/* Seconds */}
          <div className="bg-black rounded-lg p-4 min-w-[80px]">
            <div className="text-4xl font-black text-orange-500 font-mono">
              {formatTime(timeLeft.seconds)}
            </div>
            <div className="text-sm text-gray-400 font-tech uppercase tracking-wider">
              Seconds
            </div>
          </div>
        </div>
        
        <p className="text-black font-tech font-semibold">
          Automatic rewards for holders with 100k+ BONKDROP tokens
        </p>
        
        {/* Coin Animation */}
        <div className="mt-4">
          <div className="inline-flex items-center space-x-2">
            <iframe 
              src="https://lottie.host/embed/c49deb67-2942-4b74-b03c-8d1dd9538e84/U3OX1nU2hv.lottie"
              className="w-6 h-6 border-0"
              title="Live Stimulus Animation"
            />
            <span className="text-black font-tech text-sm uppercase tracking-wider">
              Live Stimulus Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StimulusCountdown;