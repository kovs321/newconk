import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Datastream } from '@solana-tracker/data-api';

interface PriceData {
  time: number;
  value: number;
}

const LiveWebSocketChart: React.FC = () => {
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

  const TOKEN_MINT = '71B6bJU6nAFrEJfRyvhToR4r9qA3H7tY2whvup4ibonk';
  const DATASTREAM_URL = 'wss://datastream.solanatracker.io/d4fc0684-2e18-4de4-abab-cbe984738ea7';

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { 
        textColor: 'black', 
        background: { type: 'solid', color: 'white' } 
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      grid: {
        vertLines: { color: '#f0f3fa' },
        horzLines: { color: '#f0f3fa' },
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
        borderColor: '#D1D5DB',
        textColor: '#333333',
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
        console.log('Connecting to Solana Tracker WebSocket...');
        
        // Initialize the Datastream
        const dataStream = new Datastream({
          wsUrl: DATASTREAM_URL
        });

        datastreamRef.current = dataStream;

        // Handle connection events
        dataStream.on('connected', () => {
          console.log('Connected to datastream');
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
        console.log(`Subscribing to price updates for token: ${TOKEN_MINT}`);
        const subscription = dataStream.subscribe.price.token(TOKEN_MINT).on((priceData) => {
          console.log(`New price: ${priceData.price}`);
          console.log(`Time: ${new Date(priceData.time).toLocaleTimeString()}`);
          
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
    <div className="w-full bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900">Live WebSocket Chart</h3>
            <p className="text-sm text-gray-600">Real-time price via Solana Tracker SDK</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Live Price</div>
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
              <span className="text-sm font-medium text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status and Controls */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {lastUpdateTime ? (
                <span>Last update: {lastUpdateTime.toLocaleTimeString()}</span>
              ) : (
                <span>No price updates received yet</span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {data.length} data points
            </div>
          </div>
          <button
            onClick={testWithSOL}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test with SOL
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="p-4">
        <div ref={chartContainerRef} className="w-full h-80 border border-gray-200 rounded-lg" />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 text-center">
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