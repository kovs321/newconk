import React, { useEffect, useRef, useState } from 'react';
import { Datastream } from '@solana-tracker/data-api';

const SimpleWebSocketTest: React.FC = () => {
  console.log('🧪 SimpleWebSocketTest Component Loaded - Version 2025-01-09-14:50');
  
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const datastreamRef = useRef<Datastream | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev.slice(-19), logMessage]); // Keep last 20 logs
  };

  useEffect(() => {
    const testWebSocket = async () => {
      try {
        addLog('🚀 Starting WebSocket test...');
        
        const datastream = new Datastream({
          wsUrl: 'wss://datastream.solanatracker.io/d4fc0684-2e18-4de4-abab-cbe984738ea7'
        });

        datastreamRef.current = datastream;

        datastream.on('connected', () => {
          addLog('✅ Connected to datastream');
          setConnected(true);
        });

        datastream.on('disconnected', () => {
          addLog('❌ Disconnected from datastream');
          setConnected(false);
        });

        datastream.on('error', (error) => {
          addLog(`🚨 Error: ${error.message || error}`);
          setConnected(false);
        });

        addLog('🔌 Attempting to connect...');
        await datastream.connect();

        // Test 1: Subscribe to latest tokens (should work immediately)
        addLog('📡 Testing: Subscribe to latest tokens...');
        const latestSub = datastream.subscribe.latest().on((data) => {
          addLog(`📦 Latest token: ${data.token?.name || 'Unknown'}`);
        });

        // Test 2: Subscribe to SOL price (should work immediately)
        addLog('💰 Testing: Subscribe to SOL price...');
        const solSub = datastream.subscribe.price.token('So11111111111111111111111111111111111111112').on((priceData) => {
          addLog(`💵 SOL Price: $${priceData.price} at ${new Date(priceData.time).toLocaleTimeString()}`);
        });

        // Test 3: Subscribe to your token
        addLog('🎯 Testing: Subscribe to your token...');
        const tokenSub = datastream.subscribe.price.token('71B6bJU6nAFrEJfRyvhToR4r9qA3H7tY2whvup4ibonk').on((priceData) => {
          addLog(`🎯 Your Token Price: $${priceData.price} at ${new Date(priceData.time).toLocaleTimeString()}`);
        });

        // Store subscriptions for cleanup
        datastreamRef.current = datastream;
        (datastreamRef.current as any).testSubscriptions = [latestSub, solSub, tokenSub];

      } catch (error) {
        addLog(`💥 Connection failed: ${error}`);
        setConnected(false);
      }
    };

    testWebSocket();

    return () => {
      if (datastreamRef.current) {
        if ((datastreamRef.current as any).testSubscriptions) {
          (datastreamRef.current as any).testSubscriptions.forEach((sub: any) => {
            try {
              sub.unsubscribe();
            } catch (e) {
              console.log('Error unsubscribing:', e);
            }
          });
        }
        datastreamRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="w-full bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">WebSocket Connection Test</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="text-xs leading-relaxed">
            {log}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-500">Starting WebSocket test...</div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        This test will show exactly what's happening with the WebSocket connection.
        You should see connection events, and then price updates for SOL immediately.
      </div>
    </div>
  );
};

export default SimpleWebSocketTest;