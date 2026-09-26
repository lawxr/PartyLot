/**
 * Smart Contract ABIs, Bytecodes, and Deployment Addresses for Monad Testnet (Chain ID: 10143)
 * Provides type-safe Viem contract definitions for Partylot.
 */

export const MONAD_CONTRACT_ADDRESSES = {
  partyRegistry: (process.env.NEXT_PUBLIC_PARTY_REGISTRY_ADDRESS ||
    '0xb7d922488daa522443ffe1627efc6d65825eebad') as `0x${string}`,
  partyTreasury: (process.env.NEXT_PUBLIC_PARTY_TREASURY_ADDRESS ||
    '0x13ed67e844496095c0f44c914f89e30ef190db2c') as `0x${string}`,
  socialGraph: (process.env.NEXT_PUBLIC_SOCIAL_GRAPH_ADDRESS ||
    '0x7e87e96bc959fa9ee559fad9c2e3d017d757adf9') as `0x${string}`,
  pythOracle: (process.env.NEXT_PUBLIC_PYTH_ORACLE_ADDRESS ||
    '0x2880aB155794e7179c9eE2e38200202908C17B43') as `0x${string}`,
};

export const PYTH_FEEDS = {
  monUsd: '0x31491744e2dbf6df7fcf4ac0820d18a609b49076d45066d3568424e62f686cd1' as `0x${string}`,
};

export const PythOracleABI = [
  {
    inputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }],
    name: 'getPriceUnsafe',
    outputs: [
      {
        components: [
          { internalType: 'int64', name: 'price', type: 'int64' },
          { internalType: 'uint64', name: 'conf', type: 'uint64' },
          { internalType: 'int32', name: 'expo', type: 'int32' },
          { internalType: 'uint256', name: 'publishTime', type: 'uint256' },
        ],
        internalType: 'struct PythStructs.Price',
        name: 'price',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'uint256', name: 'age', type: 'uint256' },
    ],
    name: 'getPriceNoOlderThan',
    outputs: [
      {
        components: [
          { internalType: 'int64', name: 'price', type: 'int64' },
          { internalType: 'uint64', name: 'conf', type: 'uint64' },
          { internalType: 'int32', name: 'expo', type: 'int32' },
          { internalType: 'uint256', name: 'publishTime', type: 'uint256' },
        ],
        internalType: 'struct PythStructs.Price',
        name: 'price',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;


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
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'fromPartyId', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'toPartyId', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'BalanceRolledOver',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'partyId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'debtor', type: 'address' },
      { indexed: true, internalType: 'address', name: 'creditor', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'DebtSettled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'partyId', type: 'bytes32' },
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
      { indexed: true, internalType: 'bytes32', name: 'partyId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'host', type: 'address' },
    ],
    name: 'PartyRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'partyId', type: 'bytes32' },
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
      { indexed: true, internalType: 'bytes32', name: 'partyId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'role', type: 'string' },
    ],
    name: 'RewardDistributed',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'partyId', type: 'bytes32' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'partyId', type: 'bytes32' },
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
      { internalType: 'bytes32', name: 'partyId', type: 'bytes32' },
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
    inputs: [{ internalType: 'bytes32', name: 'partyId', type: 'bytes32' }],
    name: 'getParty',
    outputs: [
      { internalType: 'address', name: 'host', type: 'address' },
      { internalType: 'uint256', name: 'balance', type: 'uint256' },
      { internalType: 'uint256', name: 'totalDeposited', type: 'uint256' },
      { internalType: 'uint256', name: 'totalDistributed', type: 'uint256' },
      { internalType: 'bool', name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'memberBalances',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'parties',
    outputs: [
      { internalType: 'address', name: 'host', type: 'address' },
      { internalType: 'uint256', name: 'balance', type: 'uint256' },
      { internalType: 'uint256', name: 'totalDeposited', type: 'uint256' },
      { internalType: 'uint256', name: 'totalDistributed', type: 'uint256' },
      { internalType: 'bool', name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'partyId', type: 'bytes32' },
      { internalType: 'address', name: 'host', type: 'address' },
    ],
    name: 'registerParty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'fromPartyId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'toPartyId', type: 'bytes32' },
    ],
    name: 'rolloverToNextParty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'partyId', type: 'bytes32' },
      { internalType: 'address payable', name: 'creditor', type: 'address' },
    ],
    name: 'settleDebt',
    outputs: [],
    stateMutability: 'payable',
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
