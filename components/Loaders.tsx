import React from 'react';

export const LoadingDots: React.FC = () => (
    <div className="flex items-center space-x-2 py-1">
        <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></div>
        <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse [animation-delay:0.4s]"></div>
    </div>
);

export const LoadingCursor: React.FC = () => (
  <span className="animate-pulse">▍</span>
);
