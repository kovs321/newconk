
import React from 'react';
import { Square, Circle, Minus } from 'lucide-react';
import { Button } from './ui/button';

interface ShapeToolsProps {
  currentTool: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line';
  onToolChange: (tool: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line') => void;
}

export const ShapeTools: React.FC<ShapeToolsProps> = ({
  currentTool,
  onToolChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-700">Shapes:</span>
      <div className="flex gap-1">
        <Button
          variant={currentTool === 'rectangle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolChange('rectangle')}
          className="px-2"
        >
          <Square className="w-4 h-4" />
        </Button>
        <Button
          variant={currentTool === 'circle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolChange('circle')}
          className="px-2"
        >
          <Circle className="w-4 h-4" />
        </Button>
        <Button
          variant={currentTool === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolChange('line')}
          className="px-2"
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
