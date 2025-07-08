import { OHLCVData } from '../components/TradingChart';

export interface SolanaTrackerConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface SolanaTrackerChartResponse {
  data: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  success: boolean;
  message?: string;
}

export type TimeInterval = '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

export class SolanaTrackerService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: SolanaTrackerConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://data.solanatracker.io';
  }

  /**
   * Fetch historical OHLCV data for a token
   */
  async fetchHistoricalData(
    tokenMint: string,
    interval: TimeInterval = '1m',
    timeFrom?: number,
    timeTo?: number,
    limit?: number
  ): Promise<OHLCVData[]> {
    try {
      const params = new URLSearchParams();
      params.append('type', interval);
      
      if (timeFrom) {
        params.append('time_from', timeFrom.toString());
      }
      
      if (timeTo) {
        params.append('time_to', timeTo.toString());
      }
      
      if (limit) {
        params.append('limit', limit.toString());
      }

      const url = `${this.baseUrl}/chart/${tokenMint}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SolanaTrackerChartResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch chart data');
      }

      // Convert to TradingView format
      return data.data.map(item => ({
        time: item.time as any, // TradingView expects Unix timestamp
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));
    } catch (error) {
      console.error('Error fetching historical data from Solana Tracker:', error);
      throw error;
    }
  }

  /**
   * Get recent data for the last N periods
   */
  async getRecentData(
    tokenMint: string,
    interval: TimeInterval = '1m',
    periods: number = 100
  ): Promise<OHLCVData[]> {
    const now = Math.floor(Date.now() / 1000);
    
    // Calculate time range based on interval
    const intervalSeconds = this.getIntervalSeconds(interval);
    const timeFrom = now - (periods * intervalSeconds);
    
    return this.fetchHistoricalData(tokenMint, interval, timeFrom, now);
  }

  /**
   * Get data for a specific time range
   */
  async getDataForRange(
    tokenMint: string,
    interval: TimeInterval,
    startTime: Date,
    endTime: Date
  ): Promise<OHLCVData[]> {
    const timeFrom = Math.floor(startTime.getTime() / 1000);
    const timeTo = Math.floor(endTime.getTime() / 1000);
    
    return this.fetchHistoricalData(tokenMint, interval, timeFrom, timeTo);
  }

  /**
   * Get the most recent price data point
   */
  async getCurrentPrice(tokenMint: string): Promise<number | null> {
    try {
      const recentData = await this.getRecentData(tokenMint, '1m', 1);
      return recentData.length > 0 ? recentData[0].close : null;
    } catch (error) {
      console.error('Error fetching current price:', error);
      return null;
    }
  }

  /**
   * Convert interval string to seconds
   */
  private getIntervalSeconds(interval: TimeInterval): number {
    const intervalMap: Record<TimeInterval, number> = {
      '1s': 1,
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
      '1w': 604800,
      '1M': 2592000, // Approximate month
    };
    
    return intervalMap[interval] || 60;
  }

  /**
   * Check if API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch a small amount of data for SOL (well-known token)
      const solMint = 'So11111111111111111111111111111111111111112';
      await this.getRecentData(solMint, '1h', 1);
      return true;
    } catch (error) {
      console.error('Solana Tracker API health check failed:', error);
      return false;
    }
  }
}

// Common Solana token mints for convenience
export const COMMON_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
} as const;