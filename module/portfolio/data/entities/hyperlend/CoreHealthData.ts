import type { CoreLendingPosition } from './CoreLendingPosition';

/**
 * Entity representing health and position data for HyperLend Core module
 */
export interface CoreHealthData {
  /** Array of lending positions in Core module */
  positions: CoreLendingPosition[];
  /** Health factor (null if no borrows, meaning no liquidation risk) */
  healthFactor: string | null;
  /** Total supplied in USD across all assets */
  totalSuppliedUSD: string;
  /** Total borrowed in USD across all assets */
  totalBorrowedUSD: string;
}
