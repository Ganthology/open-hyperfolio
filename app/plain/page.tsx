'use client';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { Address, createPublicClient, formatEther, http } from 'viem';
import { z } from 'zod';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

const HYPERLEND_API_URL = 'https://api.hyperlend.finance';

const PENDLE_API_URL = 'https://api-v2.pendle.finance/core';

const beHYPE_SMART_CONTRACT_ADDRESS = '0xd8FC8F0b03eBA61F64D08B0bef69d80916E5DdA9';

const SHOW_PORTFOLIO = false;

// spender: 0x68e37dE8d93d3496ae143F2E900490f6280C57cD

const PROTOCOL_SMART_CONTRACT_ADDRESS = {
  FELIX_PROTOCOL: {
    feUSD: '0x02c6a2fa58cc01a18b8d9e00ea48d65e4df26c70',
    USDT0: '0xfc5126377f0efc0041c0969ef9ba903ce67d151e',
    USDT0Frontier: '0x9896a8605763106e57A51aa0a97Fe8099E806bb3',
    // 'beHYPE/USDT0': '0xd8FC8F0b03eBA61F64D08B0bef69d80916E5DdA9',
    'beHYPE/USDT0': '0x68e37dE8d93d3496ae143F2E900490f6280C57cD',
  },
  HYPERLEND: '',
  HYPERBEAT: {
    beHYPE: beHYPE_SMART_CONTRACT_ADDRESS,
  },
} as const;

const addressSchema = z.object({
  address: z.string().min(1).startsWith('0x'),
});

export default function Home() {
  const form = useForm({
    defaultValues: {
      address: '',
    },
    validators: {
      onChange: addressSchema,
    },
    onSubmit: ({ value }) => {
      fetchSpotClearinghouseState(value.address);
      fetchPerpClearinghouseState(value.address);
      if (SHOW_PORTFOLIO) fetchPortfolio(value.address);
      fetchOpenOrders(value.address);
      fetchHyperEVMState(value.address);
      fetchHyperLendState(value.address);
      fetchPendleState(value.address);
      fetchBeHYPEBalance(value.address);
      fetchFeUSDBalance(value.address);
      fetchUSDT0Balance(value.address);
      fetchUSDT0FrontierBalance(value.address);
      fetchBeHYPEUSDT0Balance(value.address);
    },
  });

  const HYPERLIQUID_RPC_URL = 'https://rpc.hyperliquid.xyz/evm';

  const client = createPublicClient({
    chain: {
      id: 999,
      name: 'HyperLiquid',
      nativeCurrency: {
        name: 'HyperLiquid',
        symbol: 'HYPE',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [HYPERLIQUID_RPC_URL],
        },
      },
    },
    transport: http(HYPERLIQUID_RPC_URL),
  });

  const { mutate: fetchSpotClearinghouseState, data: spotClearinghouseState } = useMutation({
    mutationFn: (address: string) => {
      return fetch(HYPERLIQUID_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          type: 'spotClearinghouseState',
          user: address,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json());
    },
  });

  const { mutate: fetchPerpClearinghouseState, data: perpClearinghouseState } = useMutation({
    mutationFn: (address: string) => {
      return fetch(HYPERLIQUID_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: address,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json());
    },
  });

  const { mutate: fetchOpenOrders, data: openOrders } = useMutation({
    mutationFn: (address: string) => {
      return fetch(HYPERLIQUID_API_URL, {
        method: 'POST',
        body: JSON.stringify({ type: 'frontendOpenOrders', user: address }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json());
    },
  });

  const { mutate: fetchPortfolio, data: portfolio } = useMutation({
    mutationFn: (address: string) => {
      return fetch(HYPERLIQUID_API_URL, {
        method: 'POST',
        body: JSON.stringify({ type: 'portfolio', user: address }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json());
    },
  });

  const { mutate: fetchHyperEVMState, data: hyperEVMState } = useMutation({
    mutationFn: (address: string) => {
      if (!address.startsWith('0x')) {
        throw new Error('Invalid address');
      }

      return client.getBalance({ address: address as Address });
    },
  });

  const { mutate: fetchHyperLendState, data: hyperLendState } = useMutation({
    mutationFn: (address: string) => {
      return fetch(`${HYPERLEND_API_URL}/data/user/valueChange?chain=hyperEvm&address=${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(async (res) => {
        const data = (await res.json()) as {
          newPositions: Record<
            string,
            {
              tokenValue: string;
              usdValue: string;
              name: string;
            }
          >;
        };

        return Object.values(data.newPositions).map((position) => ({
          name: position.name,
          amount: position.tokenValue,
          value: position.usdValue,
        }));
      });
    },
  });

  interface PendleMarketPosition {
    marketId: string;
    pt: {
      balance: string;
      activeBalance: string;
      valuation: number;
      claimTokenAmount: {
        token: string;
        amount: string;
      }[];
    };
    yt: {
      balance: string;
      activeBalance: string;
      valuation: number;
      claimTokenAmount: {
        token: string;
        amount: string;
      }[];
    };
    lp: {
      balance: string;
      activeBalance: string;
      valuation: number;
      claimTokenAmount: {
        token: string;
        amount: string;
      }[];
    };
  }

  interface PendleState {
    positions: {
      chainId: number;
      totalOpen: number;
      totalClosed: number;
      totalSy: number;
      openPositions: PendleMarketPosition[];
      closedPositions: PendleMarketPosition[];
      syPositions: PendleMarketPosition[];
      updatedAt: string;
      errorMessage: string;
    }[];
  }

  const { mutate: fetchPendleState, data: pendleState } = useMutation({
    mutationFn: (address: string) => {
      return fetch(`${PENDLE_API_URL}/v1/dashboard/positions/database/${address}?filterUsd=0`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json() as Promise<PendleState>);
    },
  });

  function getHyperliquidPositionFromPendleState(pendleState: PendleState) {
    return pendleState.positions
      .filter((position) => position.chainId === 999)
      .flatMap((position) => position.openPositions);
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

  const { mutate: fetchBeHYPEBalance, data: beHYPEBalance } = useMutation({
    mutationFn: (address: string) => {
      const contractAddress = PROTOCOL_SMART_CONTRACT_ADDRESS.HYPERBEAT.beHYPE;
      return readContractBalance(contractAddress, address);
    },
  });

  const { mutate: fetchFeUSDBalance, data: feUSDBalance } = useMutation({
    mutationFn: (address: string) => {
      const contractAddress = PROTOCOL_SMART_CONTRACT_ADDRESS.FELIX_PROTOCOL.feUSD;
      return readContractBalance(contractAddress, address);
    },
  });

  const { mutate: fetchUSDT0Balance, data: usdt0Balance } = useMutation({
    mutationFn: (address: string) => {
      const contractAddress = PROTOCOL_SMART_CONTRACT_ADDRESS.FELIX_PROTOCOL.USDT0;
      return readContractBalance(contractAddress, address);
    },
  });

  const { mutate: fetchUSDT0FrontierBalance, data: usdt0FrontierBalance } = useMutation({
    mutationFn: (address: string) => {
      const contractAddress = PROTOCOL_SMART_CONTRACT_ADDRESS.FELIX_PROTOCOL.USDT0Frontier;
      return readContractBalance(contractAddress, address);
    },
  });

  const { mutate: fetchBeHYPEUSDT0Balance, data: beHYPEUSDT0Balance } = useMutation({
    mutationFn: (address: string) => {
      const contractAddress = PROTOCOL_SMART_CONTRACT_ADDRESS.FELIX_PROTOCOL['beHYPE/USDT0'];
      return readContractBalance(contractAddress, address);
    },
  });

  // const { mutate: fetchFelixProtocolState, data: felixProtocolState } = useMutation({
  //   mutationFn: (address: string) => {
  //     if (!address.startsWith('0x')) {
  //       throw new Error('Invalid address');
  //     }

  //     return client.readContract({
  //       address: PROTOCOL_SMART_CONTRACT_ADDRESS.FELIX_PROTOCOL as Address,
  //       abi: HYPERLEND_ABI,
  //       functionName: 'getProtocolState',
  //     });
  //   },
  // });

  return (
    <div className="py-6 px-12 w-full">
      <h1 className="text-2xl font-bold">OpenHyperfolio</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="gap-x-2 flex items-center py-2 px-2">
          <form.Field
            name="address"
            children={(field) => (
              <>
                <input
                  type="text"
                  className="border-2 border-gray-300 rounded-md p-2"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {!field.state.meta.isValid && (
                  <p className="text-red-500">{field.state.meta.errors.join(', ')}</p>
                )}
              </>
            )}
          />
          <form.Subscribe
            selector={(state) => state.canSubmit}
            children={(canSubmit) => (
              <button
                className="bg-blue-500 text-white rounded-md p-2"
                type="submit"
                disabled={!canSubmit}
              >
                Submit
              </button>
            )}
          />
        </div>
      </form>

      <div>
        <h2 className="text-lg font-bold">Spot Balances</h2>
        <pre>
          {spotClearinghouseState
            ? JSON.stringify(spotClearinghouseState, null, 2)
            : 'Loading Spot Balances...'}
        </pre>
      </div>
      <div>
        <h2 className="text-lg font-bold">Perp Balances</h2>
        <pre>
          {perpClearinghouseState
            ? JSON.stringify(perpClearinghouseState, null, 2)
            : 'Loading Perp Balances...'}
        </pre>
      </div>
      {SHOW_PORTFOLIO && (
        <div>
          <h2 className="text-lg font-bold">Portfolio</h2>
          <pre>{portfolio ? JSON.stringify(portfolio, null, 2) : 'Loading Portfolio...'}</pre>
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold">Open Orders</h2>
        <pre>{openOrders ? JSON.stringify(openOrders, null, 2) : 'Loading Open Orders...'}</pre>
      </div>
      <div>
        <h2 className="text-lg font-bold">HyperEVM State</h2>
        <pre>{hyperEVMState ? formatEther(hyperEVMState) : 'Loading HyperEVM State...'}</pre>
      </div>
      <div>
        <h2 className="text-lg font-bold">HyperLend State</h2>
        <pre>
          {hyperLendState
            ? hyperLendState.map((position) => (
                <div key={position.name}>
                  {position.name}: {position.amount} ${position.value}
                </div>
              ))
            : 'Loading HyperLend State...'}
        </pre>
      </div>
      <div>
        <h2 className="text-lg font-bold">Pendle State</h2>
        <pre>
          {pendleState
            ? JSON.stringify(getHyperliquidPositionFromPendleState(pendleState), null, 2)
            : 'Loading Pendle State...'}
        </pre>
      </div>
      <div>
        <h2 className="text-lg font-bold">beHYPE Balance</h2>
        <pre>{beHYPEBalance ? beHYPEBalance : 'Loading Smart Contract Balance...'}</pre>
      </div>
      <div className="border p-4">
        <h2 className="text-xl font-bold">Felix Protocol</h2>
        <div>
          <h2 className="text-lg font-bold">feUSD Balance</h2>
          <pre>{feUSDBalance ? feUSDBalance : 'Loading Smart Contract Balance...'}</pre>
        </div>
        <div>
          <h2 className="text-lg font-bold">USDT0 Balance</h2>
          <pre>{usdt0Balance ? usdt0Balance : 'Loading Smart Contract Balance...'}</pre>
        </div>
        <div>
          <h2 className="text-lg font-bold">USDT0 Frontier Balance</h2>
          <pre>
            {usdt0FrontierBalance ? usdt0FrontierBalance : 'Loading Smart Contract Balance...'}
          </pre>
        </div>
        <div>
          <h2 className="text-lg font-bold">beHYPE/USDT0 Balance</h2>
          <pre>{beHYPEUSDT0Balance ? beHYPEUSDT0Balance : 'Loading Smart Contract Balance...'}</pre>
        </div>
      </div>
    </div>
  );
}
