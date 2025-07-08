/// <reference types="vite/client" />

declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect(): Promise<any>;
        disconnect(): Promise<void>;
        on(event: string, callback: Function): void;
        removeListener(event: string, callback: Function): void;
      };
    };
  }
}
