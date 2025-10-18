import { createPublicClient, http } from 'viem';

const HYPERLIQUID_RPC_URL = 'https://rpc.hyperliquid.xyz/evm';

/**
 * Singleton viem client for HyperEVM (HyperLiquid chain)
 * Configured for chain ID 999
 */
export const hyperEvmClient = createPublicClient({
  chain: {
    id: 999,
    name: 'HyperLiquid',
    nativeCurrency: { name: 'HyperLiquid', symbol: 'HYPE', decimals: 18 },
    rpcUrls: { default: { http: [HYPERLIQUID_RPC_URL] } },
  },
  transport: http(HYPERLIQUID_RPC_URL),
});
