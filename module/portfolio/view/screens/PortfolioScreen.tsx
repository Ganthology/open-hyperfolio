'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Wallet } from 'lucide-react';
import { usePortfolioScreen } from '../viewModel/usePortfolioScreen';
import { ensureArrayFromUnknown } from '@/module/portfolio/utils/helpers';

/**
 * PortfolioScreen - Pure UI component
 * Gets all data and handlers from usePortfolioScreen hook
 * Zero props, zero business logic, just rendering
 */
export function PortfolioScreen() {
  // Get everything from ViewModel
  const viewModel = usePortfolioScreen();

  const {
    addresses,
    newAddress,
    validAddresses,
    setAddressInput,
    resetAddressInput,
    addAddress,
    removeAddress,
    spotClearinghouseState,
    perpClearinghouseState,
    openOrders,
    hyperEvmBalance,
    hyperLendData,
    pendlePositions,
    beHYPEBalance,
    feUSDBalance,
    usdt0Balance,
    usdt0FrontierBalance,
    beHYPEUSDT0Balance,
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
    portfolio,
  } = viewModel;

  // Compose ViewModel functions into callbacks with additional logic
  const handleAddressChange = (value: string) => {
    setAddressInput(value);
  };

  const handleAddAddress = () => {
    const success = addAddress();
    if (success) {
      resetAddressInput(); // Clear input after successful add
      // Additional logic can go here (e.g., toast notifications)
      // toast.success("Address added successfully!");
    }
  };

  const handleRemoveAddress = (address: string) => {
    removeAddress(address);
    // Additional logic can go here (e.g., toast notifications)
    // toast.info("Address removed");
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
              onChange={(e) => handleAddressChange(e.target.value)}
              className="flex-1 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleAddAddress()}
            />
            <Button onClick={handleAddAddress} size="icon" className="font-mono">
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
                  onClick={() => handleRemoveAddress(address)}
                  className="ml-1 hover:bg-muted p-0.5"
                  type="button"
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

            {/* HyperLend Section */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="font-mono">HYPERLEND_LENDING</CardTitle>
              </CardHeader>
              <CardContent>
                {isHyperLendLoading ? (
                  <div className="text-muted-foreground font-mono">Loading...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 border">
                        <div className="text-xs text-muted-foreground font-mono mb-1">
                          TOTAL_SUPPLIED
                        </div>
                        <div className="text-2xl font-bold font-mono">
                          ${hyperLendData.totalSuppliedUSD.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-4 border">
                        <div className="text-xs text-muted-foreground font-mono mb-1">
                          TOTAL_BORROWED
                        </div>
                        <div className="text-2xl font-bold font-mono">
                          ${hyperLendData.totalBorrowedUSD.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-4 border">
                        <div className="text-xs text-muted-foreground font-mono mb-1">
                          NET_POSITION
                        </div>
                        <div className="text-2xl font-bold font-mono">
                          $
                          {(
                            hyperLendData.totalSuppliedUSD - hyperLendData.totalBorrowedUSD
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Health Factors */}
                    {(hyperLendData.coreHealthFactor || hyperLendData.isolatedHealthFactor) && (
                      <div className="space-y-3">
                        <div className="text-sm font-bold text-muted-foreground font-mono">
                          HEALTH_FACTORS
                        </div>
                        {hyperLendData.coreHealthFactor && (
                          <div className="flex items-center justify-between p-3 border">
                            <span className="font-mono">CORE</span>
                            <span
                              className={`text-xl font-bold font-mono ${
                                Number.parseFloat(hyperLendData.coreHealthFactor) > 1.5
                                  ? 'text-green-600'
                                  : Number.parseFloat(hyperLendData.coreHealthFactor) > 1.2
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {hyperLendData.coreHealthFactor}
                            </span>
                          </div>
                        )}
                        {hyperLendData.isolatedHealthFactor && (
                          <div className="flex items-center justify-between p-3 border">
                            <span className="font-mono">ISOLATED</span>
                            <span
                              className={`text-xl font-bold font-mono ${
                                Number.parseFloat(hyperLendData.isolatedHealthFactor) > 1.5
                                  ? 'text-green-600'
                                  : Number.parseFloat(hyperLendData.isolatedHealthFactor) > 1.2
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {hyperLendData.isolatedHealthFactor}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Core Positions */}
                    {hyperLendData.allCorePositions.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-sm font-bold text-muted-foreground font-mono">
                          CORE_POSITIONS
                        </div>
                        <div className="space-y-2">
                          {hyperLendData.allCorePositions.map((position, idx) => (
                            <div key={idx} className="border p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-bold font-mono">{position.asset}</div>
                                {position.isCollateral && (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    COLLATERAL
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                                <div>
                                  <div className="text-muted-foreground text-xs">SUPPLIED</div>
                                  <div>
                                    {Number.parseFloat(position.supplyBalance).toFixed(4)} ( $
                                    {position.supplyBalanceUSD})
                                  </div>
                                  <div className="text-green-600 text-xs">
                                    APY: {position.supplyAPY}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground text-xs">BORROWED</div>
                                  <div>
                                    {Number.parseFloat(position.borrowBalance).toFixed(4)} ( $
                                    {position.borrowBalanceUSD})
                                  </div>
                                  <div className="text-red-600 text-xs">
                                    APY: {position.borrowAPY}%
                                  </div>
                                </div>
                              </div>
                              {position.liquidationPrice && (
                                <div className="mt-2 text-xs text-muted-foreground font-mono">
                                  LIQUIDATION_PRICE: ${position.liquidationPrice}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Isolated Positions */}
                    {hyperLendData.allIsolatedPositions.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-sm font-bold text-muted-foreground font-mono">
                          ISOLATED_POSITIONS
                        </div>
                        <div className="space-y-2">
                          {hyperLendData.allIsolatedPositions.map((position, idx) => (
                            <div key={idx} className="border p-3">
                              <div className="font-bold font-mono mb-2">
                                {position.assetSymbol} / {position.collateralSymbol}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                                <div>
                                  <div className="text-muted-foreground text-xs">SUPPLIED</div>
                                  <div>
                                    {Number.parseFloat(position.supplyBalance).toFixed(4)} ( $
                                    {position.supplyBalanceUSD})
                                  </div>
                                  <div className="text-green-600 text-xs">
                                    APY: {position.supplyAPY}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground text-xs">BORROWED</div>
                                  <div>
                                    {Number.parseFloat(position.borrowBalance).toFixed(4)} ( $
                                    {position.borrowBalanceUSD})
                                  </div>
                                  <div className="text-red-600 text-xs">
                                    APY: {position.borrowAPY}%
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground font-mono">
                                LIQUIDATION_PRICE: ${position.liquidationPrice}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {hyperLendData.allCorePositions.length === 0 &&
                      hyperLendData.allIsolatedPositions.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground font-mono">
                          NO_LENDING_POSITIONS
                        </div>
                      )}
                  </div>
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
