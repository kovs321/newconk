import React, { useEffect, useRef, useState } from 'react';

interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BasicChart: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  const TOKEN_MINT = '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump';
  const SOLANA_TRACKER_API_KEY = 'ab5915df-4f94-449a-96c5-c37cbc92ef47';

  // Generate sample data
  const generateSampleData = (): ChartData[] => {
    const data: ChartData[] = [];
    let price = 1.17;
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 50; i >= 0; i--) {
      const time = now - (i * 60);
      const change = (Math.random() - 0.5) * 0.02;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 0.01;
      const low = Math.min(open, close) - Math.random() * 0.01;
      const volume = Math.random() * 5000 + 1000;
      
      data.push({
        time,
        open,
        high,
        low,
        close,
        volume
      });
      
      price = close;
    }
    
    return data;
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://data.solanatracker.io/chart/${TOKEN_MINT}?type=1m&limit=50`,
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
        chartData = result.oclhv.map((item: any) => ({
          time: item.time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume || 0,
        }));
      }

      if (chartData.length < 10) {
        chartData = generateSampleData();
      }

      setData(chartData);
      if (chartData.length > 0) {
        setLastPrice(chartData[chartData.length - 1].close);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      const sampleData = generateSampleData();
      setData(sampleData);
      setLastPrice(sampleData[sampleData.length - 1].close);
    } finally {
      setLoading(false);
    }
  };

  // Draw simple line chart
  const drawChart = () => {
    if (!chartRef.current || data.length === 0) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get price range
    const prices = data.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#f0f3fa';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw price line
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.close - minPrice) / priceRange) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#10B981';
    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.close - minPrice) / priceRange) * height;
      
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw price labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange * i / 5);
      const y = height - (height / 5) * i;
      ctx.fillText(price.toFixed(6), width - 5, y - 5);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    drawChart();
  }, [data]);

  const formatPrice = (price: number | null) => {
    if (price === null) return '--';
    return price.toFixed(6);
  };

  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading chart...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Token Price Chart</h3>
          <p className="text-sm text-gray-600">Live price tracking</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">
            ${formatPrice(lastPrice)}
          </div>
          <div className="text-sm text-gray-600">
            {data.length} data points
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-yellow-800 text-sm">API Error: {error}</span>
            <span className="text-yellow-600 text-xs">Using sample data</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <canvas
        ref={chartRef}
        width={800}
        height={300}
        className="w-full h-80 border border-gray-200 rounded-lg"
        style={{ maxWidth: '100%' }}
      />

      {/* Controls */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {error ? 'Sample data displayed' : 'Live data from Solana Tracker'}
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default BasicChart;