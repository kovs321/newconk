import { OHLCVData } from '../components/TradingChart';
import { SwapEvent } from './HeliusWebSocketService';
import { TimeInterval } from './SolanaTrackerService';

export interface CandleUpdate {
  candle: OHLCVData;
  isNewCandle: boolean;
}

export type CandleUpdateHandler = (update: CandleUpdate) => void;

export class OHLCVAggregator {
  private currentCandles = new Map<number, OHLCVData>();
  private interval: TimeInterval;
  private intervalMs: number;
  private updateHandlers: CandleUpdateHandler[] = [];
  private tokenPair: { tokenIn: string; tokenOut: string };

  constructor(interval: TimeInterval = '1m', tokenPair: { tokenIn: string; tokenOut: string }) {
    this.interval = interval;
    this.intervalMs = this.getIntervalMs(interval);
    this.tokenPair = tokenPair;
  }

  /**
   * Process a new swap event and update OHLCV data
   */
  processSwapEvent(swapEvent: SwapEvent): void {
    // Only process swaps for our token pair
    if (!this.isRelevantSwap(swapEvent)) {
      return;
    }

    const price = this.calculatePrice(swapEvent);
    const volume = swapEvent.volume;
    const timestamp = swapEvent.timestamp;

    // Align timestamp to interval boundary
    const candleTime = this.alignTimestamp(timestamp);
    
    // Get or create candle for this time period
    const existingCandle = this.currentCandles.get(candleTime);
    let isNewCandle = false;

    let updatedCandle: OHLCVData;

    if (existingCandle) {
      // Update existing candle
      updatedCandle = {
        time: candleTime as any,
        open: existingCandle.open,
        high: Math.max(existingCandle.high, price),
        low: Math.min(existingCandle.low, price),
        close: price,
        volume: (existingCandle.volume || 0) + volume,
      };
    } else {
      // Create new candle
      updatedCandle = {
        time: candleTime as any,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume,
      };
      isNewCandle = true;
    }

    this.currentCandles.set(candleTime, updatedCandle);

    // Notify handlers
    this.notifyHandlers({
      candle: updatedCandle,
      isNewCandle,
    });

    // Clean up old candles (keep only recent ones to prevent memory leaks)
    this.cleanupOldCandles();
  }

  /**
   * Set initial historical data
   */
  setHistoricalData(historicalData: OHLCVData[]): void {
    this.currentCandles.clear();
    
    historicalData.forEach(candle => {
      const timestamp = typeof candle.time === 'number' ? candle.time : parseInt(candle.time as string);
      this.currentCandles.set(timestamp, candle);
    });
  }

  /**
   * Get current candles as array
   */
  getCurrentCandles(): OHLCVData[] {
    return Array.from(this.currentCandles.values()).sort((a, b) => {
      const timeA = typeof a.time === 'number' ? a.time : parseInt(a.time as string);
      const timeB = typeof b.time === 'number' ? b.time : parseInt(b.time as string);
      return timeA - timeB;
    });
  }

  /**
   * Get the latest candle
   */
  getLatestCandle(): OHLCVData | null {
    const candles = this.getCurrentCandles();
    return candles.length > 0 ? candles[candles.length - 1] : null;
  }

  /**
   * Check if a swap is relevant to our token pair
   */
  private isRelevantSwap(swapEvent: SwapEvent): boolean {
    return (
      (swapEvent.tokenIn === this.tokenPair.tokenIn && swapEvent.tokenOut === this.tokenPair.tokenOut) ||
      (swapEvent.tokenIn === this.tokenPair.tokenOut && swapEvent.tokenOut === this.tokenPair.tokenIn)
    );
  }

  /**
   * Calculate price from swap event
   */
  private calculatePrice(swapEvent: SwapEvent): number {
    // If the swap is in the reverse direction, invert the price
    if (swapEvent.tokenIn === this.tokenPair.tokenOut && swapEvent.tokenOut === this.tokenPair.tokenIn) {
      return 1 / swapEvent.price;
    }
    return swapEvent.price;
  }

  /**
   * Align timestamp to interval boundary
   */
  private alignTimestamp(timestamp: number): number {
    // Convert to milliseconds if needed
    const tsMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    
    // Align to interval boundary
    const aligned = Math.floor(tsMs / this.intervalMs) * this.intervalMs;
    
    // Convert back to seconds for consistency
    return Math.floor(aligned / 1000);
  }

  /**
   * Convert interval string to milliseconds
   */
  private getIntervalMs(interval: TimeInterval): number {
    const intervalMap: Record<TimeInterval, number> = {
      '1s': 1000,
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
      '1w': 604800000,
      '1M': 2592000000, // Approximate month
    };
    
    return intervalMap[interval] || 60000;
  }

  /**
   * Clean up old candles to prevent memory leaks
   */
  private cleanupOldCandles(): void {
    const maxCandles = 1000; // Keep last 1000 candles
    
    if (this.currentCandles.size > maxCandles) {
      const sortedTimestamps = Array.from(this.currentCandles.keys()).sort((a, b) => a - b);
      const toDelete = sortedTimestamps.slice(0, sortedTimestamps.length - maxCandles);
      
      toDelete.forEach(timestamp => {
        this.currentCandles.delete(timestamp);
      });
    }
  }

  /**
   * Add handler for candle updates
   */
  onCandleUpdate(handler: CandleUpdateHandler): void {
    this.updateHandlers.push(handler);
  }

  /**
   * Remove candle update handler
   */
  removeCandleUpdateHandler(handler: CandleUpdateHandler): void {
    const index = this.updateHandlers.indexOf(handler);
    if (index > -1) {
      this.updateHandlers.splice(index, 1);
    }
  }

  /**
   * Notify all handlers of candle updates
   */
  private notifyHandlers(update: CandleUpdate): void {
    this.updateHandlers.forEach(handler => {
      try {
        handler(update);
      } catch (error) {
        console.error('Error in candle update handler:', error);
      }
    });
  }

  /**
   * Update token pair
   */
  setTokenPair(tokenPair: { tokenIn: string; tokenOut: string }): void {
    this.tokenPair = tokenPair;
  }

  /**
   * Update interval
   */
  setInterval(interval: TimeInterval): void {
    this.interval = interval;
    this.intervalMs = this.getIntervalMs(interval);
    
    // Clear current candles when changing interval
    this.currentCandles.clear();
  }

  /**
   * Generate a synthetic candle for the current time period if no trades occurred
   */
  generateSyntheticCandle(lastPrice: number): OHLCVData | null {
    const now = Math.floor(Date.now() / 1000);
    const candleTime = this.alignTimestamp(now);
    
    // Don't generate if we already have a candle for this period
    if (this.currentCandles.has(candleTime)) {
      return null;
    }

    const syntheticCandle: OHLCVData = {
      time: candleTime as any,
      open: lastPrice,
      high: lastPrice,
      low: lastPrice,
      close: lastPrice,
      volume: 0,
    };

    this.currentCandles.set(candleTime, syntheticCandle);
    
    this.notifyHandlers({
      candle: syntheticCandle,
      isNewCandle: true,
    });

    return syntheticCandle;
  }

  /**
   * Get statistics for current session
   */
  getSessionStats(): {
    totalVolume: number;
    priceChange: number;
    priceChangePercent: number;
    high24h: number;
    low24h: number;
    candleCount: number;
  } {
    const candles = this.getCurrentCandles();
    
    if (candles.length === 0) {
      return {
        totalVolume: 0,
        priceChange: 0,
        priceChangePercent: 0,
        high24h: 0,
        low24h: 0,
        candleCount: 0,
      };
    }

    const firstCandle = candles[0];
    const lastCandle = candles[candles.length - 1];
    
    const totalVolume = candles.reduce((sum, candle) => sum + (candle.volume || 0), 0);
    const priceChange = lastCandle.close - firstCandle.open;
    const priceChangePercent = (priceChange / firstCandle.open) * 100;
    const high24h = Math.max(...candles.map(c => c.high));
    const low24h = Math.min(...candles.map(c => c.low));

    return {
      totalVolume,
      priceChange,
      priceChangePercent,
      high24h,
      low24h,
      candleCount: candles.length,
    };
  }
}