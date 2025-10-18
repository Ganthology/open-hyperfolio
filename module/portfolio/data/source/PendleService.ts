import type { PendleMarketPosition } from '../types';

const DEFAULT_API_URL = 'https://api-v2.pendle.finance/core';

/**
 * Service for interacting with Pendle API
 */
export class PendleService {
  private readonly apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl ?? DEFAULT_API_URL;
  }

  /**
   * Fetch JSON from URL with error handling
   */
  private async fetchJSON(url: string, init?: RequestInit): Promise<any> {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  /**
   * Get Pendle positions for an address (filtered for chain 999)
   */
  async getPositions(address: string): Promise<PendleMarketPosition[]> {
    const state = await this.fetchJSON(
      `${this.apiUrl}/v1/dashboard/positions/database/${address}?filterUsd=0`,
    );

    const positions = (state?.positions ?? []) as Array<{
      chainId: number;
      openPositions: PendleMarketPosition[];
    }>;

    return positions.filter((p) => p.chainId === 999).flatMap((p) => p.openPositions);
  }
}
