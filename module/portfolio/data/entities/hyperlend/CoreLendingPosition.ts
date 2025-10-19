/**
 * Entity representing a lending position in HyperLend Core module (Aave v3.2 fork)
 */
export interface CoreLendingPosition {
  /** Asset symbol (e.g., "USDC", "HYPE") */
  asset: string;
  /** Supply balance in token units */
  supplyBalance: string;
  /** Supply balance in USD */
  supplyBalanceUSD: string;
  /** Borrow balance in token units */
  borrowBalance: string;
  /** Borrow balance in USD */
  borrowBalanceUSD: string;
  /** Supply APY (annual percentage yield) as percentage */
  supplyAPY: string;
  /** Borrow APY (annual percentage rate) as percentage */
  borrowAPY: string;
  /** Whether this asset is being used as collateral */
  isCollateral: boolean;
  /** Liquidation price (optional, only when borrowed) */
  liquidationPrice?: string;
}
