import { Address, formatEther } from 'viem';
import type { PublicClient } from 'viem';
import type { ERC20Balance } from '../types';

/**
 * Generic service for interacting with ERC20 smart contracts
 */
export class SmartContractService {
  constructor(private readonly client: PublicClient) {}

  /**
   * Get ERC20 token balance for a wallet address
   * @param contractAddress - The ERC20 token contract address
   * @param walletAddress - The wallet address to check balance for
   */
  async getERC20Balance(contractAddress: string, walletAddress: string): Promise<ERC20Balance> {
    const balance = await this.client.readContract({
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
    });

    return formatEther(balance as bigint);
  }
}
