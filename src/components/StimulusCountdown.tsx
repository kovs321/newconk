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
    <div className="max-w-2xl mx-auto mb-12">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-300 mb-6 font-tech uppercase tracking-wider">
          <DecryptedText 
            text="Next Stimulus Airdrop In"
            speed={80}
            maxIterations={10}
            sequential={true}
            revealDirection="center"
            animateOn="view"
            className="text-gray-300"
            encryptedClassName="text-gray-600"
          />
        </h3>
        
        <div className="flex justify-center items-center space-x-2 mb-6">
          {/* Minutes */}
          <div className="bg-gray-800 rounded-lg p-6 min-w-[100px] border border-gray-700">
            <div className="text-5xl font-black text-orange-500 font-mono">
              {formatTime(timeLeft.minutes)}
            </div>
            <div className="text-sm text-gray-500 font-tech uppercase tracking-wider mt-2">
              Minutes
            </div>
          </div>
          
          {/* Colon */}
          <div className="text-4xl font-black text-gray-500">:</div>
          
          {/* Seconds */}
          <div className="bg-gray-800 rounded-lg p-6 min-w-[100px] border border-gray-700">
            <div className="text-5xl font-black text-orange-500 font-mono">
              {formatTime(timeLeft.seconds)}
            </div>
            <div className="text-sm text-gray-500 font-tech uppercase tracking-wider mt-2">
              Seconds
            </div>
          </div>
        </div>
        
        <p className="text-gray-400 font-tech text-sm mb-4">
          Automatic rewards for holders with 100k+ BONKDROP tokens
        </p>
        
        {/* Coin Animation */}
        <div className="inline-flex items-center space-x-2">
          <iframe 
            src="https://lottie.host/embed/c49deb67-2942-4b74-b03c-8d1dd9538e84/U3OX1nU2hv.lottie"
            className="w-5 h-5 border-0"
            title="Live Stimulus Animation"
          />
          <span className="text-gray-400 font-tech text-xs uppercase tracking-wider">
            Live Stimulus Active
          </span>
        </div>
      </div>
    </div>
  );
};

export default StimulusCountdown;