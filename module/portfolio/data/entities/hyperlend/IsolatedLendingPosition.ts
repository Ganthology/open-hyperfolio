/**
 * Entity representing a lending position in HyperLend Isolated module (pair-based lending)
 */
export interface IsolatedLendingPosition {
  /** Pair contract address */
  pairAddress: string;
  /** Asset symbol being supplied */
  assetSymbol: string;
  /** Collateral symbol being used */
  collateralSymbol: string;
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
  /** Liquidation price for this isolated pair */
  liquidationPrice: string;
}
