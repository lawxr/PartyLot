/**
 * Smart Contract ABIs, Bytecodes, and Deployment Addresses for Monad Testnet (Chain ID: 10143)
 * Provides type-safe Viem contract definitions for Partylot.
 */

export const MONAD_CONTRACT_ADDRESSES = {
  partyRegistry: (process.env.NEXT_PUBLIC_PARTY_REGISTRY_ADDRESS ||
    '0x4040000000000000000000000000000000001001') as `0x${string}`,
  partyTreasury: (process.env.NEXT_PUBLIC_PARTY_TREASURY_ADDRESS ||
    '0x4040000000000000000000000000000000002002') as `0x${string}`,
  socialGraph: (process.env.NEXT_PUBLIC_SOCIAL_GRAPH_ADDRESS ||
    '0x4040000000000000000000000000000000003003') as `0x${string}`,
};

export const PartyRegistryABI = [
  {
    inputs: [{ internalType: 'address', name: '_partySigner', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'partyId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'guest', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'totalMembers', type: 'uint256' },
    ],
    name: 'MemberJoined',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'partyId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'host', type: 'address' },
      { indexed: false, internalType: 'string', name: 'title', type: 'string' },
      { indexed: false, internalType: 'address', name: 'treasury', type: 'address' },
    ],
    name: 'PartyCreated',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PERMIT_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'isMember',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'partyId', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'joinPartyWithPermit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'nonces',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'parties',
    outputs: [
      { internalType: 'address', name: 'host', type: 'address' },
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
      { internalType: 'uint256', name: 'memberCount', type: 'uint256' },
      { internalType: 'address', name: 'treasuryContract', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'partySigner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'partyId', type: 'uint256' },
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'address', name: 'treasury', type: 'address' },
    ],
    name: 'registerParty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const PartyTreasuryABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_partyId', type: 'uint256' },
      { internalType: 'address', name: '_host', type: 'address' },
    ],
    stateMutability: 'payable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'nextPartyId', type: 'uint256' },
    ],
    name: 'BalanceRolledOver',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'member', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newBalance', type: 'uint256' },
    ],
    name: 'Deposited',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'member', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'description', type: 'string' },
    ],
    name: 'ReimbursementClaimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'role', type: 'string' },
    ],
    name: 'RewardDistributed',
    type: 'event',
  },
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address payable', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'role', type: 'string' },
    ],
    name: 'distributeReward',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address payable', name: 'member', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'description', type: 'string' },
    ],
    name: 'executeReimbursement',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'host',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'memberBalances',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'partyId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'reimbursements',
    outputs: [
      { internalType: 'address', name: 'paidBy', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'description', type: 'string' },
      { internalType: 'bool', name: 'executed', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'rewards',
    outputs: [
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'role', type: 'string' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rolloverBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address payable', name: 'nextTreasury', type: 'address' },
      { internalType: 'uint256', name: 'nextPartyId', type: 'uint256' },
    ],
    name: 'rolloverToNextParty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalDeposited',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalDistributed',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
] as const;

export const SocialGraphABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'crewId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: true, internalType: 'address', name: 'host', type: 'address' },
    ],
    name: 'CrewCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'partyId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'participantsCount', type: 'uint256' },
    ],
    name: 'GatheringRecorded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'userA', type: 'address' },
      { indexed: true, internalType: 'address', name: 'userB', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'totalShared', type: 'uint256' },
    ],
    name: 'SocialTiesUpdated',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'crews',
    outputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'address', name: 'host', type: 'address' },
      { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
      { internalType: 'uint256', name: 'totalGatherings', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'a', type: 'address' },
      { internalType: 'address', name: 'b', type: 'address' },
    ],
    name: 'getNightsTogether',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'a', type: 'address' },
      { internalType: 'address', name: 'b', type: 'address' },
    ],
    name: 'getPairKey',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'isCrewMember',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'partyId', type: 'uint256' },
      { internalType: 'address[]', name: 'participants', type: 'address[]' },
    ],
    name: 'recordGathering',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'sharedNightsCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'totalGatheringsAttended',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
