
import React from 'react';
import { Palette, Brush, Square, Circle } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Canvas Studio</h1>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <div className="flex items-center space-x-1">
              <Brush className="w-4 h-4" />
              <span>Draw</span>
            </div>
            <div className="flex items-center space-x-1">
              <Square className="w-4 h-4" />
              <span>Shapes</span>
            </div>
            <div className="flex items-center space-x-1">
              <Circle className="w-4 h-4" />
              <span>Tools</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
