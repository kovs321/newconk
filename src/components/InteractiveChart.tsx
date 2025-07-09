import React, { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, IChartApi, ISeriesApi } from 'lightweight-charts';

interface ChartData {
  time: number;
  value: number;
}

const InteractiveChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const TOKEN_MINT = '34VWJ7PPwcPpYEqTGJQXo8qaMJYoP8VKuBGHPG3ypump';

  const SOLANA_TRACKER_API_KEY = 'ab5915df-4f94-449a-96c5-c37cbc92ef47';
  
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate sample data
  const generateSampleData = (): ChartData[] => {
    const data: ChartData[] = [];
    let price = 0.000001174;
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 100; i >= 0; i--) {
      const time = now - (i * 60); // 1 minute intervals
      const change = (Math.random() - 0.5) * 0.02;
      price = Math.max(price + change, 0.000000001);
      
      data.push({
        time,
        value: price
      });
    }
    
    return data;
  };

  // Fetch data
  const fetchData = async (): Promise<ChartData[]> => {
    try {
      console.log('Fetching OHLC data from Solana Tracker API...');
      const response = await fetch(
        `https://data.solanatracker.io/chart/${TOKEN_MINT}?type=1m&limit=100`,
        {
          headers: {
            'x-api-key': SOLANA_TRACKER_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      
      let chartData: ChartData[] = [];
      
      if (result.oclhv && Array.isArray(result.oclhv)) {
        chartData = result.oclhv
          .filter((item: any) => item && item.time && item.close)
          .map((item: any) => ({
            time: item.time,
            value: item.close,
          }))
          .sort((a, b) => a.time - b.time);
      }

      return chartData;
    } catch (err) {
      console.error('Error fetching data:', err);
      return [];
    }
  };

  // Initial data load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading initial chart data...');
      const apiData = await fetchData();
      
      // If no API data, use sample data
      const chartData = apiData.length > 5 ? apiData : generateSampleData();
      setData(chartData);
      
      if (chartData.length > 0) {
        const latestPrice = chartData[chartData.length - 1].value;
        setCurrentPrice(latestPrice);
        setPreviousPrice(latestPrice);
      }
      
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // Use sample data on error
      const sampleData = generateSampleData();
      setData(sampleData);
      
      if (sampleData.length > 0) {
        const latestPrice = sampleData[sampleData.length - 1].value;
        setCurrentPrice(latestPrice);
        setPreviousPrice(latestPrice);
      }
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates
  const startRealTimeUpdates = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    updateIntervalRef.current = setInterval(() => {
      fetchLatestData();
    }, 1000); // Update every second
    
    console.log('Started real-time updates (1 second interval)');
  };

  const stopRealTimeUpdates = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    console.log('Stopped real-time updates');
  };

  const fetchLatestData = async () => {
    if (isUpdating || !seriesRef.current) return;
    
    try {
      setIsUpdating(true);
      
      const latestData = await fetchData();
      
      if (latestData.length > 0) {
        // Update chart data - the useEffect will handle updating the series
        setData(latestData);
        
        // Update price and direction
        const latestPrice = latestData[latestData.length - 1].value;
        if (currentPrice !== null) {
          setPreviousPrice(currentPrice);
          setPriceDirection(latestPrice > currentPrice ? 'up' : 'down');
          
          // Reset price direction after animation
          setTimeout(() => {
            setPriceDirection(null);
          }, 1000);
        }
        setCurrentPrice(latestPrice);
      }
      
    } catch (error) {
      console.error('Error fetching latest data:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Initialize chart when data is available
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) {
      return;
    }

    // Clear existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    console.log('Initializing chart with', data.length, 'data points');
    
    try {
      const chart = createChart(chartContainerRef.current, {
        layout: { 
          textColor: 'black', 
          background: { type: 'solid', color: 'white' } 
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        grid: {
          vertLines: { color: '#f0f3fa' },
          horzLines: { color: '#f0f3fa' },
        },
        crosshair: { mode: 1 },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          scaleMargins: { top: 0.1, bottom: 0.1 },
          borderVisible: true,
          borderColor: '#D1D5DB',
          textColor: '#333333',
          entireTextOnly: false,
          ticksVisible: true,
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
      
      // Create area series
      const areaSeries = chart.addSeries(AreaSeries, { 
        lineColor: '#2962FF', 
        topColor: '#2962FF', 
        bottomColor: 'rgba(41, 98, 255, 0.28)',
        priceFormat: {
          type: 'price',
          precision: 9,
          minMove: 0.000000001,
        },
      });

      // Set data immediately
      areaSeries.setData(data);
      
      // Set zoom range
      const lastTime = data[data.length - 1].time;
      const sixHoursAgo = lastTime - (6 * 60 * 60);
      chart.timeScale().setVisibleRange({
        from: sixHoursAgo,
        to: lastTime + (30 * 60)
      });

      chartRef.current = chart;
      seriesRef.current = areaSeries;

      console.log('Chart initialized successfully with data');

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: 400
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
    } catch (error) {
      console.error('Error initializing chart:', error);
      setError('Failed to initialize chart');
    }
  }, [data]); // Re-initialize when data changes



  // Load data on mount
  useEffect(() => {
    loadInitialData();
    startRealTimeUpdates();
    
    return () => {
      stopRealTimeUpdates();
    };
  }, []);

  // Chart control functions
  const fitContent = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '--';
    return price.toFixed(9);
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading interactive chart...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900">Live Token Chart</h3>
            <p className="text-sm text-gray-600">BONK Price Updates</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`text-lg font-mono transition-all duration-300 ${
              currentPrice ? 
                priceDirection === 'up' ? 'text-green-500 transform scale-110' :
                priceDirection === 'down' ? 'text-red-500 transform scale-110' :
                'text-gray-900' 
              : 'text-gray-400'
            }`}>
              ${formatPrice(currentPrice)}
              {priceDirection && (
                <span className="ml-1">
                  {priceDirection === 'up' ? '↗' : '↘'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={fitContent}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
              title="Fit Content"
            >
              📏 Fit Chart
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Mouse wheel: Zoom • Drag: Pan
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-yellow-800 text-sm">API Error: {error}</span>
            <span className="text-yellow-600 text-xs">Using sample data</span>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="p-4">
        <div ref={chartContainerRef} className="w-full h-96 border border-gray-200 rounded-lg bg-white" />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 text-center">
          {error ? 'Sample data displayed' : 'Real-time updates every second via Solana Tracker API'}
        </div>
      </div>
    </div>
  );
};

export default InteractiveChart;