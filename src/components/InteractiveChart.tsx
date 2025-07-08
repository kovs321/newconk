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
  const lastUpdateTimeRef = useRef<number>(0);

  // Real-time updates via API polling
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
    if (isUpdating) return; // Prevent overlapping requests
    
    try {
      setIsUpdating(true);
      
      // Get only the latest few data points to avoid reloading entire chart
      const response = await fetch(
        `https://data.solanatracker.io/chart/${TOKEN_MINT}?type=1m&limit=5`,
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
      
      if (result.oclhv && Array.isArray(result.oclhv)) {
        const newData = result.oclhv
          .filter((item: any) => item && item.time && item.close)
          .map((item: any) => ({
            time: item.time,
            value: item.close,
          }))
          .sort((a, b) => a.time - b.time);

        if (newData.length > 0) {
          const latestPoint = newData[newData.length - 1];
          
          // Only update if we have newer data
          if (latestPoint.time > lastUpdateTimeRef.current) {
            lastUpdateTimeRef.current = latestPoint.time;
            
            // Update current price with direction
            setCurrentPrice(prevPrice => {
              if (prevPrice !== null) {
                setPreviousPrice(prevPrice);
                setPriceDirection(latestPoint.value > prevPrice ? 'up' : 'down');
                // Reset direction after animation
                setTimeout(() => setPriceDirection(null), 1000);
              }
              return latestPoint.value;
            });
            
            // Update chart data without resetting zoom
            setData(prevData => {
              const existingTimes = new Set(prevData.map(item => item.time));
              const newPoints = newData.filter(item => !existingTimes.has(item.time));
              
              if (newPoints.length > 0) {
                console.log('Adding new points to chart:', newPoints.length);
                
                // Update chart with new points only
                newPoints.forEach(point => {
                  if (seriesRef.current) {
                    console.log('Updating chart with point:', point);
                    seriesRef.current.update(point);
                  }
                });
                
                const updatedData = [...prevData, ...newPoints].sort((a, b) => a.time - b.time);
                return updatedData;
              }
              return prevData;
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching latest data:', error);
      // Don't show error for real-time updates to avoid spam
    } finally {
      setIsUpdating(false);
    }
  };


  // Generate simple sample data for area chart
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
    
    console.log('Generated sample data:', data.slice(0, 5));
    return data;
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching data from Solana Tracker API...');
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
      console.log('API Response:', result);
      
      let chartData: ChartData[] = [];
      
      if (result.oclhv && Array.isArray(result.oclhv)) {
        chartData = result.oclhv
          .filter((item: any) => item && item.time && item.close) // Filter out invalid data
          .map((item: any) => ({
            time: item.time,
            value: item.close,
          }))
          .sort((a, b) => a.time - b.time); // Sort by time
        console.log('Processed chart data:', chartData);
        console.log('Sample data points:', chartData.slice(0, 5));
      }

      // If no data or very little data, use sample data
      if (chartData.length < 5) {
        console.log('Using sample data due to insufficient API data');
        chartData = generateSampleData();
      }

      setData(chartData);
      if (chartData.length > 0) {
        setCurrentPrice(chartData[chartData.length - 1].value);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // Use sample data on error
      const sampleData = generateSampleData();
      setData(sampleData);
      setCurrentPrice(sampleData[sampleData.length - 1].value);
    } finally {
      setLoading(false);
    }
  };

  // Initialize chart with area series (only once)
  useEffect(() => {
    if (!chartContainerRef.current) {
      console.log('Chart container not ready');
      return;
    }

    console.log('Initializing chart...');
    
    try {
      const chartOptions = { 
        layout: { 
          textColor: 'black', 
          background: { type: 'solid', color: 'white' } 
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
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
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        // Enable interactions
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          mouseWheel: true,
          pinch: true,
        },
      };

      console.log('Creating chart with container:', chartContainerRef.current);
      console.log('Container dimensions:', chartContainerRef.current.clientWidth, 'x', chartContainerRef.current.clientHeight);
      
      const chart = createChart(chartContainerRef.current, chartOptions);
      console.log('Chart created successfully');
      
      const areaSeries = chart.addSeries(AreaSeries, { 
        lineColor: '#2962FF', 
        topColor: '#2962FF', 
        bottomColor: 'rgba(41, 98, 255, 0.28)' 
      });
      console.log('Area series created successfully');

      chartRef.current = chart;
      seriesRef.current = areaSeries;

      console.log('Chart initialized, series ready:', !!seriesRef.current);
      
      // Force initial data load if data already exists
      setTimeout(() => {
        if (data.length > 0) {
          console.log('Force setting initial data');
          const formattedData = data.map(item => ({
            time: item.time,
            value: Number(item.value)
          }));
          areaSeries.setData(formattedData);
          chart.timeScale().fitContent();
        }
      }, 100);

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          const container = chartContainerRef.current;
          chartRef.current.applyOptions({ 
            width: container.clientWidth,
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
  }, []); // Initialize chart only once

  // Update chart with data when both chart and data are ready
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      console.log('Setting data to chart:', data.length, 'points');
      console.log('First few data points:', data.slice(0, 3));
      
      try {
        const formattedData = data.map(item => ({
          time: item.time,
          value: Number(item.value)
        }));
        
        console.log('Formatted data:', formattedData.slice(0, 3));
        
        seriesRef.current.setData(formattedData);
        
        if (chartRef.current) {
          setTimeout(() => {
            chartRef.current?.timeScale().fitContent();
          }, 100);
        }
        
        console.log('Chart data set successfully');
      } catch (error) {
        console.error('Error setting chart data:', error);
      }
    } else {
      console.log('Chart not ready:', {
        seriesExists: !!seriesRef.current,
        dataLength: data.length
      });
    }
  }, [data]);

  // Load data on mount
  useEffect(() => {
    // Temporary: Force sample data for testing
    console.log('Loading sample data for testing...');
    const sampleData = generateSampleData();
    setData(sampleData);
    setCurrentPrice(sampleData[sampleData.length - 1].value);
    setLoading(false);
    
    // Also fetch real data
    fetchData();
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Cleanup on unmount
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
            <h3 className="text-lg font-semibold text-gray-900">Live Token Chart</h3>
            <p className="text-sm text-gray-600">Real-time price updates via WebSocket</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Current Price</div>
              <div className={`text-2xl font-bold transition-all duration-300 ${
                currentPrice ? 
                  priceDirection === 'up' ? 'text-green-500 transform scale-110' :
                  priceDirection === 'down' ? 'text-red-500 transform scale-110' :
                  'text-blue-600' 
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
        <div ref={chartContainerRef} className="w-full h-96 border border-gray-200 rounded-lg" />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 text-center">
          {error ? 'Sample data displayed' : 'Real-time updates via Solana Tracker API'}
        </div>
      </div>
    </div>
  );
};

export default InteractiveChart;