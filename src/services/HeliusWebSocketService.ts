export interface HeliusConfig {
  apiKey: string;
  endpoint?: string;
}

export interface SwapEvent {
  signature: string;
  timestamp: number;
  price: number;
  volume: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
}

export interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  tokenTransfers?: Array<{
    fromTokenAccount: string;
    toTokenAccount: string;
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    mint: string;
  }>;
  events?: {
    swap?: {
      nativeInput: {
        account: string;
        amount: string;
      };
      nativeOutput: {
        account: string;
        amount: string;
      };
    };
  };
}

export type SwapEventHandler = (event: SwapEvent) => void;
export type ConnectionStatusHandler = (connected: boolean) => void;
export type ErrorHandler = (error: Error) => void;

export class HeliusWebSocketService {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private endpoint: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private subscriptions = new Set<string>();
  
  private swapEventHandlers: SwapEventHandler[] = [];
  private connectionStatusHandlers: ConnectionStatusHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  constructor(config: HeliusConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'wss://atlas-mainnet.helius-rpc.com';
  }

  /**
   * Connect to Helius WebSocket
   */
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      const wsUrl = `${this.endpoint}/?api-key=${this.apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Helius WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionStatus(true);
        
        // Resubscribe to any existing subscriptions
        this.resubscribe();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('Helius WebSocket disconnected');
        this.isConnecting = false;
        this.notifyConnectionStatus(false);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Helius WebSocket error:', error);
        this.isConnecting = false;
        this.notifyError(new Error('WebSocket connection error'));
      };

    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }

  /**
   * Subscribe to transaction events for specific accounts (like DEX programs)
   */
  async subscribeToTransactions(accounts: string[]): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const subscription = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 1000000),
      method: 'transactionSubscribe',
      params: [
        {
          accountInclude: accounts,
          vote: false,
          failed: false,
        },
        {
          commitment: 'confirmed',
          transactionDetails: 'full',
          showRewards: false,
          maxSupportedTransactionVersion: 0,
        },
      ],
    };

    this.ws.send(JSON.stringify(subscription));
    
    // Store subscription for reconnection
    accounts.forEach(account => this.subscriptions.add(account));
  }

  /**
   * Subscribe to Jupiter DEX aggregator for swap events
   */
  async subscribeToJupiterSwaps(): Promise<void> {
    const jupiterProgramId = 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB';
    await this.subscribeToTransactions([jupiterProgramId]);
  }

  /**
   * Subscribe to Raydium swaps
   */
  async subscribeToRaydiumSwaps(): Promise<void> {
    const raydiumProgramIds = [
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM
      '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', // Raydium Stable AMM
    ];
    await this.subscribeToTransactions(raydiumProgramIds);
  }

  /**
   * Subscribe to Orca swaps
   */
  async subscribeToOrcaSwaps(): Promise<void> {
    const orcaProgramIds = [
      '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', // Orca
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', // Orca Whirlpools
    ];
    await this.subscribeToTransactions(orcaProgramIds);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      if (message.method === 'transactionNotification') {
        const transaction: HeliusTransaction = message.params.result;
        this.processTransaction(transaction);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.notifyError(new Error('Failed to parse WebSocket message'));
    }
  }

  /**
   * Process transaction and extract swap events
   */
  private processTransaction(transaction: HeliusTransaction): void {
    try {
      // Check if this is a swap transaction
      if (transaction.type !== 'SWAP' && !transaction.events?.swap) {
        return;
      }

      // Extract swap information from token transfers
      if (transaction.tokenTransfers && transaction.tokenTransfers.length >= 2) {
        const swapEvent = this.extractSwapFromTokenTransfers(transaction);
        if (swapEvent) {
          this.notifySwapEvent(swapEvent);
        }
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  }

  /**
   * Extract swap information from token transfers
   */
  private extractSwapFromTokenTransfers(transaction: HeliusTransaction): SwapEvent | null {
    const transfers = transaction.tokenTransfers || [];
    
    if (transfers.length < 2) return null;

    // Find input and output transfers
    const inputTransfer = transfers.find(t => t.tokenAmount > 0);
    const outputTransfer = transfers.find(t => t.tokenAmount < 0);

    if (!inputTransfer || !outputTransfer) return null;

    // Calculate price (output amount / input amount)
    const amountIn = Math.abs(inputTransfer.tokenAmount);
    const amountOut = Math.abs(outputTransfer.tokenAmount);
    const price = amountOut / amountIn;

    return {
      signature: transaction.signature,
      timestamp: transaction.timestamp,
      price,
      volume: amountIn,
      tokenIn: inputTransfer.mint,
      tokenOut: outputTransfer.mint,
      amountIn,
      amountOut,
    };
  }

  /**
   * Attempt to reconnect on connection loss
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyError(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Resubscribe to existing subscriptions after reconnection
   */
  private resubscribe(): void {
    if (this.subscriptions.size > 0) {
      const accounts = Array.from(this.subscriptions);
      this.subscribeToTransactions(accounts).catch(error => {
        console.error('Failed to resubscribe:', error);
      });
    }
  }

  /**
   * Event handler registration methods
   */
  onSwapEvent(handler: SwapEventHandler): void {
    this.swapEventHandlers.push(handler);
  }

  onConnectionStatus(handler: ConnectionStatusHandler): void {
    this.connectionStatusHandlers.push(handler);
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Remove event handlers
   */
  removeSwapEventHandler(handler: SwapEventHandler): void {
    const index = this.swapEventHandlers.indexOf(handler);
    if (index > -1) {
      this.swapEventHandlers.splice(index, 1);
    }
  }

  removeConnectionStatusHandler(handler: ConnectionStatusHandler): void {
    const index = this.connectionStatusHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionStatusHandlers.splice(index, 1);
    }
  }

  removeErrorHandler(handler: ErrorHandler): void {
    const index = this.errorHandlers.indexOf(handler);
    if (index > -1) {
      this.errorHandlers.splice(index, 1);
    }
  }

  /**
   * Notify event handlers
   */
  private notifySwapEvent(event: SwapEvent): void {
    this.swapEventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in swap event handler:', error);
      }
    });
  }

  private notifyConnectionStatus(connected: boolean): void {
    this.connectionStatusHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection status handler:', error);
      }
    });
  }

  private notifyError(error: Error): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (error) {
        console.error('Error in error handler:', error);
      }
    });
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}