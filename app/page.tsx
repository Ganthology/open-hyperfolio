'use client';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { Address, createPublicClient, formatEther, http } from 'viem';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

const SHOW_PORTFOLIO = false;

const PROTOCOL_SMART_CONTRACT_ADDRESS = {
  FELIX_PROTOCOL: '',
  HYPERLEND: '',
  HYPERBEAT: '',
};

export default function Home() {
  const form = useForm({
    defaultValues: {
      address: '',
    },
    onSubmit: ({ value }) => {
      fetchSpotClearinghouseState(value.address);
      fetchPerpClearinghouseState(value.address);
      if (SHOW_PORTFOLIO) fetchPortfolio(value.address);
      fetchOpenOrders(value.address);
      fetchHyperEVMState(value.address);
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
    <div className="p-4 w-full">
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
              <input
                type="text"
                className="border-2 border-gray-300 rounded-md p-2"
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
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
    </div>
  );
}
