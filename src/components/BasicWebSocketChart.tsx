import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, IChartApi, ISeriesApi } from 'lightweight-charts';

interface PriceData {
  time: number;
  value: number;
}

const BasicWebSocketChart: React.FC = () => {
  console.log('🚀 BASIC WebSocket Chart Loaded - Version 2025-01-09-15:05');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const [data, setData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const TOKEN_MINT = 'GJU3bXxNkNtYxgjkoFhAdq7VrXJAB2GW4Cpt6kLcbonk'; // Custom token
  const WS_URL = 'wss://datastream.solanatracker.io/0ff60d55-2242-4079-9a5d-f24263b67ef0';

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev.slice(-9), logMessage]); // Keep last 10 logs
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    addLog('🎯 Initializing chart...');

    const chart = createChart(chartContainerRef.current, {
      layout: { 
        textColor: 'white', 
        background: { type: 'solid', color: '#111827' } 
      },
      width: chartContainerRef.current.clientWidth,
      height: 250,
      grid: {
        vertLines: { color: '#f0f3fa' },
        horzLines: { color: '#f0f3fa' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });
    
    const lineSeries = chart.addSeries(LineSeries, { 
      color: '#FF8C00',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 6,
        minMove: 0.000001,
      },
    });

    chartRef.current = chart;
    seriesRef.current = lineSeries;

    addLog('✅ Chart initialized');

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        addLog('🔌 Connecting to WebSocket...');
        
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          addLog('✅ WebSocket connected');
          setConnected(true);
          
          // Subscribe to SOL price
          const subscription = {
            type: 'join',
            room: `price:${TOKEN_MINT}`
          };
          
          ws.send(JSON.stringify(subscription));
          addLog(`📡 Subscribed to price:${TOKEN_MINT}`);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            addLog(`📨 Message received: ${message.type}`);
            
            if (message.type === 'message' && message.room === `price:${TOKEN_MINT}`) {
              const priceData = message.data;
              addLog(`💰 Price: $${priceData.price}`);
              
              const newPoint: PriceData = {
                time: Math.floor(priceData.time / 1000),
                value: priceData.price
              };

              setCurrentPrice(priceData.price);
              setLastUpdate(new Date().toLocaleTimeString());

              setData(prevData => {
                const newData = [...prevData, newPoint];
                if (newData.length > 100) {
                  newData.splice(0, newData.length - 100);
                }
                return newData;
              });

              if (seriesRef.current) {
                seriesRef.current.update(newPoint);
              }
            }
          } catch (error) {
            addLog(`❌ Message parse error: ${error}`);
          }
        };

        ws.onclose = () => {
          addLog('❌ WebSocket disconnected');
          setConnected(false);
        };

        ws.onerror = (error) => {
          addLog(`🚨 WebSocket error: ${error}`);
          setConnected(false);
        };

      } catch (error) {
        addLog(`💥 Connection failed: ${error}`);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Status */}
      <div className="flex items-center justify-between p-3 bg-gray-100 rounded">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">
            {currentPrice ? `$${currentPrice.toFixed(6)}` : '--'}
          </div>
          <div className="text-xs text-gray-500">
            {lastUpdate ? `Last: ${lastUpdate}` : 'No updates'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="w-full h-60 border border-gray-200 rounded" />

    </div>
  );
};

export default BasicWebSocketChart;