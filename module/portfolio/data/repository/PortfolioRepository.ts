import type {
  SpotClearinghouseState,
  PerpClearinghouseState,
  OpenOrder,
  PendleMarketPosition,
  ERC20Balance,
} from '../types';
import type { HyperLendData } from '../entities/hyperlend/HyperLendData';

/**
 * Repository interface for portfolio data retrieval
 * Defines the contract for external consumers
 */
export interface PortfolioRepository {
  /**
   * Get spot clearinghouse state for an address
   */
  getSpotClearinghouseState(address: string): Promise<SpotClearinghouseState>;

  /**
   * Get perp clearinghouse state for an address
   */
  getPerpClearinghouseState(address: string): Promise<PerpClearinghouseState>;

  /**
   * Get open orders for an address
   */
  getOpenOrders(address: string): Promise<OpenOrder>;

  /**
   * Get HyperEVM native balance (HYPE token)
   */
  getHyperEvmBalance(address: string): Promise<string>;

  /**
   * Get HyperLend data (Core and Isolated modules) for an address
   * Includes positions, health factors, and totals
   */
  getHyperLendData(address: string): Promise<HyperLendData>;

  /**
   * Get Pendle positions for an address
   */
  getPendlePositions(address: string): Promise<PendleMarketPosition[]>;

  /**
   * Get beHYPE balance for an address
   */
  getBeHYPEBalance(address: string): Promise<ERC20Balance>;

  /**
   * Get feUSD balance for an address
   */
  getFeUSDBalance(address: string): Promise<ERC20Balance>;

  /**
   * Get USDT0 balance for an address
   */
  getUSDT0Balance(address: string): Promise<ERC20Balance>;

  /**
   * Get USDT0 Frontier balance for an address
   */
  getUSDT0FrontierBalance(address: string): Promise<ERC20Balance>;

  /**
   * Get beHYPE/USDT0 LP token balance for an address
   */
  getBeHYPEUSDT0Balance(address: string): Promise<ERC20Balance>;
}
