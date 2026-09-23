import { publicMonadClient } from './monad';
import { MONAD_CONTRACT_ADDRESSES, PartyTreasuryABI, SocialGraphABI } from '@/contracts';

export interface HyperIndexEvent {
  id: string;
  type: 'deposit' | 'reward' | 'rollover' | 'tie_update' | 'join';
  title: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
}

/**
 * Envio HyperIndex Sub-second Monad Event Pipeline
 * Listens to onchain contract events and triggers real-time social activity updates.
 */
export function subscribeToMonadHyperIndex(
  onEvent: (event: HyperIndexEvent) => void
): () => void {
  // Watch PartyTreasury.Deposited
  const unwatchDeposit = publicMonadClient.watchContractEvent({
    address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
    abi: PartyTreasuryABI,
    eventName: 'Deposited',
    onLogs: (logs) => {
      logs.forEach((log) => {
        onEvent({
          id: `envio-${log.transactionHash}-${log.logIndex}`,
          type: 'deposit',
          title: `Onchain deposit verified on Monad (${log.transactionHash.slice(0, 8)}...)`,
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: 'Just now',
        });
      });
    },
  });

  // Watch PartyTreasury.RewardDistributed
  const unwatchReward = publicMonadClient.watchContractEvent({
    address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
    abi: PartyTreasuryABI,
    eventName: 'RewardDistributed',
    onLogs: (logs) => {
      logs.forEach((log) => {
        onEvent({
          id: `envio-${log.transactionHash}-${log.logIndex}`,
          type: 'reward',
          title: `Reward distributed from Party Pot on Monad (${log.transactionHash.slice(0, 8)}...)`,
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: 'Just now',
        });
      });
    },
  });

  // Watch SocialGraph.SocialTiesUpdated
  const unwatchTies = publicMonadClient.watchContractEvent({
    address: MONAD_CONTRACT_ADDRESSES.socialGraph,
    abi: SocialGraphABI,
    eventName: 'SocialTiesUpdated',
    onLogs: (logs) => {
      logs.forEach((log) => {
        onEvent({
          id: `envio-${log.transactionHash}-${log.logIndex}`,
          type: 'tie_update',
          title: `Mutual party attendance recorded onchain in SocialGraph`,
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: 'Just now',
        });
      });
    },
  });

  return () => {
    unwatchDeposit();
    unwatchReward();
    unwatchTies();
  };
}
