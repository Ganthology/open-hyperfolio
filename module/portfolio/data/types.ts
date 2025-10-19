// Type definitions for portfolio data
// TODO: User will provide actual type definitions

export type SpotClearinghouseState = unknown;

export type PerpClearinghouseState = unknown;

export type OpenOrder = unknown;

export type PendleMarketPosition = {
  marketId: string;
  pt: { balance: string; valuation: number };
  yt: { balance: string; valuation: number };
  lp: { balance: string; valuation: number };
};

export type ERC20Balance = string;
