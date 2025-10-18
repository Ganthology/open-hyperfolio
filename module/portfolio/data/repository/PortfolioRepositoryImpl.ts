import type { PortfolioRepository } from './PortfolioRepository';
import { HyperliquidService } from '../source/HyperliquidService';
import { HyperLendService } from '../source/HyperlendService';
import { PendleService } from '../source/PendleService';
import { HyperbeatService } from '../source/HyperbeatService';
import { SmartContractService } from '../source/SmartContractService';
import { hyperEvmClient } from '@/module/viem/client';
import type {
  SpotClearinghouseState,
  PerpClearinghouseState,
  OpenOrder,
  HyperLendPosition,
  PendleMarketPosition,
  ERC20Balance,
} from '../types';

// Smart contract addresses
const CONTRACT_ADDRESSES = {
  beHYPE: '0xd8FC8F0b03eBA61F64D08B0bef69d80916E5DdA9',
  feUSD: '0x02c6a2fa58cc01a18b8d9e00ea48d65e4df26c70',
  USDT0: '0xfc5126377f0efc0041c0969ef9ba903ce67d151e',
  USDT0Frontier: '0x9896a8605763106e57A51aa0a97Fe8099E806bb3',
  beHYPE_USDT0: '0x68e37dE8d93d3496ae143F2E900490f6280C57cD',
} as const;

/**
 * Implementation of PortfolioRepository
 * Orchestrates multiple services to provide portfolio data
 * Services are initialized with defaults if not provided
 */
export class PortfolioRepositoryImpl implements PortfolioRepository {
  private readonly hyperliquidService: HyperliquidService;
  private readonly hyperLendService: HyperLendService;
  private readonly pendleService: PendleService;
  private readonly hyperbeatService: HyperbeatService;
  private readonly smartContractService: SmartContractService;

  constructor(
    hyperliquidService?: HyperliquidService,
    hyperLendService?: HyperLendService,
    pendleService?: PendleService,
    hyperbeatService?: HyperbeatService,
    smartContractService?: SmartContractService,
  ) {
    // Initialize services with defaults if not provided
    this.hyperliquidService = hyperliquidService ?? new HyperliquidService(hyperEvmClient);
    this.hyperLendService = hyperLendService ?? new HyperLendService();
    this.pendleService = pendleService ?? new PendleService();
    this.hyperbeatService =
      hyperbeatService ?? new HyperbeatService(hyperEvmClient, CONTRACT_ADDRESSES.beHYPE);
    this.smartContractService = smartContractService ?? new SmartContractService(hyperEvmClient);
  }

  async getSpotClearinghouseState(address: string): Promise<SpotClearinghouseState> {
    return this.hyperliquidService.getSpotClearinghouseState(address);
  }

  async getPerpClearinghouseState(address: string): Promise<PerpClearinghouseState> {
    return this.hyperliquidService.getPerpClearinghouseState(address);
  }

  async getOpenOrders(address: string): Promise<OpenOrder> {
    return this.hyperliquidService.getOpenOrders(address);
  }

  async getHyperEvmBalance(address: string): Promise<string> {
    return this.hyperliquidService.getHyperEvmBalance(address);
  }

  async getHyperLendPositions(address: string): Promise<HyperLendPosition[]> {
    return this.hyperLendService.getPositions(address);
  }

  async getPendlePositions(address: string): Promise<PendleMarketPosition[]> {
    return this.pendleService.getPositions(address);
  }

  async getBeHYPEBalance(address: string): Promise<ERC20Balance> {
    return this.hyperbeatService.getBeHYPEBalance(address);
  }

  async getFeUSDBalance(address: string): Promise<ERC20Balance> {
    return this.smartContractService.getERC20Balance(CONTRACT_ADDRESSES.feUSD, address);
  }

  async getUSDT0Balance(address: string): Promise<ERC20Balance> {
    return this.smartContractService.getERC20Balance(CONTRACT_ADDRESSES.USDT0, address);
  }

  async getUSDT0FrontierBalance(address: string): Promise<ERC20Balance> {
    return this.smartContractService.getERC20Balance(CONTRACT_ADDRESSES.USDT0Frontier, address);
  }

  async getBeHYPEUSDT0Balance(address: string): Promise<ERC20Balance> {
    return this.smartContractService.getERC20Balance(CONTRACT_ADDRESSES.beHYPE_USDT0, address);
  }
}
