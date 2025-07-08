import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const SimpleTradingChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        backgroundColor: 'white',
        textColor: 'black',
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Sample data
    const data = [
      { time: '2023-12-01', open: 100, high: 110, low: 95, close: 105 },
      { time: '2023-12-02', open: 105, high: 115, low: 100, close: 108 },
      { time: '2023-12-03', open: 108, high: 120, low: 105, close: 115 },
      { time: '2023-12-04', open: 115, high: 118, low: 110, close: 112 },
      { time: '2023-12-05', open: 112, high: 125, low: 108, close: 122 },
    ];

    candlestickSeries.setData(data);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default SimpleTradingChart;