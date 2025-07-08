
import React from 'react';
import { Pen, Eraser, Download, Trash2, Minus, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface ToolbarProps {
  currentTool: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line';
  onToolChange: (tool: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line') => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onDownload: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  onClear,
  onDownload,
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        <Button
          variant={currentTool === 'pen' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolChange('pen')}
          className="flex items-center gap-2"
        >
          <Pen className="w-4 h-4" />
          Pen
        </Button>
        <Button
          variant={currentTool === 'eraser' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToolChange('eraser')}
          className="flex items-center gap-2"
        >
          <Eraser className="w-4 h-4" />
          Eraser
        </Button>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
        <Minus className="w-4 h-4 text-slate-600" />
        <div className="w-24">
          <Slider
            value={[brushSize]}
            onValueChange={(value) => onBrushSizeChange(value[0])}
            max={20}
            min={1}
            step={1}
            className="w-full"
          />
        </div>
        <Plus className="w-4 h-4 text-slate-600" />
        <span className="text-sm text-slate-600 min-w-[2rem]">{brushSize}px</span>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="flex items-center gap-2 text-green-600 hover:text-green-700"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>
    </div>
  );
};
