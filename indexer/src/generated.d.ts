/**
 * Ambient type definitions for Envio HyperIndex generated module.
 * Provides complete type safety before and during 'envio codegen' execution.
 */

declare module 'generated' {
  export interface EnvioEntityStore<T> {
    get: (id: string) => Promise<T | undefined>;
    set: (entity: T) => void;
    deleteUnsafe?: (id: string) => void;
  }

  export interface PartyEntity {
    id: string;
    partyIdNumber: bigint;
    partyIdBytes: string;
    host: string;
    title: string;
    treasuryAddress: string;
    totalMembers: bigint;
    currentPotBalance: bigint;
    totalDeposited: bigint;
    totalDistributed: bigint;
    totalSettled: bigint;
    createdAt: bigint;
    createdTxHash: string;
  }

  export interface PartyMemberEntity {
    id: string;
    party_id: string;
    userAddress: string;
    joinedAt: bigint;
    joinedBlockNumber: bigint;
    joinedTxHash: string;
    totalContributed: bigint;
  }

  export interface TreasuryDepositEntity {
    id: string;
    party_id: string;
    partyIdBytes: string;
    member: string;
    amount: bigint;
    newBalance: bigint;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: string;
  }

  export interface RewardDistributionEntity {
    id: string;
    party_id: string;
    partyIdBytes: string;
    recipient: string;
    amount: bigint;
    role: string;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: string;
  }

  export interface ExpenseReimbursementEntity {
    id: string;
    party_id: string;
    partyIdBytes: string;
    member: string;
    amount: bigint;
    description: string;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: string;
  }

  export interface DebtSettlementEntity {
    id: string;
    party_id: string;
    partyIdBytes: string;
    debtor: string;
    creditor: string;
    amount: bigint;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: string;
  }

  export interface BalanceRolloverEntity {
    id: string;
    fromPartyId: string;
    toPartyId: string;
    amount: bigint;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: string;
  }

  export interface CrewEntity {
    id: string;
    crewId: bigint;
    name: string;
    host: string;
    totalGatherings: bigint;
    createdAt: bigint;
    transactionHash: string;
  }

  export interface SocialTieEntity {
    id: string;
    userA: string;
    userB: string;
    totalSharedNights: bigint;
    lastInteractionBlock: bigint;
    lastUpdatedTimestamp: bigint;
  }

  export interface ActivityFeedItemEntity {
    id: string;
    party_id?: string | null;
    partyId?: string | null;
    actor: string;
    target?: string | null;
    type: string;
    title: string;
    subtitle: string;
    amount?: bigint | null;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: string;
  }

  export interface UserReputationSummaryEntity {
    id: string;
    userAddress: string;
    totalPartiesJoined: bigint;
    totalDepositedAmount: bigint;
    totalSettledAmount: bigint;
    totalRewardsEarned: bigint;
    reputationScore: bigint;
    lastActiveTimestamp: bigint;
  }

  export interface GlobalMetricsEntity {
    id: string;
    totalPartiesCreated: bigint;
    totalMemberships: bigint;
    totalMonVolumeIndexed: bigint;
    totalSettlementsExecuted: bigint;
    lastIndexedBlock: bigint;
    lastIndexedTimestamp: bigint;
  }

  export interface EnvioContext {
    Party: EnvioEntityStore<PartyEntity>;
    PartyMember: EnvioEntityStore<PartyMemberEntity>;
    TreasuryDeposit: EnvioEntityStore<TreasuryDepositEntity>;
    RewardDistribution: EnvioEntityStore<RewardDistributionEntity>;
    ExpenseReimbursement: EnvioEntityStore<ExpenseReimbursementEntity>;
    DebtSettlement: EnvioEntityStore<DebtSettlementEntity>;
    BalanceRollover: EnvioEntityStore<BalanceRolloverEntity>;
    Crew: EnvioEntityStore<CrewEntity>;
    SocialTie: EnvioEntityStore<SocialTieEntity>;
    ActivityFeedItem: EnvioEntityStore<ActivityFeedItemEntity>;
    UserReputationSummary: EnvioEntityStore<UserReputationSummaryEntity>;
    GlobalMetrics: EnvioEntityStore<GlobalMetricsEntity>;
  }

  export interface EnvioEvent<TParams = Record<string, unknown>> {
    params: TParams;
    block: {
      number: number | bigint;
      timestamp: number | bigint;
      hash?: string;
    };
    transaction: {
      hash: string;
      from: string;
      to?: string;
    };
    logIndex: number | bigint;
  }

  export interface HandlerArgs<TParams = Record<string, unknown>> {
    event: EnvioEvent<TParams>;
    context: EnvioContext;
  }

  export type HandlerFunction<TParams = Record<string, unknown>> = (args: HandlerArgs<TParams>) => Promise<void> | void;

  export interface EventRegistration<TParams = Record<string, unknown>> {
    handler: (fn: HandlerFunction<TParams>) => void;
  }

  export const PartyRegistry: {
    PartyCreated: EventRegistration<{
      partyId: bigint;
      host: string;
      title: string;
      treasury: string;
    }>;
    MemberJoined: EventRegistration<{
      partyId: bigint;
      guest: string;
      totalMembers: bigint;
    }>;
  };

  export const PartyTreasury: {
    PartyRegistered: EventRegistration<{
      partyId: `0x${string}`;
      host: string;
    }>;
    Deposited: EventRegistration<{
      partyId: `0x${string}`;
      member: string;
      amount: bigint;
      newBalance: bigint;
    }>;
    RewardDistributed: EventRegistration<{
      partyId: `0x${string}`;
      recipient: string;
      amount: bigint;
      role: string;
    }>;
    ReimbursementClaimed: EventRegistration<{
      partyId: `0x${string}`;
      member: string;
      amount: bigint;
      description: string;
    }>;
    DebtSettled: EventRegistration<{
      partyId: `0x${string}`;
      debtor: string;
      creditor: string;
      amount: bigint;
    }>;
    BalanceRolledOver: EventRegistration<{
      fromPartyId: `0x${string}`;
      toPartyId: `0x${string}`;
      amount: bigint;
    }>;
  };

  export const SocialGraph: {
    CrewCreated: EventRegistration<{
      crewId: bigint;
      name: string;
      host: string;
    }>;
    GatheringRecorded: EventRegistration<{
      partyId: bigint;
      participantsCount: bigint;
    }>;
    SocialTiesUpdated: EventRegistration<{
      userA: string;
      userB: string;
      totalShared: bigint;
    }>;
  };
}
