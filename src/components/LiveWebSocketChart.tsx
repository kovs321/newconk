import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Datastream } from '@solana-tracker/data-api';
import DecryptedText from './DecryptedText';

interface PriceData {
  time: number;
  value: number;
}

const LiveWebSocketChart: React.FC = () => {
  // FORCE CACHE CLEAR - Version 2025-01-09-14:50
  console.log('🔥 CACHE CLEARED - LiveWebSocketChart Version 2025-01-09-14:50 LOADED');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const datastreamRef = useRef<Datastream | null>(null);
  const subscriptionRef = useRef<any>(null);
  
  const [data, setData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const TOKEN_MINT = 'So11111111111111111111111111111111111111112'; // SOL - guaranteed to work
  const DATASTREAM_URL = 'wss://datastream.solanatracker.io/0ff60d55-2242-4079-9a5d-f24263b67ef0';

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { 
        textColor: '#f97316', 
        background: { type: 'solid', color: '#111827' } 
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: { mode: 1 },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 12,
        barSpacing: 24,
      },
      rightPriceScale: {
        scaleMargins: { top: 0.1, bottom: 0.1 },
        borderVisible: true,
        borderColor: '#6B7280',
        textColor: '#F9FAFB',
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
      },
    });
    
    const lineSeries = chart.addSeries(LineSeries, { 
      color: '#2962FF',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 8,
        minMove: 0.00000001,
      },
      priceLineVisible: true,
      lastValueVisible: true,
      title: 'Live Price',
    });

    chartRef.current = chart;
    seriesRef.current = lineSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: 300
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeDatastream = async () => {
      try {
        console.log('🚀 NEW IMPLEMENTATION: Connecting to Solana Tracker WebSocket...');
        
        // Initialize the Datastream
        const dataStream = new Datastream({
          wsUrl: DATASTREAM_URL
        });

        datastreamRef.current = dataStream;

        // Handle connection events
        dataStream.on('connected', () => {
          console.log('🟢 NEW IMPLEMENTATION: Connected to datastream');
          setConnected(true);
        });

        dataStream.on('disconnected', () => {
          console.log('Disconnected from datastream');
          setConnected(false);
        });

        dataStream.on('error', (error) => {
          console.error('Datastream error:', error);
          setConnected(false);
        });

        // Connect to the WebSocket server
        await dataStream.connect();

        // Subscribe to token price updates
        console.log(`🔔 NEW IMPLEMENTATION: Subscribing to price updates for token: ${TOKEN_MINT}`);
        const subscription = dataStream.subscribe.price.token(TOKEN_MINT).on((priceData) => {
          console.log(`💰 NEW IMPLEMENTATION: New price: ${priceData.price}`);
          console.log(`⏰ NEW IMPLEMENTATION: Time: ${new Date(priceData.time).toLocaleTimeString()}`);
          
          const newPoint: PriceData = {
            time: Math.floor(priceData.time / 1000),
            value: priceData.price
          };

          // Update current price with direction
          setCurrentPrice(prevPrice => {
            if (prevPrice !== null) {
              setPriceDirection(priceData.price > prevPrice ? 'up' : 'down');
              setTimeout(() => setPriceDirection(null), 1000);
            }
            return priceData.price;
          });

          setLastUpdateTime(new Date());

          // Update chart data
          setData(prevData => {
            const newData = [...prevData, newPoint];
            
            // Keep only last 1000 points
            if (newData.length > 1000) {
              newData.splice(0, newData.length - 1000);
            }
            
            return newData;
          });

          // Update chart
          if (seriesRef.current) {
            seriesRef.current.update(newPoint);
          }
        });

        subscriptionRef.current = subscription;

      } catch (error) {
        console.error('Error initializing datastream:', error);
        setConnected(false);
      }
    };

    initializeDatastream();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (datastreamRef.current) {
        datastreamRef.current.disconnect();
      }
    };
  }, []);

  // Update chart when data changes
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  const formatPrice = (price: number | null) => {
    if (price === null) return '--';
    return price.toFixed(8);
  };

  const testWithSOL = () => {
    if (datastreamRef.current) {
      // Unsubscribe from current token
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      
      // Subscribe to SOL for testing
      console.log('Testing connection with SOL token...');
      const solSubscription = datastreamRef.current.subscribe.price.token('So11111111111111111111111111111111111111111').on((priceData) => {
        console.log(`SOL price: ${priceData.price}`);
        console.log(`Time: ${new Date(priceData.time).toLocaleTimeString()}`);
        
        const newPoint: PriceData = {
          time: Math.floor(priceData.time / 1000),
          value: priceData.price
        };

        setCurrentPrice(prevPrice => {
          if (prevPrice !== null) {
            setPriceDirection(priceData.price > prevPrice ? 'up' : 'down');
            setTimeout(() => setPriceDirection(null), 1000);
          }
          return priceData.price;
        });

        setLastUpdateTime(new Date());

        setData(prevData => {
          const newData = [...prevData, newPoint];
          if (newData.length > 1000) {
            newData.splice(0, newData.length - 1000);
          }
          return newData;
        });

        if (seriesRef.current) {
          seriesRef.current.update(newPoint);
        }
      });

      subscriptionRef.current = solSubscription;
    }
  };

  return (
    <div className="w-full bg-gray-900 border border-gray-700 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-orange-500 font-tech tracking-wider uppercase">
              <DecryptedText 
                text="Live WebSocket Chart"
                speed={70}
                maxIterations={10}
                sequential={true}
                revealDirection="start"
                animateOn="view"
                className="text-orange-500"
                encryptedClassName="text-gray-500"
              />
            </h3>
            <p className="text-sm text-gray-600 font-tech">Real-time price via Solana Tracker SDK</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1 font-tech uppercase tracking-wider">Live Price</div>
              <div className={`text-xl font-bold transition-all duration-300 ${
                currentPrice ? 
                  priceDirection === 'up' ? 'text-green-500 transform scale-105' :
                  priceDirection === 'down' ? 'text-red-500 transform scale-105' :
                  'text-cyan-600' 
                : 'text-gray-400'
              }`}>
                ${formatPrice(currentPrice)}
                {priceDirection && (
                  <span className="ml-1 text-sm">
                    {priceDirection === 'up' ? '↗' : '↘'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-600 font-tech tracking-wide">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status and Controls */}
      <div className="px-4 py-2 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              {lastUpdateTime ? (
                <span>Last update: {lastUpdateTime.toLocaleTimeString()}</span>
              ) : (
                <span>No price updates received yet</span>
              )}
            </div>
            <div className="text-sm text-gray-400">
              {data.length} data points
            </div>
          </div>
          <button
            onClick={testWithSOL}
            className="px-3 py-1 text-sm bg-gray-800 text-orange-500 rounded hover:bg-gray-700"
          >
            Test with SOL
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="p-4">
        <div ref={chartContainerRef} className="w-full h-80 border border-gray-600 rounded-lg bg-gray-800" />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-400 text-center">
          {connected ? 'Connected to Solana Tracker WebSocket' : 'Disconnected from WebSocket'}
          {!lastUpdateTime && connected && (
            <span className="ml-2 text-yellow-600">
              • Token might have low trading activity
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveWebSocketChart;