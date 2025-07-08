import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';

export interface OHLCVData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TradingChartProps {
  data?: OHLCVData[];
  width?: number;
  height?: number;
  tokenSymbol?: string;
}

const TradingChart: React.FC<TradingChartProps> = ({ 
  data = [], 
  width = 800, 
  height = 400,
  tokenSymbol = 'SOL/USDC'
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#333',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { 
          color: '#f0f3fa',
          style: 1,
          visible: true,
        },
        horzLines: { 
          color: '#f0f3fa',
          style: 1,
          visible: true,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#9B7DFF',
          style: 3,
        },
        horzLine: {
          width: 1,
          color: '#9B7DFF',
          style: 3,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
        borderColor: '#fff000',
        rightOffset: 12,
        barSpacing: 3,
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: true,
      },
      rightPriceScale: {
        borderVisible: true,
        borderColor: '#fff000',
        scaleMargins: {
          top: 0.3,
          bottom: 0.25,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceFormat: {
        type: 'price',
        precision: 6,
        minMove: 0.000001,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const container = chartContainerRef.current;
        chartRef.current.applyOptions({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [width, height]);

  // Update chart data when data prop changes
  useEffect(() => {
    if (candlestickSeriesRef.current && data.length > 0) {
      setIsLoading(false);
      candlestickSeriesRef.current.setData(data as CandlestickData[]);
      
      // Fit content to show all data
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [data]);

  // Method to update with new real-time data
  const updateRealTimeData = (newData: OHLCVData) => {
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.update(newData as CandlestickData);
    }
  };

  // Expose update method via ref (for parent components)
  React.useImperativeHandle(chartContainerRef, () => ({
    updateRealTimeData,
  }));

  return (
    <div className="w-full h-full relative">
      {/* Chart Header */}
      <div className="absolute top-2 left-2 z-10 bg-white/80 backdrop-blur-sm rounded px-2 py-1">
        <span className="text-sm font-semibold text-gray-900">{tokenSymbol}</span>
        {data.length > 0 && (
          <span className="text-xs text-gray-600 ml-2">
            ${data[data.length - 1]?.close.toFixed(6)}
          </span>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Loading chart data...</span>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-full"
        style={{ minHeight: height }}
      />

      {/* Chart Attribution */}
      <div className="absolute bottom-1 right-1 text-xs text-gray-400">
        Powered by TradingView
      </div>
    </div>
  );
};

export default TradingChart;