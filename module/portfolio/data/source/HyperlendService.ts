import { HyperlendSDKcore } from 'hyperlend-sdk';
import { utils, providers } from 'ethers';
import type { CoreHealthData } from '../entities/hyperlend/CoreHealthData';
import type { IsolatedHealthData } from '../entities/hyperlend/IsolatedHealthData';
import type { HyperLendData } from '../entities/hyperlend/HyperLendData';
import type { CoreLendingPosition } from '../entities/hyperlend/CoreLendingPosition';

/**
 * HyperLiquid EVM RPC URL
 */
const HYPERLIQUID_RPC_URL = 'https://rpc.hyperliquid.xyz/evm';

/**
 * HyperLend Core Contract Addresses on Hyperliquid EVM
 * Source: https://docs.hyperlend.finance/developer-documentation/contract-addresses
 */
const HYPERLEND_CORE_ADDRESSES = {
  /**
   * Protocol Data Provider - provides reserve and user data
   */
  DATA_PROVIDER: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',

  /**
   * Pool contract - main entry point for lending/borrowing
   */
  POOL: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',

  /**
   * UI Pool Data Provider - aggregated data for UI display
   */
  UI_POOL_DATA_PROVIDER: '0x3Bb92CF81E38484183cc96a4Fb8fBd2d73535807',

  /**
   * Pool Address Provider - returns addresses of core contracts
   */
  POOL_ADDRESS_PROVIDER: '0x72c98246a98bFe64022a3190e7710E157497170C',
} as const;

/**
 * Singleton ethers provider instance
 */
let providerInstance: providers.JsonRpcProvider | null = null;

/**
 * Get or create the ethers provider instance
 */
function getHyperLendProvider(): providers.JsonRpcProvider {
  if (!providerInstance) {
    providerInstance = new providers.JsonRpcProvider({
      url: HYPERLIQUID_RPC_URL,
      skipFetchSetup: false,
    });
  }
  return providerInstance;
}

/**
 * Service for interacting with HyperLend protocol via SDK
 * Handles both Core (Aave v3.2 fork) and Isolated (pair-based) lending modules
 */
export class HyperLendService {
  private readonly coreSDK: HyperlendSDKcore;

  constructor() {
    const provider = getHyperLendProvider();

    // Initialize Core SDK
    this.coreSDK = new HyperlendSDKcore(
      provider,
      HYPERLEND_CORE_ADDRESSES.DATA_PROVIDER,
      HYPERLEND_CORE_ADDRESSES.POOL,
      HYPERLEND_CORE_ADDRESSES.UI_POOL_DATA_PROVIDER,
    );
  }

  /**
   * Get Core module lending data for an address
   * Fetches positions, health factor, and totals from Core lending pool
   */
  async getCoreData(address: string): Promise<CoreHealthData> {
    try {
      // Fetch user account data and reserves data in parallel
      const [accountData, userReservesData, allReserves] = await Promise.all([
        this.coreSDK.getUserAccountData(address),
        this.coreSDK.getUserReservesData(HYPERLEND_CORE_ADDRESSES.POOL_ADDRESS_PROVIDER, address),
        this.coreSDK.getAllReservesTokens(),
      ]);

      // Get detailed reserves data to extract APY
      const detailedReservesData = await this.coreSDK.getDetailedReservesData(
        HYPERLEND_CORE_ADDRESSES.POOL_ADDRESS_PROVIDER,
      );

      // Transform user reserves to our domain model
      const positions: CoreLendingPosition[] = [];

      for (const userReserve of userReservesData.userReserves) {
        // Skip if user has no position in this reserve
        const hasSupply =
          userReserve.scaledATokenBalance && !userReserve.scaledATokenBalance.isZero();
        const hasBorrow =
          userReserve.scaledVariableDebt && !userReserve.scaledVariableDebt.isZero();

        if (!hasSupply && !hasBorrow) {
          continue;
        }

        // Find reserve info
        const reserveInfo = allReserves.find(
          (r) => r.tokenAddress.toLowerCase() === userReserve.underlyingAsset.toLowerCase(),
        );

        const detailedReserve = detailedReservesData.reserves.find(
          (r: any) => r.underlyingAsset.toLowerCase() === userReserve.underlyingAsset.toLowerCase(),
        );

        if (!reserveInfo || !detailedReserve) {
          continue;
        }

        // Calculate actual balances (scaled balance * index)
        const supplyBalance = hasSupply
          ? utils.formatUnits(userReserve.scaledATokenBalance, detailedReserve.decimals)
          : '0';

        const borrowBalance = hasBorrow
          ? utils.formatUnits(userReserve.scaledVariableDebt, detailedReserve.decimals)
          : '0';

        // Calculate USD values using oracle price
        const priceInUSD = Number.parseFloat(
          utils.formatUnits(detailedReserve.priceInMarketReferenceCurrency, 8),
        );
        const supplyBalanceUSD = (Number.parseFloat(supplyBalance) * priceInUSD).toFixed(2);
        const borrowBalanceUSD = (Number.parseFloat(borrowBalance) * priceInUSD).toFixed(2);

        // Extract APY (convert from ray to percentage)
        const RAY = BigInt(10) ** BigInt(27);
        const SECONDS_PER_YEAR = BigInt(31536000);

        const supplyRate = detailedReserve.liquidityRate;
        const borrowRate = detailedReserve.variableBorrowRate;

        // APY calculation: ((1 + rate/RAY) ^ SECONDS_PER_YEAR - 1) * 100
        // Simplified: rate * SECONDS_PER_YEAR / RAY * 100
        const supplyAPY = supplyRate
          ? (((Number(supplyRate) * Number(SECONDS_PER_YEAR)) / Number(RAY)) * 100).toFixed(2)
          : '0';

        const borrowAPY = borrowRate
          ? (((Number(borrowRate) * Number(SECONDS_PER_YEAR)) / Number(RAY)) * 100).toFixed(2)
          : '0';

        positions.push({
          asset: reserveInfo.symbol,
          supplyBalance,
          supplyBalanceUSD,
          borrowBalance,
          borrowBalanceUSD,
          supplyAPY,
          borrowAPY,
          isCollateral: userReserve.usageAsCollateralEnabledOnUser,
          liquidationPrice:
            hasBorrow && accountData.currentLiquidationThreshold.gt(0)
              ? this.calculateLiquidationPrice(
                  Number.parseFloat(supplyBalance),
                  Number.parseFloat(borrowBalance),
                  priceInUSD,
                  accountData.currentLiquidationThreshold.toNumber(),
                )
              : undefined,
        });
      }

      // Calculate totals
      const totalSuppliedUSD = positions
        .reduce((sum, p) => sum + Number.parseFloat(p.supplyBalanceUSD), 0)
        .toFixed(2);

      const totalBorrowedUSD = positions
        .reduce((sum, p) => sum + Number.parseFloat(p.borrowBalanceUSD), 0)
        .toFixed(2);

      // Health factor (null if no debt, meaning no liquidation risk)
      const healthFactor = accountData.totalDebtBase.isZero()
        ? null
        : utils.formatUnits(accountData.healthFactor.toString(), 18);

      return {
        positions,
        healthFactor,
        totalSuppliedUSD,
        totalBorrowedUSD,
      };
    } catch (error) {
      console.error('Error fetching HyperLend Core data:', error);
      // Return empty state on error
      return {
        positions: [],
        healthFactor: null,
        totalSuppliedUSD: '0',
        totalBorrowedUSD: '0',
      };
    }
  }

  /**
   * Get Isolated module lending data for an address
   * TODO: Implement when isolated module SDK is available
   * For now returns empty data
   */
  async getIsolatedData(_address: string): Promise<IsolatedHealthData> {
    // TODO: Implement isolated module integration
    // The isolated module SDK is not yet available in the hyperlend-sdk package
    // Will need to either:
    // 1. Wait for isolated module to be added to the SDK
    // 2. Implement direct contract calls to isolated pairs
    // 3. Use the API endpoint as fallback

    return {
      positions: [],
      healthFactor: null,
      totalSuppliedUSD: '0',
      totalBorrowedUSD: '0',
    };
  }

  /**
   * Get all HyperLend data (both Core and Isolated modules)
   * Aggregates data from both lending modules
   */
  async getAllData(address: string): Promise<HyperLendData> {
    const [core, isolated] = await Promise.all([
      this.getCoreData(address),
      this.getIsolatedData(address),
    ]);

    return {
      core,
      isolated,
    };
  }

  /**
   * Calculate liquidation price for a position
   * Simplified calculation: borrowValue / (supplyAmount * liquidationThreshold)
   */
  private calculateLiquidationPrice(
    supplyAmount: number,
    borrowAmount: number,
    currentPrice: number,
    liquidationThreshold: number,
  ): string {
    if (supplyAmount === 0 || liquidationThreshold === 0) {
      return 'N/A';
    }

    // liquidationThreshold is in basis points (10000 = 100%)
    const thresholdMultiplier = liquidationThreshold / 10000;

    // Liquidation happens when: borrowValue = supplyValue * threshold
    // At liquidation: borrowAmount * liquidationPrice = supplyAmount * liquidationPrice * threshold
    // Simplified for single asset: liquidationPrice = (borrowAmount / supplyAmount) / threshold
    const borrowValue = borrowAmount * currentPrice;
    const liquidationPrice = borrowValue / (supplyAmount * thresholdMultiplier);

    return liquidationPrice.toFixed(2);
  }
}
