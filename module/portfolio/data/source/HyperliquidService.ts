import { Address, formatEther } from 'viem';
import type { PublicClient } from 'viem';
import type { SpotClearinghouseState, PerpClearinghouseState, OpenOrder } from '../types';

const DEFAULT_API_URL = 'https://api.hyperliquid.xyz/info';

/**
 * Service for interacting with Hyperliquid API and HyperEVM
 */
export class HyperliquidService {
  private readonly apiUrl: string;

  constructor(client: PublicClient, apiUrl?: string) {
    this.apiUrl = apiUrl ?? DEFAULT_API_URL;
    this.client = client;
  }

  private readonly client: PublicClient;

  /**
   * Fetch JSON from URL with error handling
   */
  private async fetchJSON(url: string, init?: RequestInit): Promise<any> {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  /**
   * Get spot clearinghouse state for an address
   */
  async getSpotClearinghouseState(address: string): Promise<SpotClearinghouseState> {
    return this.fetchJSON(this.apiUrl, {
      method: 'POST',
      body: JSON.stringify({ type: 'spotClearinghouseState', user: address }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Get perp clearinghouse state for an address
   */
  async getPerpClearinghouseState(address: string): Promise<PerpClearinghouseState> {
    return this.fetchJSON(this.apiUrl, {
      method: 'POST',
      body: JSON.stringify({ type: 'clearinghouseState', user: address }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Get open orders for an address
   */
  async getOpenOrders(address: string): Promise<OpenOrder> {
    return this.fetchJSON(this.apiUrl, {
      method: 'POST',
      body: JSON.stringify({ type: 'frontendOpenOrders', user: address }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Get HyperEVM native balance (HYPE token)
   */
  async getHyperEvmBalance(address: string): Promise<string> {
    const balance = await this.client.getBalance({ address: address as Address });
    return formatEther(balance);
  }
}
