export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  gatheringsCount: number;
  gamesCount: number;
  peopleCount: number;
  settlementsCount: number;
  balance: number;
  walletAddress?: string;
  email?: string;
  authMethod?: string;
  isPrivyAuthenticated?: boolean;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role?: 'host' | 'guest';
  status?: 'going' | 'maybe' | 'invited';
  nightsTogether?: number;
  walletAddress?: string;
}

export interface Party {
  id: string;
  code: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  coverImage: string;
  hostId: string;
  hostName: string;
  members: Member[];
  potBalance: number;
  createdAt: string;
  status: 'upcoming' | 'live' | 'past';
  crewId?: string;
}

export interface CrewMember {
  id: string;
  userId: string;
  name: string;
  handle: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  walletAddress?: string;
  nightsTogether: number;
}

export interface CrewMemory {
  id: string;
  crewId: string;
  imageUrl: string;
  caption: string;
  uploadedBy: string;
  uploadedAt: string;
  partyTitle?: string;
}

export interface Crew {
  id: string;
  name: string;
  description?: string;
  coverImage: string;
  ownerId?: string;
  membersCount: number;
  members: CrewMember[];
  partiesCount: number;
  totalSpent: number;
  nightsTogether: number;
  topGame: string;
  treasuryBalance: number;
  memories: CrewMemory[];
  lastActivity: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  partyId: string;
  description: string;
  amount: number;
  paidById: string;
  paidByName: string;
  paidByAvatar: string;
  splitBetweenIds: string[];
  createdAt: string;
  isSettled?: boolean;
}

export interface NetBalance {
  memberId: string;
  memberName: string;
  avatar: string;
  netAmount: number; // positive = gets back, negative = owes
}

export interface DebtSettlement {
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  toName: string;
  toAvatar: string;
  amount: number;
}

export interface PotTransaction {
  id: string;
  partyId: string;
  type: 'add' | 'spend';
  amount: number;
  description: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
  userId?: string;
  txHash?: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  voters: string[];
}

export interface Poll {
  id: string;
  partyId: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVoteId?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  partyId: string;
  text: string;
  time: string;
  avatar: string;
  type: 'join' | 'pot' | 'poll' | 'game' | 'expense';
}

export type GameId = 'whos-most-likely' | 'this-or-that' | 'crew-trivia';

export interface WhosMostLikelyQuestion {
  id: string;
  question: string;
  votes: Record<string, number>; // memberId -> count
}

export interface ThisOrThatQuestion {
  id: string;
  optionA: string;
  optionB: string;
  votesA: number;
  votesB: number;
  userVote?: 'A' | 'B';
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PartyRecapData {
  partyTitle: string;
  date: string;
  peopleCount: number;
  totalShared: number;
  gamesPlayed: number;
  votesCast: number;
  memoriesCount: number;
  mvp: { name: string; avatar: string };
  gameKing: { name: string; avatar: string };
  dj: { name: string; avatar: string };
  rolloverAmount: number;
}
