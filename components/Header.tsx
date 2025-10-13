import React from 'react';
import { PaintBrushIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <PaintBrushIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Room Shaper AI
          </h1>
        </div>
      </div>
    </header>
  );
};
