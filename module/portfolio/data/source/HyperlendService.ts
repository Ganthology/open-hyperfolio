import type { HyperLendPosition } from '../types';

/**
 * Service for interacting with HyperLend API
 */
export class HyperLendService {
  constructor(private readonly apiUrl: string) {}

  /**
   * Fetch JSON from URL with error handling
   */
  private async fetchJSON(url: string, init?: RequestInit): Promise<any> {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  /**
   * Get HyperLend positions for an address
   */
  async getPositions(address: string): Promise<HyperLendPosition[]> {
    const data = await this.fetchJSON(
      `${this.apiUrl}/data/user/valueChange?chain=hyperEvm&address=${address}`,
    );

    const newPositions = (data?.newPositions ?? {}) as Record<
      string,
      { tokenValue: string; usdValue: string; name: string }
    >;

    return Object.values(newPositions).map((p) => ({
      name: p.name,
      amount: p.tokenValue,
      value: p.usdValue,
    }));
  }
}
