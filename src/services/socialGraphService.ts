import { publicMonadClient } from '@/lib/web3/monad';
import { MONAD_CONTRACT_ADDRESSES, SocialGraphABI } from '@/contracts';

export interface GatheringRecordReceipt {
  success: boolean;
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
  participantsCount: number;
  nightsTogether?: number;
}

export interface AttestGatheringOptions {
  userAName?: string;
  userBName?: string;
  userAId?: string;
  userBId?: string;
}

/**
 * Records verified co-presence at a gathering on Monad's SocialGraph smart contract.
 * Automatically updates pairwise "nights together" ties onchain and in database.
 */
export async function recordGatheringOnchain(
  partyId: string,
  participantAddresses: string[],
  options?: AttestGatheringOptions
): Promise<GatheringRecordReceipt> {
  const res = await fetch('/api/social-graph/attest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      partyId,
      userAAddress: participantAddresses[0],
      userBAddress: participantAddresses[1],
      userAName: options?.userAName,
      userBName: options?.userBName,
      userAId: options?.userAId,
      userBId: options?.userBId,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to record gathering on Monad blockchain.');
  }

  return {
    success: true,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    explorerUrl: data.explorerUrl,
    participantsCount: participantAddresses.length,
    nightsTogether: data.nightsTogether,
  };
}

/**
 * Reads the verifiable count of shared gatherings between two wallet addresses on Monad.
 */
export async function getNightsTogetherOnchain(
  addressA?: string,
  addressB?: string
): Promise<number> {
  if (!addressA || !addressB) return 0;

  try {
    const formattedA = (addressA.startsWith('0x') ? addressA : `0x${addressA}`) as `0x${string}`;
    const formattedB = (addressB.startsWith('0x') ? addressB : `0x${addressB}`) as `0x${string}`;

    if (formattedA.length !== 42 || formattedB.length !== 42) {
      return 0;
    }

    const count = await publicMonadClient.readContract({
      address: MONAD_CONTRACT_ADDRESSES.socialGraph,
      abi: SocialGraphABI,
      functionName: 'getNightsTogether',
      args: [formattedA, formattedB],
    });

    return Number(count);
  } catch (err) {
    console.warn('Falling back from onchain SocialGraph read:', err);
    return 0;
  }
}
