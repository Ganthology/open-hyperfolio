import { useMemo, useState, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useQueryState, parseAsString, parseAsArrayOf } from 'nuqs';
import { PortfolioRepositoryImpl } from '@/module/portfolio/data/repository/PortfolioRepositoryImpl';
import type { PortfolioRepository } from '@/module/portfolio/data/repository/PortfolioRepository';
import type { PendleMarketPosition } from '@/module/portfolio/data/types';
import type { HyperLendData } from '@/module/portfolio/data/entities/hyperlend/HyperLendData';
import { isValidAddress } from '@/module/portfolio/utils/helpers';

/**
 * ViewModel for PortfolioScreen
 * Owns ALL state (URL query, local state), data fetching, and business logic
 * Screen doesn't know about repositories - this is the glue between view and data layers
 */
export function usePortfolioScreen() {
  // URL query state (persisted in URL)
  const [addresses, setAddresses] = useQueryState(
    'address',
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  // Local UI state
  const [newAddress, setNewAddress] = useState('');

  // Valid addresses derived from URL state
  const validAddresses = useMemo(
    () => addresses.filter((addr) => isValidAddress(addr)),
    [addresses],
  );

  // Initialize repository (internal - not exposed to screen)
  const repositoryRef = useRef<PortfolioRepository | null>(new PortfolioRepositoryImpl());

  // Data queries - all using repository methods

  // Spot clearinghouse state
  const spotQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['spotClearinghouseState', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getSpotClearinghouseState(address),
    })),
  });
  const spotClearinghouseState = spotQueries.map((q) => q.data).filter(Boolean);
  const isSpotLoading = spotQueries.some((q) => q.isLoading);

  // Perp clearinghouse state
  const perpQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['perpClearinghouseState', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getPerpClearinghouseState(address),
    })),
  });
  const perpClearinghouseState = perpQueries.map((q) => q.data).filter(Boolean);
  const isPerpLoading = perpQueries.some((q) => q.isLoading);

  // Open orders
  const openOrdersQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['openOrders', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getOpenOrders(address),
    })),
  });
  const openOrders = openOrdersQueries.map((q) => q.data).filter(Boolean);
  const isOpenOrdersLoading = openOrdersQueries.some((q) => q.isLoading);

  // HyperEVM balance
  const hyperEvmQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['hyperEvmBalance', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getHyperEvmBalance(address),
    })),
  });
  const hyperEvmBalances = hyperEvmQueries.map((q) => q.data).filter(Boolean);
  const hyperEvmBalance = hyperEvmBalances
    .reduce((sum, bal) => sum + parseFloat(bal || '0'), 0)
    .toFixed(4);
  const isEvmLoading = hyperEvmQueries.some((q) => q.isLoading);

  // HyperLend data (Core + Isolated)
  const hyperLendQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['hyperLend', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getHyperLendData(address),
    })),
  });
  const hyperLendDataArray = hyperLendQueries.map((q) => q.data).filter(Boolean) as HyperLendData[];
  const isHyperLendLoading = hyperLendQueries.some((q) => q.isLoading);

  // Aggregate HyperLend data across all addresses
  const hyperLendAggregated = useMemo(() => {
    if (hyperLendDataArray.length === 0) {
      return {
        totalSuppliedUSD: 0,
        totalBorrowedUSD: 0,
        coreHealthFactor: null as string | null,
        isolatedHealthFactor: null as string | null,
        allCorePositions: [],
        allIsolatedPositions: [],
      };
    }

    let totalSuppliedUSD = 0;
    let totalBorrowedUSD = 0;
    const allCorePositions = [];
    const allIsolatedPositions = [];
    let minCoreHealthFactor: number | null = null;
    let minIsolatedHealthFactor: number | null = null;

    for (const data of hyperLendDataArray) {
      // Aggregate Core data
      totalSuppliedUSD += Number.parseFloat(data.core.totalSuppliedUSD);
      totalBorrowedUSD += Number.parseFloat(data.core.totalBorrowedUSD);
      allCorePositions.push(...data.core.positions);

      // Track minimum health factor (worst case)
      if (data.core.healthFactor !== null) {
        const hf = Number.parseFloat(data.core.healthFactor);
        if (minCoreHealthFactor === null || hf < minCoreHealthFactor) {
          minCoreHealthFactor = hf;
        }
      }

      // Aggregate Isolated data
      totalSuppliedUSD += Number.parseFloat(data.isolated.totalSuppliedUSD);
      totalBorrowedUSD += Number.parseFloat(data.isolated.totalBorrowedUSD);
      allIsolatedPositions.push(...data.isolated.positions);

      if (data.isolated.healthFactor !== null) {
        const hf = Number.parseFloat(data.isolated.healthFactor);
        if (minIsolatedHealthFactor === null || hf < minIsolatedHealthFactor) {
          minIsolatedHealthFactor = hf;
        }
      }
    }

    return {
      totalSuppliedUSD,
      totalBorrowedUSD,
      coreHealthFactor: minCoreHealthFactor !== null ? minCoreHealthFactor.toFixed(2) : null,
      isolatedHealthFactor:
        minIsolatedHealthFactor !== null ? minIsolatedHealthFactor.toFixed(2) : null,
      allCorePositions,
      allIsolatedPositions,
    };
  }, [hyperLendDataArray]);

  // Pendle positions
  const pendleQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['pendle', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getPendlePositions(address),
    })),
  });
  const pendlePositions = pendleQueries.flatMap((q) => q.data || []);
  const isPendleLoading = pendleQueries.some((q) => q.isLoading);

  // beHYPE balance
  const beHYPEQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['beHYPE', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getBeHYPEBalance(address),
    })),
  });
  const beHYPEBalances = beHYPEQueries.map((q) => q.data).filter(Boolean);
  const beHYPEBalance = beHYPEBalances
    .reduce((sum, bal) => sum + parseFloat(bal || '0'), 0)
    .toFixed(4);
  const isBeHypeLoading = beHYPEQueries.some((q) => q.isLoading);

  // feUSD balance
  const feUSDQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['feUSD', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getFeUSDBalance(address),
    })),
  });
  const feUSDBalances = feUSDQueries.map((q) => q.data).filter(Boolean);
  const feUSDBalance = feUSDBalances
    .reduce((sum, bal) => sum + parseFloat(bal || '0'), 0)
    .toFixed(4);
  const isFeUsdLoading = feUSDQueries.some((q) => q.isLoading);

  // USDT0 balance
  const usdt0Queries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['USDT0', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getUSDT0Balance(address),
    })),
  });
  const usdt0Balances = usdt0Queries.map((q) => q.data).filter(Boolean);
  const usdt0Balance = usdt0Balances
    .reduce((sum, bal) => sum + parseFloat(bal || '0'), 0)
    .toFixed(4);
  const isUsdt0Loading = usdt0Queries.some((q) => q.isLoading);

  // USDT0 Frontier balance
  const usdt0FrontierQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['USDT0Frontier', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getUSDT0FrontierBalance(address),
    })),
  });
  const usdt0FrontierBalances = usdt0FrontierQueries.map((q) => q.data).filter(Boolean);
  const usdt0FrontierBalance = usdt0FrontierBalances
    .reduce((sum, bal) => sum + parseFloat(bal || '0'), 0)
    .toFixed(4);
  const isUsdt0FrontierLoading = usdt0FrontierQueries.some((q) => q.isLoading);

  // beHYPE/USDT0 balance
  const beHYPEUSDT0Queries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['beHYPE_USDT0', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getBeHYPEUSDT0Balance(address),
    })),
  });
  const beHYPEUSDT0Balances = beHYPEUSDT0Queries.map((q) => q.data).filter(Boolean);
  const beHYPEUSDT0Balance = beHYPEUSDT0Balances
    .reduce((sum, bal) => sum + parseFloat(bal || '0'), 0)
    .toFixed(4);
  const isBeHypeUsdt0Loading = beHYPEUSDT0Queries.some((q) => q.isLoading);

  // Portfolio aggregation logic
  const portfolio = useMemo(() => {
    const toNum = (v: unknown) => {
      const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : 0;
      return Number.isFinite(n) ? n : 0;
    };

    const stableBalances = [
      { symbol: 'feUSD', balance: toNum(feUSDBalance) },
      { symbol: 'USDT0', balance: toNum(usdt0Balance) },
      { symbol: 'USDT0 Frontier', balance: toNum(usdt0FrontierBalance) },
    ];

    const tokensUSD = stableBalances.reduce((sum, t) => sum + t.balance, 0);

    const hyperLendUSD = hyperLendAggregated.totalSuppliedUSD;

    const pendleUSD = (pendlePositions ?? []).reduce(
      (sum, p) =>
        sum +
        toNum((p as any).pt?.valuation) +
        toNum((p as any).yt?.valuation) +
        toNum((p as any).lp?.valuation),
      0,
    );

    const defiUSD = hyperLendUSD + pendleUSD;

    const hypercoreUSD = 0;

    const totalUSD = tokensUSD + defiUSD + hypercoreUSD;

    const pct = (part: number) => (totalUSD > 0 ? (part / totalUSD) * 100 : 0);

    const tokenItems = stableBalances
      .filter((t) => t.balance > 0)
      .map((t) => ({
        symbol: t.symbol,
        balance: t.balance.toString(),
        value: t.balance,
        percentage: pct(t.balance),
      }));

    return {
      totalUSD,
      tokensUSD,
      defiUSD,
      hypercoreUSD,
      pctTokens: pct(tokensUSD),
      pctDefi: pct(defiUSD),
      pctHypercore: pct(hypercoreUSD),
      tokenItems,
    };
  }, [feUSDBalance, usdt0Balance, usdt0FrontierBalance, hyperLendAggregated, pendlePositions]);

  // Address management functions (simple functions, not callbacks)
  // Screen will compose these into callbacks with additional logic
  const setAddressInput = (value: string) => {
    setNewAddress(value);
  };

  const resetAddressInput = () => {
    setNewAddress('');
  };

  const addAddress = () => {
    const candidate = newAddress.trim();
    if (!candidate) return false;
    if (isValidAddress(candidate) && !addresses.includes(candidate)) {
      setAddresses([...addresses, candidate]);
      return true;
    }
    return false;
  };

  const removeAddress = (address: string) => {
    setAddresses(addresses.filter((addr) => addr !== address));
  };

  // Export ONLY what the screen needs to render
  return {
    // Address state
    addresses,
    newAddress,
    validAddresses,

    // Simple functions (not callbacks) - screen composes these
    setAddressInput,
    resetAddressInput,
    addAddress,
    removeAddress,

    // Data for rendering
    spotClearinghouseState,
    perpClearinghouseState,
    openOrders,
    hyperEvmBalance,
    hyperLendData: hyperLendAggregated,
    pendlePositions,

    // Token balances
    beHYPEBalance,
    feUSDBalance,
    usdt0Balance,
    usdt0FrontierBalance,
    beHYPEUSDT0Balance,

    // Loading states
    isSpotLoading,
    isPerpLoading,
    isOpenOrdersLoading,
    isEvmLoading,
    isHyperLendLoading,
    isPendleLoading,
    isBeHypeLoading,
    isFeUsdLoading,
    isUsdt0Loading,
    isUsdt0FrontierLoading,
    isBeHypeUsdt0Loading,

    // Aggregated portfolio data
    portfolio,
  };
}
