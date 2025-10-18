'use client';

import { useMemo, useCallback, useState, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Wallet } from 'lucide-react';
import { useQueryState, parseAsString, parseAsArrayOf } from 'nuqs';
import type { PortfolioRepository } from '@/module/portfolio/data/repository/PortfolioRepository';
import { PortfolioRepositoryImpl } from '@/module/portfolio/data/repository/PortfolioRepositoryImpl';

function isValidAddress(address: string) {
  return typeof address === 'string' && address.startsWith('0x') && address.length >= 6;
}

function ensureArrayFromUnknown(input: unknown) {
  if (Array.isArray(input)) return input;
  if (input && typeof input === 'object') {
    return Object.entries(input as Record<string, unknown>).map(([key, value]) => ({ key, value }));
  }
  return [] as unknown[];
}

export default function BalanceTracker() {
  const [addresses, setAddresses] = useQueryState(
    'address',
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [newAddress, setNewAddress] = useState('');

  const validAddresses = useMemo(
    () => addresses.filter((addr) => isValidAddress(addr)),
    [addresses],
  );

  // Initialize repository (singleton pattern using useRef)
  const repositoryRef = useRef<PortfolioRepository | null>(null);
  if (!repositoryRef.current) {
    repositoryRef.current = new PortfolioRepositoryImpl();
  }

  // query hyperliquid api for spot clearinghouse state
  const spotQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['spotClearinghouseState', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getSpotClearinghouseState(address),
    })),
  });
  const spotClearinghouseState = spotQueries.map((q) => q.data).filter(Boolean);
  const isSpotLoading = spotQueries.some((q) => q.isLoading);

  // query hyperliquid api for perp clearinghouse state
  const perpQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['perpClearinghouseState', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getPerpClearinghouseState(address),
    })),
  });
  const perpClearinghouseState = perpQueries.map((q) => q.data).filter(Boolean);
  const isPerpLoading = perpQueries.some((q) => q.isLoading);

  // query hyperliquid api for open orders
  const openOrdersQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['openOrders', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getOpenOrders(address),
    })),
  });
  const openOrders = openOrdersQueries.map((q) => q.data).filter(Boolean);
  const isOpenOrdersLoading = openOrdersQueries.some((q) => q.isLoading);

  // query to get hyperEvm balance
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

  // query hyperlend api for hyperlend positions
  const hyperLendQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['hyperLend', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getHyperLendPositions(address),
    })),
  });
  const hyperLendPositions = hyperLendQueries.flatMap((q) => q.data || []);
  const isHyperLendLoading = hyperLendQueries.some((q) => q.isLoading);

  // query pendle api for pendle positions
  const pendleQueries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: ['pendle', address],
      enabled: isValidAddress(address),
      queryFn: () => repositoryRef.current!.getPendlePositions(address),
    })),
  });
  const pendlePositions = pendleQueries.flatMap((q) => q.data || []);
  const isPendleLoading = pendleQueries.some((q) => q.isLoading);

  // query beHYPE smart contract for beHYPE balance
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

  // query feUSD smart contract for feUSD balance
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

  // query USDT0 smart contract for USDT0 balance
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

  // query beHYPE/USDT0 smart contract for beHYPE/USDT0 balance
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

  // Portfolio aggregation
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

    const hyperLendUSD = (hyperLendPositions ?? []).reduce((sum, p) => sum + toNum(p.value), 0);

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
  }, [feUSDBalance, usdt0Balance, usdt0FrontierBalance, hyperLendPositions, pendlePositions]);

  const addAddress = useCallback(() => {
    const candidate = newAddress.trim();
    if (!candidate) return;
    if (isValidAddress(candidate) && !addresses.includes(candidate)) {
      setAddresses([...addresses, candidate]);
      setNewAddress('');
    }
  }, [newAddress, addresses, setAddresses]);

  const removeAddress = useCallback(
    (address: string) => {
      setAddresses(addresses.filter((addr) => addr !== address));
    },
    [addresses, setAddresses],
  );

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-6 w-6" />
            <h1 className="text-xl font-bold tracking-tight">OPEN HYPERFOLIO</h1>
          </div>

          {/* Address Input */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="ENTER_WALLET_ADDRESS"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="flex-1 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && addAddress()}
            />
            <Button onClick={addAddress} size="icon" className="font-mono">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Address Tags */}
          <div className="flex flex-wrap gap-2">
            {addresses.map((address) => (
              <Badge
                key={address}
                variant="secondary"
                className="flex items-center gap-1 font-mono"
              >
                {address.slice(0, 6)}...{address.slice(-4)}
                <button
                  onClick={() => removeAddress(address)}
                  className="ml-1 hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {validAddresses.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground font-mono">
              AGGREGATING {validAddresses.length} WALLET{validAddresses.length !== 1 ? 'S' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {validAddresses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-mono">
            ENTER_WALLET_ADDRESS_TO_VIEW_BALANCE
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Portfolio Overview */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-muted-foreground font-mono">
                    TOTAL PORTFOLIO VALUE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">
                    ${portfolio.totalUSD.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 font-mono">
                    {isEvmLoading ? 'Loading HYPE...' : `${hyperEvmBalance ?? '0'} HYPE`}
                  </div>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="font-mono">
                        TOKENS: ${portfolio.tokensUSD.toFixed(2)}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 font-mono">
                        NFTS: $0.00
                      </Badge>
                      <Badge variant="outline" className="bg-green-100 text-green-800 font-mono">
                        DEFI: ${portfolio.defiUSD.toFixed(2)}
                      </Badge>
                      <Badge variant="outline" className="bg-red-100 text-red-800 font-mono">
                        HYPERCORE: ${portfolio.hypercoreUSD.toFixed(2)}
                      </Badge>
                    </div>
                  </div>

                  <div className="w-full bg-muted h-3 border flex">
                    <div className="bg-blue-400 h-3" style={{ width: `${portfolio.pctTokens}%` }} />
                    <div className="bg-green-500 h-3" style={{ width: `${portfolio.pctDefi}%` }} />
                    <div
                      className="bg-rose-400 h-3"
                      style={{ width: `${portfolio.pctHypercore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                    <span>{portfolio.pctTokens.toFixed(1)}%</span>
                    <span>{portfolio.pctDefi.toFixed(1)}%</span>
                    <span>{portfolio.pctHypercore.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Composition */}
            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono">WALLET_COMPOSITION</CardTitle>
                <div className="text-lg font-bold font-mono">${portfolio.totalUSD.toFixed(2)}</div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tokens" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 font-mono">
                    <TabsTrigger value="tokens" className="font-mono">
                      TOKENS ({portfolio.tokenItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="nfts" className="font-mono">
                      NFTS (0)
                    </TabsTrigger>
                    <TabsTrigger value="points" className="font-mono">
                      POINTS (0)
                    </TabsTrigger>
                    <TabsTrigger value="hypercore" className="font-mono">
                      HYPERCORE (0)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tokens" className="mt-6">
                    {portfolio.tokenItems.length > 0 ? (
                      <div className="space-y-4">
                        {portfolio.tokenItems.map((token, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-muted border flex items-center justify-center">
                                <span className="text-xs font-bold font-mono">
                                  {token.symbol[0]}
                                </span>
                              </div>
                              <div>
                                <div className="font-bold font-mono">{token.symbol}</div>
                                <div className="text-sm text-muted-foreground font-mono">
                                  {token.balance}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold font-mono">${token.value.toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {token.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground font-mono">
                        NO_TOKENS_FOUND
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="nfts" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground font-mono">
                      NO_NFTS_FOUND
                    </div>
                  </TabsContent>

                  <TabsContent value="points" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground font-mono">
                      NO_POINTS_FOUND
                    </div>
                  </TabsContent>

                  <TabsContent value="hypercore" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground font-mono">
                      NO_HYPERCORE_FOUND
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-muted-foreground font-mono">
                  HYPEREVM_BALANCE (HYPE)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {isEvmLoading ? 'Loading...' : hyperEvmBalance ?? '0'}
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-muted-foreground font-mono">
                  ERC20 BALANCES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border">
                    <div className="font-mono">beHYPE</div>
                    <div className="font-mono">
                      {isBeHypeLoading ? '...' : beHYPEBalance ?? '0'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 border">
                    <div className="font-mono">feUSD</div>
                    <div className="font-mono">{isFeUsdLoading ? '...' : feUSDBalance ?? '0'}</div>
                  </div>
                  <div className="flex items-center justify-between p-2 border">
                    <div className="font-mono">USDT0</div>
                    <div className="font-mono">{isUsdt0Loading ? '...' : usdt0Balance ?? '0'}</div>
                  </div>
                  <div className="flex items-center justify-between p-2 border">
                    <div className="font-mono">USDT0 Frontier</div>
                    <div className="font-mono">
                      {isUsdt0FrontierLoading ? '...' : usdt0FrontierBalance ?? '0'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 border">
                    <div className="font-mono">beHYPE/USDT0</div>
                    <div className="font-mono">
                      {isBeHypeUsdt0Loading ? '...' : beHYPEUSDT0Balance ?? '0'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono">SPOT_CLEARINGHOUSE_STATE</CardTitle>
              </CardHeader>
              <CardContent>
                {isSpotLoading ? (
                  <div className="text-muted-foreground font-mono">Loading...</div>
                ) : (
                  <div className="space-y-2">
                    {ensureArrayFromUnknown(spotClearinghouseState).map(
                      (item: any, idx: number) => (
                        <div key={idx} className="p-2 border font-mono text-xs">
                          {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono">PERP_CLEARINGHOUSE_STATE</CardTitle>
              </CardHeader>
              <CardContent>
                {isPerpLoading ? (
                  <div className="text-muted-foreground font-mono">Loading...</div>
                ) : (
                  <div className="space-y-2">
                    {ensureArrayFromUnknown(perpClearinghouseState).map(
                      (item: any, idx: number) => (
                        <div key={idx} className="p-2 border font-mono text-xs">
                          {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono">OPEN_ORDERS</CardTitle>
              </CardHeader>
              <CardContent>
                {isOpenOrdersLoading ? (
                  <div className="text-muted-foreground font-mono">Loading...</div>
                ) : (
                  <div className="space-y-2">
                    {ensureArrayFromUnknown(openOrders).map((item: any, idx: number) => (
                      <div key={idx} className="p-2 border font-mono text-xs">
                        {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono">HYPERLEND_POSITIONS</CardTitle>
              </CardHeader>
              <CardContent>
                {isHyperLendLoading ? (
                  <div className="text-muted-foreground font-mono">Loading...</div>
                ) : hyperLendPositions && hyperLendPositions.length > 0 ? (
                  <div className="space-y-2">
                    {hyperLendPositions.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between p-2 border font-mono text-sm"
                      >
                        <div>{p.name}</div>
                        <div>
                          {p.amount} ${p.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground font-mono">No positions</div>
                )}
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono">PENDLE_POSITIONS (CHAIN 999)</CardTitle>
              </CardHeader>
              <CardContent>
                {isPendleLoading ? (
                  <div className="text-muted-foreground font-mono">Loading...</div>
                ) : pendlePositions && pendlePositions.length > 0 ? (
                  <div className="space-y-2">
                    {pendlePositions.map((pos: any, idx: number) => (
                      <div key={idx} className="p-2 border font-mono text-xs">
                        {JSON.stringify(pos)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground font-mono">No positions</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
