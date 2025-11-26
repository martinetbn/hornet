// Base adapter interfaces

export interface ProtocolAdapter<TConfig, TResponse> {
  /**
   * Execute a request with the given configuration
   */
  execute(config: TConfig): Promise<TResponse>;

  /**
   * Cancel an in-flight request (if supported)
   */
  cancel?(): void;

  /**
   * Clean up resources
   */
  dispose?(): void;
}

export interface ConnectionAdapter<TConfig, TMessage> {
  /**
   * Establish a connection
   */
  connect(config: TConfig): Promise<void>;

  /**
   * Send a message over the connection
   */
  send(message: TMessage): Promise<void>;

  /**
   * Disconnect and clean up
   */
  disconnect(): Promise<void>;

  /**
   * Subscribe to connection events
   */
  on(event: string, callback: (data: unknown) => void): void;

  /**
   * Unsubscribe from connection events
   */
  off(event: string, callback: (data: unknown) => void): void;

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";
