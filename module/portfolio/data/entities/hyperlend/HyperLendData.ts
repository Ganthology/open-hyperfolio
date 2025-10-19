import type { CoreHealthData } from './CoreHealthData';
import type { IsolatedHealthData } from './IsolatedHealthData';

/**
 * Entity representing aggregated HyperLend data across both Core and Isolated modules
 */
export interface HyperLendData {
  /** Core module (Aave v3.2 fork) lending data */
  core: CoreHealthData;
  /** Isolated module (pair-based) lending data */
  isolated: IsolatedHealthData;
}
