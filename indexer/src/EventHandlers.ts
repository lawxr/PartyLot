/*
 * Envio HyperIndex Event Handlers for PartyLot on Monad Testnet
 * Real-time event extraction, normalization, and multi-entity aggregation
 */

import {
  PartyRegistry,
  PartyTreasury,
  SocialGraph,
} from "generated";

// Global Metrics Singleton ID
const GLOBAL_METRICS_ID = "global";

function formatMon(amount: bigint): string {
  const mon = Number(amount) / 1e18;
  return mon.toFixed(3);
}

// -----------------------------------------------------------------------------
// 1. PartyRegistry Handlers
// -----------------------------------------------------------------------------

PartyRegistry.PartyCreated.handler(async ({ event, context }) => {
  const partyId = event.params.partyId.toString();
  const host = event.params.host.toLowerCase();
  const title = event.params.title;
  const treasury = event.params.treasury.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  // 1. Create or update Party entity
  context.Party.set({
    id: partyId,
    partyIdNumber: event.params.partyId,
    partyIdBytes: `0x${event.params.partyId.toString(16).padStart(64, "0")}`,
    host,
    title,
    treasuryAddress: treasury,
    totalMembers: 1n,
    currentPotBalance: 0n,
    totalDeposited: 0n,
    totalDistributed: 0n,
    totalSettled: 0n,
    createdAt: timestamp,
    createdTxHash: event.transaction.hash,
  });

  // 2. Add Host as First Party Member
  const memberId = `${partyId}-${host}`;
  context.PartyMember.set({
    id: memberId,
    party_id: partyId,
    userAddress: host,
    joinedAt: timestamp,
    joinedBlockNumber: blockNumber,
    joinedTxHash: event.transaction.hash,
    totalContributed: 0n,
  });

  // 3. Emit Activity Item
  context.ActivityFeedItem.set({
    id: `act-party-created-${event.transaction.hash}-${event.logIndex}`,
    party_id: partyId,
    partyId,
    actor: host,
    target: treasury,
    type: "PARTY_CREATED",
    title: `New Party Created: "${title}"`,
    subtitle: `Hosted on Monad Testnet by ${host.slice(0, 6)}...${host.slice(-4)}`,
    amount: null,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });

  // 4. Update User Reputation
  const user = (await context.UserReputationSummary.get(host)) ?? {
    id: host,
    userAddress: host,
    totalPartiesJoined: 0n,
    totalDepositedAmount: 0n,
    totalSettledAmount: 0n,
    totalRewardsEarned: 0n,
    reputationScore: 100n,
    lastActiveTimestamp: timestamp,
  };

  context.UserReputationSummary.set({
    ...user,
    totalPartiesJoined: user.totalPartiesJoined + 1n,
    reputationScore: user.reputationScore + 10n,
    lastActiveTimestamp: timestamp,
  });

  // 5. Update Global Metrics
  const global = (await context.GlobalMetrics.get(GLOBAL_METRICS_ID)) ?? {
    id: GLOBAL_METRICS_ID,
    totalPartiesCreated: 0n,
    totalMemberships: 0n,
    totalMonVolumeIndexed: 0n,
    totalSettlementsExecuted: 0n,
    lastIndexedBlock: blockNumber,
    lastIndexedTimestamp: timestamp,
  };

  context.GlobalMetrics.set({
    ...global,
    totalPartiesCreated: global.totalPartiesCreated + 1n,
    totalMemberships: global.totalMemberships + 1n,
    lastIndexedBlock: blockNumber,
    lastIndexedTimestamp: timestamp,
  });
});

PartyRegistry.MemberJoined.handler(async ({ event, context }) => {
  const partyId = event.params.partyId.toString();
  const guest = event.params.guest.toLowerCase();
  const totalMembers = event.params.totalMembers;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  const party = await context.Party.get(partyId);
  if (party) {
    context.Party.set({
      ...party,
      totalMembers,
    });
  }

  // Create Party Member
  const memberId = `${partyId}-${guest}`;
  context.PartyMember.set({
    id: memberId,
    party_id: partyId,
    userAddress: guest,
    joinedAt: timestamp,
    joinedBlockNumber: blockNumber,
    joinedTxHash: event.transaction.hash,
    totalContributed: 0n,
  });

  // Activity Feed
  context.ActivityFeedItem.set({
    id: `act-joined-${event.transaction.hash}-${event.logIndex}`,
    party_id: partyId,
    partyId,
    actor: guest,
    target: null,
    type: "MEMBER_JOINED",
    title: `Guest Joined Party`,
    subtitle: `${guest.slice(0, 6)}...${guest.slice(-4)} joined ${party ? `"${party.title}"` : `Party #${partyId}`}`,
    amount: null,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });

  // User Reputation
  const user = (await context.UserReputationSummary.get(guest)) ?? {
    id: guest,
    userAddress: guest,
    totalPartiesJoined: 0n,
    totalDepositedAmount: 0n,
    totalSettledAmount: 0n,
    totalRewardsEarned: 0n,
    reputationScore: 100n,
    lastActiveTimestamp: timestamp,
  };

  context.UserReputationSummary.set({
    ...user,
    totalPartiesJoined: user.totalPartiesJoined + 1n,
    reputationScore: user.reputationScore + 5n,
    lastActiveTimestamp: timestamp,
  });

  // Global Metrics
  const global = (await context.GlobalMetrics.get(GLOBAL_METRICS_ID)) ?? {
    id: GLOBAL_METRICS_ID,
    totalPartiesCreated: 0n,
    totalMemberships: 0n,
    totalMonVolumeIndexed: 0n,
    totalSettlementsExecuted: 0n,
    lastIndexedBlock: blockNumber,
    lastIndexedTimestamp: timestamp,
  };

  context.GlobalMetrics.set({
    ...global,
    totalMemberships: global.totalMemberships + 1n,
    lastIndexedBlock: blockNumber,
    lastIndexedTimestamp: timestamp,
  });
});

// -----------------------------------------------------------------------------
// 2. PartyTreasury Handlers
// -----------------------------------------------------------------------------

PartyTreasury.Deposited.handler(async ({ event, context }) => {
  const partyIdBytes = event.params.partyId;
  const member = event.params.member.toLowerCase();
  const amount = event.params.amount;
  const newBalance = event.params.newBalance;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  // In PartyLot, numeric partyId or bytes32 can map to party
  // Try resolving party by id
  const partyIdStr = BigInt(partyIdBytes).toString();
  const party = await context.Party.get(partyIdStr);

  if (party) {
    context.Party.set({
      ...party,
      currentPotBalance: newBalance,
      totalDeposited: party.totalDeposited + amount,
    });
  }

  // Create TreasuryDeposit record
  context.TreasuryDeposit.set({
    id: `deposit-${event.transaction.hash}-${event.logIndex}`,
    party_id: party ? party.id : partyIdStr,
    partyIdBytes,
    member,
    amount,
    newBalance,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });

  // Create Activity item
  context.ActivityFeedItem.set({
    id: `act-deposit-${event.transaction.hash}-${event.logIndex}`,
    party_id: party ? party.id : partyIdStr,
    partyId: party ? party.id : partyIdStr,
    actor: member,
    target: null,
    type: "DEPOSIT",
    title: `Pot Deposit: +${formatMon(amount)} MON`,
    subtitle: `Contributed by ${member.slice(0, 6)}...${member.slice(-4)}`,
    amount,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });

  // Update User Reputation
  const user = (await context.UserReputationSummary.get(member)) ?? {
    id: member,
    userAddress: member,
    totalPartiesJoined: 0n,
    totalDepositedAmount: 0n,
    totalSettledAmount: 0n,
    totalRewardsEarned: 0n,
    reputationScore: 100n,
    lastActiveTimestamp: timestamp,
  };

  context.UserReputationSummary.set({
    ...user,
    totalDepositedAmount: user.totalDepositedAmount + amount,
    reputationScore: user.reputationScore + 15n,
    lastActiveTimestamp: timestamp,
  });

  // Global Metrics
  const global = (await context.GlobalMetrics.get(GLOBAL_METRICS_ID)) ?? {
    id: GLOBAL_METRICS_ID,
    totalPartiesCreated: 0n,
    totalMemberships: 0n,
    totalMonVolumeIndexed: 0n,
    totalSettlementsExecuted: 0n,
    lastIndexedBlock: blockNumber,
    lastIndexedTimestamp: timestamp,
  };

  context.GlobalMetrics.set({
    ...global,
    totalMonVolumeIndexed: global.totalMonVolumeIndexed + amount,
    lastIndexedBlock: blockNumber,
    lastIndexedTimestamp: timestamp,
  });
});

PartyTreasury.RewardDistributed.handler(async ({ event, context }) => {
  const partyIdBytes = event.params.partyId;
  const recipient = event.params.recipient.toLowerCase();
  const amount = event.params.amount;
  const role = event.params.role;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  const partyIdStr = BigInt(partyIdBytes).toString();
  const party = await context.Party.get(partyIdStr);

  if (party) {
    context.Party.set({
      ...party,
      totalDistributed: party.totalDistributed + amount,
      currentPotBalance:
        party.currentPotBalance >= amount
          ? party.currentPotBalance - amount
          : 0n,
    });
  }

  context.RewardDistribution.set({
    id: `reward-${event.transaction.hash}-${event.logIndex}`,
    party_id: party ? party.id : partyIdStr,
    partyIdBytes,
    recipient,
    amount,
    role,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });

  context.ActivityFeedItem.set({
    id: `act-reward-${event.transaction.hash}-${event.logIndex}`,
    party_id: party ? party.id : partyIdStr,
    partyId: party ? party.id : partyIdStr,
    actor: recipient,
    target: null,
    type: "REWARD",
    title: `Role Reward: ${role} (${formatMon(amount)} MON)`,
    subtitle: `Awarded to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
    amount,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });

  const user = (await context.UserReputationSummary.get(recipient)) ?? {
    id: recipient,
    userAddress: recipient,
    totalPartiesJoined: 0n,
    totalDepositedAmount: 0n,
    totalSettledAmount: 0n,
    totalRewardsEarned: 0n,
    reputationScore: 100n,
    lastActiveTimestamp: timestamp,
  };

  context.UserReputationSummary.set({
    ...user,
    totalRewardsEarned: user.totalRewardsEarned + amount,
    reputationScore: user.reputationScore + 20n,
    lastActiveTimestamp: timestamp,
  });
});

PartyTreasury.DebtSettled.handler(async ({ event, context }) => {
  const partyIdBytes = event.params.partyId;
  const debtor = event.params.debtor.toLowerCase();
  const creditor = event.params.creditor.toLowerCase();
  const amount = event.params.amount;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  const partyIdStr = BigInt(partyIdBytes).toString();
  const party = await context.Party.get(partyIdStr);

  if (party) {
    context.Party.set({
      ...party,
      totalSettled: party.totalSettled + amount,
    });
  }

  context.DebtSettlement.set({
    id: `settle-${event.transaction.hash}-${event.logIndex}`,
    party_id: party ? party.id : partyIdStr,
    partyIdBytes,
    debtor,
    creditor,
    amount,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });

  context.ActivityFeedItem.set({
    id: `act-settle-${event.transaction.hash}-${event.logIndex}`,
    party_id: party ? party.id : partyIdStr,
    partyId: party ? party.id : partyIdStr,
    actor: debtor,
    target: creditor,
    type: "DEBT_SETTLED",
    title: `P2P Debt Settled: ${formatMon(amount)} MON`,
    subtitle: `${debtor.slice(0, 6)}... paid ${creditor.slice(0, 6)}...`,
    amount,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });

  // Update Debtor reputation (paying debt increases score!)
  const user = (await context.UserReputationSummary.get(debtor)) ?? {
    id: debtor,
    userAddress: debtor,
    totalPartiesJoined: 0n,
    totalDepositedAmount: 0n,
    totalSettledAmount: 0n,
    totalRewardsEarned: 0n,
    reputationScore: 100n,
    lastActiveTimestamp: timestamp,
  };

  context.UserReputationSummary.set({
    ...user,
    totalSettledAmount: user.totalSettledAmount + amount,
    reputationScore: user.reputationScore + 25n,
    lastActiveTimestamp: timestamp,
  });

  const global = (await context.GlobalMetrics.get(GLOBAL_METRICS_ID)) ?? {
    id: GLOBAL_METRICS_ID,
    totalPartiesCreated: 0n,
    totalMemberships: 0n,
    totalMonVolumeIndexed: 0n,
    totalSettlementsExecuted: 0n,
    lastIndexedBlock: blockNumber,
    lastIndexedTimestamp: timestamp,
  };

  context.GlobalMetrics.set({
    ...global,
    totalSettlementsExecuted: global.totalSettlementsExecuted + 1n,
    totalMonVolumeIndexed: global.totalMonVolumeIndexed + amount,
    lastIndexedBlock: blockNumber,
    lastIndexedTimestamp: timestamp,
  });
});

PartyTreasury.ReimbursementClaimed.handler(async ({ event, context }) => {
  const partyIdBytes = event.params.partyId;
  const member = event.params.member.toLowerCase();
  const amount = event.params.amount;
  const description = event.params.description;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  const partyIdStr = BigInt(partyIdBytes).toString();
  const party = await context.Party.get(partyIdStr);

  if (party) {
    context.Party.set({
      ...party,
      totalDistributed: party.totalDistributed + amount,
      currentPotBalance:
        party.currentPotBalance >= amount
          ? party.currentPotBalance - amount
          : 0n,
    });
  }

  context.ExpenseReimbursement.set({
    id: `reimb-${event.transaction.hash}-${event.logIndex}`,
    party_id: party ? party.id : partyIdStr,
    partyIdBytes,
    member,
    amount,
    description,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });

  context.ActivityFeedItem.set({
    id: `act-reimb-${event.transaction.hash}-${event.logIndex}`,
    party_id: party ? party.id : partyIdStr,
    partyId: party ? party.id : partyIdStr,
    actor: member,
    target: null,
    type: "REIMBURSEMENT",
    title: `Expense Reimbursed: ${formatMon(amount)} MON`,
    subtitle: `"${description}" claimed by ${member.slice(0, 6)}...`,
    amount,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });
});

PartyTreasury.BalanceRolledOver.handler(async ({ event, context }) => {
  const fromPartyId = event.params.fromPartyId;
  const toPartyId = event.params.toPartyId;
  const amount = event.params.amount;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  context.BalanceRollover.set({
    id: `rollover-${event.transaction.hash}-${event.logIndex}`,
    fromPartyId,
    toPartyId,
    amount,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });

  context.ActivityFeedItem.set({
    id: `act-rollover-${event.transaction.hash}-${event.logIndex}`,
    party_id: null,
    partyId: null,
    actor: event.transaction.from.toLowerCase(),
    target: null,
    type: "ROLLOVER",
    title: `Pot Surplus Rolled Over: ${formatMon(amount)} MON`,
    subtitle: `Transferred to the next gathering pot`,
    amount,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });
});

PartyTreasury.PartyRegistered.handler(async ({ event, context }) => {
  const partyIdBytes = event.params.partyId;
  const host = event.params.host.toLowerCase();
  const partyIdStr = BigInt(partyIdBytes).toString();

  const party = await context.Party.get(partyIdStr);
  if (party) {
    context.Party.set({
      ...party,
      host,
    });
  }
});

// -----------------------------------------------------------------------------
// 3. SocialGraph Handlers
// -----------------------------------------------------------------------------

SocialGraph.CrewCreated.handler(async ({ event, context }) => {
  const crewId = event.params.crewId.toString();
  const name = event.params.name;
  const host = event.params.host.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  context.Crew.set({
    id: crewId,
    crewId: event.params.crewId,
    name,
    host,
    totalGatherings: 0n,
    createdAt: timestamp,
    transactionHash: event.transaction.hash,
  });

  context.ActivityFeedItem.set({
    id: `act-crew-${event.transaction.hash}-${event.logIndex}`,
    party_id: null,
    partyId: null,
    actor: host,
    target: null,
    type: "CREW_CREATED",
    title: `New Crew Founded: "${name}"`,
    subtitle: `Created by ${host.slice(0, 6)}...${host.slice(-4)}`,
    amount: null,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });
});

SocialGraph.GatheringRecorded.handler(async ({ event, context }) => {
  const partyId = event.params.partyId.toString();
  const participantsCount = event.params.participantsCount;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  context.ActivityFeedItem.set({
    id: `act-gathering-${event.transaction.hash}-${event.logIndex}`,
    party_id: partyId,
    partyId,
    actor: event.transaction.from.toLowerCase(),
    target: null,
    type: "GATHERING",
    title: `Onchain Gathering Attested`,
    subtitle: `${participantsCount.toString()} guests confirmed in attendance`,
    amount: null,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });
});

SocialGraph.SocialTiesUpdated.handler(async ({ event, context }) => {
  const userA = event.params.userA.toLowerCase();
  const userB = event.params.userB.toLowerCase();
  const totalShared = event.params.totalShared;
  const timestamp = BigInt(event.block.timestamp);
  const blockNumber = BigInt(event.block.number);

  // Canonical pair ID
  const pairId = userA < userB ? `${userA}-${userB}` : `${userB}-${userA}`;

  context.SocialTie.set({
    id: pairId,
    userA,
    userB,
    totalSharedNights: totalShared,
    lastInteractionBlock: blockNumber,
    lastUpdatedTimestamp: timestamp,
  });

  context.ActivityFeedItem.set({
    id: `act-tie-${event.transaction.hash}-${event.logIndex}`,
    party_id: null,
    partyId: null,
    actor: userA,
    target: userB,
    type: "TIE_UPDATED",
    title: `Social Tie Strengthened`,
    subtitle: `${userA.slice(0, 6)}... & ${userB.slice(0, 6)}... have shared ${totalShared.toString()} gatherings`,
    amount: null,
    blockNumber,
    blockTimestamp: timestamp,
    transactionHash: event.transaction.hash,
  });
});
