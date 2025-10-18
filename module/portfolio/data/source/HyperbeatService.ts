import { Address, formatEther } from 'viem';
import type { PublicClient } from 'viem';
import type { ERC20Balance } from '../types';

/**
 * Service for interacting with Hyperbeat protocol smart contracts
 */
export class HyperbeatService {
  constructor(
    private readonly client: PublicClient,
    private readonly beHYPEContractAddress: string,
  ) {}

  /**
   * Get beHYPE balance for an address
   */
  async getBeHYPEBalance(address: string): Promise<ERC20Balance> {
    const balance = await this.client.readContract({
      address: this.beHYPEContractAddress as Address,
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
      args: [address as Address],
    });

    return formatEther(balance as bigint);
  }
}
