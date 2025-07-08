import React, { useState, useEffect } from 'react';
import SimpleLiveChart from './SimpleLiveChart';
import BasicChart from './BasicChart';

const SafeChart: React.FC = () => {
  const [useTradingView, setUseTradingView] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Error boundary for TradingView chart
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message.includes('addCandlestickSeries') || 
          error.message.includes('addSeries') ||
          error.message.includes('CandlestickSeries')) {
        console.warn('TradingView chart error detected, falling back to basic chart');
        setUseTradingView(false);
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // If we detected an error, use the basic chart
  if (hasError || !useTradingView) {
    return <BasicChart />;
  }

  // Try TradingView chart first
  return (
    <ErrorBoundary fallback={<BasicChart />}>
      <SimpleLiveChart />
    </ErrorBoundary>
  );
};

// React Error Boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Chart error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default SafeChart;