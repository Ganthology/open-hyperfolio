'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Address, createPublicClient, formatEther, http } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Wallet } from 'lucide-react';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';
const HYPERLEND_API_URL = 'https://api.hyperlend.finance';
const PENDLE_API_URL = 'https://api-v2.pendle.finance/core';
const HYPERLIQUID_RPC_URL = 'https://rpc.hyperliquid.xyz/evm';
const beHYPE_SMART_CONTRACT_ADDRESS = '0xd8FC8F0b03eBA61F64D08B0bef69d80916E5DdA9';

const PROTOCOL_SMART_CONTRACT_ADDRESS = {
  FELIX_PROTOCOL: {
    feUSD: '0x02c6a2fa58cc01a18b8d9e00ea48d65e4df26c70',
    USDT0: '0xfc5126377f0efc0041c0969ef9ba903ce67d151e',
    USDT0Frontier: '0x9896a8605763106e57A51aa0a97Fe8099E806bb3',
    'beHYPE/USDT0': '0x68e37dE8d93d3496ae143F2E900490f6280C57cD',
  },
  HYPERBEAT: {
    beHYPE: beHYPE_SMART_CONTRACT_ADDRESS,
  },
} as const;

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
  const [addresses, setAddresses] = useState<string[]>(['']);
  const [newAddress, setNewAddress] = useState('');

  const activeAddress = addresses[0] ?? '';
  const enabled = isValidAddress(activeAddress);

  const client = useMemo(
    () =>
      createPublicClient({
        chain: {
          id: 999,
          name: 'HyperLiquid',
          nativeCurrency: { name: 'HyperLiquid', symbol: 'HYPE', decimals: 18 },
          rpcUrls: { default: { http: [HYPERLIQUID_RPC_URL] } },
        },
        transport: http(HYPERLIQUID_RPC_URL),
      }),
    [],
  );

  async function fetchJSON(url: string, init?: RequestInit) {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  function readContractBalance(contractAddress: string, walletAddress: string) {
    return client
      .readContract({
        address: contractAddress as Address,
        abi: [
          {
            type: 'function',
            name: 'balanceOf',
            stateMutability: 'view',
            inputs: [{ name: 'owner', type: 'address' }],
            outputs: [{ type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [walletAddress as Address],
      })
      .then((res) => formatEther(res));
  }

  const { data: spotClearinghouseState, isLoading: isSpotLoading } = useQuery({
    queryKey: ['spotClearinghouseState', activeAddress],
    enabled,
    queryFn: () =>
      fetchJSON(HYPERLIQUID_API_URL, {
        method: 'POST',
        body: JSON.stringify({ type: 'spotClearinghouseState', user: activeAddress }),
        headers: { 'Content-Type': 'application/json' },
      }),
  });

  const { data: perpClearinghouseState, isLoading: isPerpLoading } = useQuery({
    queryKey: ['perpClearinghouseState', activeAddress],
    enabled,
    queryFn: () =>
      fetchJSON(HYPERLIQUID_API_URL, {
        method: 'POST',
        body: JSON.stringify({ type: 'clearinghouseState', user: activeAddress }),
        headers: { 'Content-Type': 'application/json' },
      }),
  });

  const { data: openOrders, isLoading: isOpenOrdersLoading } = useQuery({
    queryKey: ['openOrders', activeAddress],
    enabled,
    queryFn: () =>
      fetchJSON(HYPERLIQUID_API_URL, {
        method: 'POST',
        body: JSON.stringify({ type: 'frontendOpenOrders', user: activeAddress }),
        headers: { 'Content-Type': 'application/json' },
      }),
  });

  const { data: hyperEvmBalance, isLoading: isEvmLoading } = useQuery({
    queryKey: ['hyperEvmBalance', activeAddress],
    enabled,
    queryFn: async () => {
      const balance = await client.getBalance({ address: activeAddress as Address });
      return formatEther(balance);
    },
  });

  const { data: hyperLendPositions, isLoading: isHyperLendLoading } = useQuery({
    queryKey: ['hyperLend', activeAddress],
    enabled,
    queryFn: async () => {
      const data = await fetchJSON(
        `${HYPERLEND_API_URL}/data/user/valueChange?chain=hyperEvm&address=${activeAddress}`,
      );
      const newPositions = (data?.newPositions ?? {}) as Record<
        string,
        { tokenValue: string; usdValue: string; name: string }
      >;
      return Object.values(newPositions).map((p) => ({
        name: p.name,
        amount: p.tokenValue,
        value: p.usdValue,
      }));
    },
  });

  type PendleMarketPosition = {
    marketId: string;
    pt: { balance: string; valuation: number };
    yt: { balance: string; valuation: number };
    lp: { balance: string; valuation: number };
  };

  const { data: pendlePositions, isLoading: isPendleLoading } = useQuery({
    queryKey: ['pendle', activeAddress],
    enabled,
    queryFn: async () => {
      const state = await fetchJSON(
        `${PENDLE_API_URL}/v1/dashboard/positions/database/${activeAddress}?filterUsd=0`,
      );
      const positions = (state?.positions ?? []) as Array<{
        chainId: number;
        openPositions: PendleMarketPosition[];
      }>;
      return positions.filter((p) => p.chainId === 999).flatMap((p) => p.openPositions);
    },
  });

  const { data: beHYPEBalance, isLoading: isBeHypeLoading } = useQuery({
    queryKey: ['beHYPE', activeAddress],
    enabled,
    queryFn: () =>
      readContractBalance(PROTOCOL_SMART_CONTRACT_ADDRESS.HYPERBEAT.beHYPE, activeAddress),
  });

  const { data: feUSDBalance, isLoading: isFeUsdLoading } = useQuery({
    queryKey: ['feUSD', activeAddress],
    enabled,
    queryFn: () =>
      readContractBalance(PROTOCOL_SMART_CONTRACT_ADDRESS.FELIX_PROTOCOL.feUSD, activeAddress),
  });

  const { data: usdt0Balance, isLoading: isUsdt0Loading } = useQuery({
    queryKey: ['USDT0', activeAddress],
    enabled,
    queryFn: () =>
      readContractBalance(PROTOCOL_SMART_CONTRACT_ADDRESS.FELIX_PROTOCOL.USDT0, activeAddress),
  });

  const { data: usdt0FrontierBalance, isLoading: isUsdt0FrontierLoading } = useQuery({
    queryKey: ['USDT0Frontier', activeAddress],
    enabled,
    queryFn: () =>
      readContractBalance(
        PROTOCOL_SMART_CONTRACT_ADDRESS.FELIX_PROTOCOL.USDT0Frontier,
        activeAddress,
      ),
  });

  const { data: beHYPEUSDT0Balance, isLoading: isBeHypeUsdt0Loading } = useQuery({
    queryKey: ['beHYPE_USDT0', activeAddress],
    enabled,
    queryFn: () =>
      readContractBalance(
        PROTOCOL_SMART_CONTRACT_ADDRESS.FELIX_PROTOCOL['beHYPE/USDT0'],
        activeAddress,
      ),
  });

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

  const addAddress = () => {
    if (newAddress && !addresses.includes(newAddress)) {
      setAddresses([...addresses, newAddress]);
      setNewAddress('');
    }
  };

  const removeAddress = (address: string) => {
    setAddresses(addresses.filter((addr) => addr !== address));
  };

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
              onKeyPress={(e) => e.key === 'Enter' && addAddress()}
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!enabled ? (
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
