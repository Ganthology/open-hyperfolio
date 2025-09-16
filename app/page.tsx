'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Wallet } from 'lucide-react';

interface TokenBalance {
  symbol: string;
  balance: string;
  value: number;
  percentage: number;
}

interface WalletData {
  address: string;
  totalValue: number;
  tokens: TokenBalance[];
  nfts: number;
  defi: number;
}

export default function BalanceTracker() {
  const [addresses, setAddresses] = useState<string[]>([
    '0x0bb06C22dC3c24BA07b91a7e87b07dA20138Eb70',
  ]);
  const [newAddress, setNewAddress] = useState('');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const mockWalletData: WalletData = {
    address: addresses[0],
    totalValue: 52.41,
    tokens: [
      { symbol: 'ETH', balance: '0.97', value: 52.18, percentage: 99.6 },
      { symbol: 'USDC', balance: '0.23', value: 0.23, percentage: 0.4 },
    ],
    nfts: 0,
    defi: 52.18,
  };

  const addAddress = () => {
    if (newAddress && !addresses.includes(newAddress)) {
      setAddresses([...addresses, newAddress]);
      setNewAddress('');
    }
  };

  const removeAddress = (address: string) => {
    setAddresses(addresses.filter((addr) => addr !== address));
  };

  const fetchBalances = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setWalletData(mockWalletData);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    if (addresses.length > 0) {
      fetchBalances();
    }
  }, [addresses]);

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-6 w-6" />
            <h1 className="text-xl font-bold tracking-tight">WEB3_BALANCE_TRACKER</h1>
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border border-primary border-t-transparent"></div>
          </div>
        ) : walletData ? (
          <div className="grid gap-6">
            {/* Portfolio Overview */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-muted-foreground font-mono">
                    VALUE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">
                    ${walletData.totalValue.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 font-mono">
                    {walletData.tokens[0]?.balance} {walletData.tokens[0]?.symbol}
                  </div>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="font-mono">
                        TOKENS: $0.23
                      </Badge>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 font-mono">
                        NFTS: $0.00
                      </Badge>
                      <Badge variant="outline" className="bg-green-100 text-green-800 font-mono">
                        DEFI: ${walletData.defi}
                      </Badge>
                    </div>
                  </div>

                  {/* Portfolio Distribution Bar */}
                  <div className="w-full bg-muted h-3 border">
                    <div
                      className="bg-green-500 h-3 transition-all duration-300"
                      style={{ width: `${walletData.tokens[0]?.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                    <span>0.4%</span>
                    <span>99.6%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Composition */}
            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono">WALLET_COMPOSITION</CardTitle>
                <div className="text-lg font-bold font-mono">
                  ${walletData.totalValue.toFixed(2)}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tokens" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 font-mono">
                    <TabsTrigger value="tokens" className="font-mono">
                      TOKENS (1)
                    </TabsTrigger>
                    <TabsTrigger value="nfts" className="font-mono">
                      NFTS (0)
                    </TabsTrigger>
                    <TabsTrigger value="points" className="font-mono">
                      POINTS (1)
                    </TabsTrigger>
                    <TabsTrigger value="hypercore" className="font-mono">
                      HYPERCORE (0)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tokens" className="mt-6">
                    {walletData.tokens.length > 0 ? (
                      <div className="space-y-4">
                        {walletData.tokens.map((token, index) => (
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
                                {token.percentage}%
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

            {/* DeFi Positions */}
            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-mono">DEFI_POSITIONS</CardTitle>
                <div className="text-lg font-bold font-mono">${walletData.defi}</div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4 font-mono">
                  2_PROTOCOLS • 2_POSITIONS
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 border flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600"></div>
                      </div>
                      <div>
                        <div className="font-bold font-mono">PENDLE</div>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {addresses[0].slice(0, 6)}...{addresses[0].slice(-4)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 border flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-600"></div>
                      </div>
                      <div>
                        <div className="font-bold font-mono">HYPERBEAT</div>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {addresses[0].slice(0, 6)}...{addresses[0].slice(-4)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground font-mono">
            ENTER_WALLET_ADDRESS_TO_VIEW_BALANCE
          </div>
        )}
      </div>
    </div>
  );
}
