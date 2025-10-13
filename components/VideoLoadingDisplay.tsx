import React, { useState, useEffect } from 'react';

const messages = [
  "Warming up the virtual cameras...",
  "Scouting for the perfect angles...",
  "Directing the digital dolly grip...",
  "Adjusting the virtual lighting...",
  "Rendering the scene frame by frame...",
  "Applying cinematic color grading...",
  "Compositing the final shots...",
  "This can take a few minutes, the results will be worth it!",
];

export const VideoLoadingDisplay: React.FC = () => {
  const [currentMessage, setCurrentMessage] = useState(messages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMessage(prev => {
        const currentIndex = messages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="w-full text-center p-8 bg-slate-900/50 rounded-lg border border-slate-700">
      <div className="flex items-center justify-center mb-4 h-8">
         <div style={{animationDelay: '0s'}} className="w-3 h-full bg-cyan-400 rounded-full mx-1 animate-wave"></div>
         <div style={{animationDelay: '0.1s'}} className="w-3 h-full bg-cyan-400 rounded-full mx-1 animate-wave"></div>
         <div style={{animationDelay: '0.2s'}} className="w-3 h-full bg-cyan-400 rounded-full mx-1 animate-wave"></div>
         <div style={{animationDelay: '0.3s'}} className="w-3 h-full bg-cyan-400 rounded-full mx-1 animate-wave"></div>
         <div style={{animationDelay: '0.4s'}} className="w-3 h-full bg-cyan-400 rounded-full mx-1 animate-wave"></div>
      </div>
      <h3 className="text-xl font-bold text-slate-200 mb-2">Creating Your Video Tour</h3>
      <p className="text-slate-400 transition-opacity duration-500 min-h-[24px]">{currentMessage}</p>
    </div>
  );
};