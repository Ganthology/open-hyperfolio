import type { IsolatedLendingPosition } from './IsolatedLendingPosition';

/**
 * Entity representing health and position data for HyperLend Isolated module
 */
export interface IsolatedHealthData {
  /** Array of lending positions in Isolated module */
  positions: IsolatedLendingPosition[];
  /** Health factor (null if no borrows, meaning no liquidation risk) */
  healthFactor: string | null;
  /** Total supplied in USD across all pairs */
  totalSuppliedUSD: string;
  /** Total borrowed in USD across all pairs */
  totalBorrowedUSD: string;
}
