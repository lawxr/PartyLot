import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { useEffect } from 'react';
import {
  User,
  Party,
  Crew,
  Expense,
  PotTransaction,
  Poll,
  ActivityItem,
  Member,
  WhosMostLikelyQuestion,
  ThisOrThatQuestion,
  TriviaQuestion,
  GameId,
  CrewMember,
  CrewMemory,
  ExpenseCategory,
  PartyTask,
  SharedExperienceConnection,
  PartyMemory,
} from '@/types';
import { generatePartyCode } from '@/services/party';
import {
  persistPartyToSupabase,
  joinPartyWithInviteCode,
  persistExpenseToSupabase,
  persistActivityToSupabase,
  persistCrewToSupabase,
  addMemberToCrewInDb,
  persistTaskToSupabase,
  updateTaskInSupabase,
  fetchPartiesFromDb,
  fetchPartyDetailsFromDb,
  fetchCrewsFromDb,
  fetchActivitiesFromDb,
  fetchPollsFromDb,
  fetchGameSessionsFromDb,
  persistPollToSupabase,
  persistGameSessionToSupabase,
  syncUserDataToDb,
  subscribeToPartyRealtime,
  subscribeToTasksRealtime,
  persistPartyMemoryToSupabase,
  fetchUserProfileFromDb,
} from '@/services/supabaseService';
import { Language } from '@/lib/i18n/translations';
import {
  FinancialActionResult,
  depositToPartyPotOnchain,
  distributeBountyOnchain,
  settleDamageOnchain,
  rolloverFundsOnchain,
  TreasuryReceipt,
} from '@/services/treasury';
import { calculateNetBalances, computeDebtSettlements } from '@/services/settlements';
import { recordGatheringOnchain } from '@/services/socialGraphService';
import { isExplicitDevelopmentDemoMode } from '@/lib/runtimeMode';

const demoMode = isExplicitDevelopmentDemoMode();
const signedOutUser: User = {
  id: '',
  name: 'Guest',
  handle: '@guest',
  avatar: '',
  gatheringsCount: 0,
  gamesCount: 0,
  peopleCount: 0,
  settlementsCount: 0,
  balance: 0,
};
const volatileStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const detectInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'es';
  const navLang =
    window.navigator.languages?.[0] ||
    window.navigator.language ||
    '';
  return navLang.toLowerCase().startsWith('es') ? 'es' : 'en';
};

export type AppView =
  | 'splash'
  | 'home'
  | 'create-party'
  | 'join-party'
  | 'party-detail'
  | 'crew-detail'
  | 'games'
  | 'split'
  | 'party-pot'
  | 'polls'
  | 'recap'
  | 'profile';

export type MainTab = 'home' | 'crews' | 'activity' | 'profile';

interface PartyStoreState {
  currentUser: User;
  currentView: AppView;
  previousView: AppView | null;
  activeTab: MainTab;
  parties: Party[];
  currentPartyId: string;
  crews: Crew[];
  currentCrewId: string | null;
  expenses: Expense[];
  transactions: PotTransaction[];
  polls: Poll[];
  activities: ActivityItem[];
  whosMostLikely: WhosMostLikelyQuestion[];
  thisOrThat: ThisOrThatQuestion[];
  trivia: TriviaQuestion[];
  crewTrivia: TriviaQuestion[];
  activeGameId: GameId;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Navigation
  setCurrentView: (view: AppView) => void;
  goBack: () => void;
  setActiveTab: (tab: MainTab) => void;
  selectParty: (partyId: string) => void;
  selectCrew: (crewId: string) => void;

  // Crew Actions
  createCrew: (params: {
    name: string;
    description: string;
    coverImage: string;
  }) => Crew;
  addCrewMember: (crewId: string, member: Partial<CrewMember>) => void;
  addCrewMemory: (
    crewId: string,
    memory: { imageUrl: string; caption: string; partyTitle?: string }
  ) => void;

  // Party Actions
  createParty: (params: {
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    coverImage: string;
    crewId?: string;
  }) => Party;
  joinPartyByCode: (
    code: string,
    authToken?: string | null
  ) => Promise<{ success: boolean; party?: Party; message?: string }>;
  memories: PartyMemory[];
  addPartyMemory: (params: { imageUrl: string; caption?: string }) => Promise<void>;
  toggleRsvp: (partyId: string) => void;

  // Expense & Split Actions
  addExpense: (params: {
    partyId: string;
    description: string;
    amount: number;
    paidById: string;
    splitBetweenIds: string[];
    category?: ExpenseCategory;
  }) => void;
  settleAllDebts: (partyId?: string) => Promise<FinancialActionResult>;

  // Party Pot Actions
  addToPot: (partyId: string, amount: number, description?: string) => Promise<FinancialActionResult>;
  spendFromPot: (partyId: string, amount: number, description: string) => Promise<FinancialActionResult>;
  rolloverPotToCrew: (partyId: string, crewId: string) => Promise<FinancialActionResult>;

  // Party Tasks & Bounties
  tasks: PartyTask[];
  createPartyTask: (params: { partyId: string; title: string; rewardAmount: number }) => void;
  claimPartyTask: (taskId: string, memberId: string) => void;
  completePartyTask: (taskId: string) => void;
  verifyAndPayPartyTask: (taskId: string) => Promise<FinancialActionResult>;

  // Polls Actions
  votePoll: (pollId: string, optionId: string) => void;
  createPoll: (partyId: string, question: string, options: string[]) => void;

  // Games Actions
  setActiveGame: (gameId: GameId) => void;
  voteWhosMostLikely: (questionId: string, memberId: string) => void;
  voteThisOrThat: (questionId: string, choice: 'A' | 'B') => void;
  rewardGameWinner: (params: {
    partyId: string;
    memberId: string;
    amount: number;
    gameTitle: string;
  }) => Promise<FinancialActionResult>;

  // Shared-Experience Graph
  getSharedConnection: (targetMember: Member) => SharedExperienceConnection;
  syncConnectionOnchain: (targetMember: Member) => Promise<{
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    explorerUrl?: string;
    nightsTogether?: number;
    error?: string;
  }>;
  sendPartyCheers: (targetMember: Member) => Promise<void>;

  // User & Auth Actions
  updateUser: (updates: Partial<User>, authToken?: string | null) => Promise<void>;
  resetUserSession: () => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;

  // Realtime Supabase Persistence & Hydration
  hydrateFromSupabase: () => Promise<void>;
  loadPartyFromSupabase: (partyId: string) => Promise<void>;
  listenToActivePartyRealtime: (partyId: string) => () => void;

  // Social Follow & Attended Nights
  starredUserIds: string[];
  toggleStarUser: (userId: string) => void;
  isUserStarred: (userId: string) => boolean;
  attendedPartyIds: string[];
  addAttendedNight: (partyId: string) => void;

  // Reset
  resetToDefaults: () => void;
}

export const usePartyStore = create<PartyStoreState>()(
  persist(
    (set, get) => ({
      currentUser: signedOutUser,
      isOnboardingOpen: false,
      setIsOnboardingOpen: (open) => set({ isOnboardingOpen: open }),
      pendingInviteCode: null,
      setPendingInviteCode: (code) => set({ pendingInviteCode: code }),
      currentView: 'splash',
      previousView: null,
      activeTab: 'home',
      language: detectInitialLanguage(),
      setLanguage: (lang) => set({ language: lang }),
      theme: 'light',
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
        set({ theme });
      },
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', nextTheme === 'dark');
        }
        set({ theme: nextTheme });
      },
      starredUserIds: [],
      toggleStarUser: (userId) => {
        set((state) => {
          const currentList = state.starredUserIds || [];
          const isStarred = currentList.includes(userId);
          const next = isStarred
            ? currentList.filter((id) => id !== userId)
            : [...currentList, userId];
          return { starredUserIds: next };
        });
      },
      isUserStarred: (userId) => {
        return (get().starredUserIds || []).includes(userId);
      },
      attendedPartyIds: [],
      addAttendedNight: (partyId) => {
        set((state) => {
          const currentList = state.attendedPartyIds || [];
          if (currentList.includes(partyId)) return state;
          const next = [partyId, ...currentList];
          return {
            attendedPartyIds: next,
            currentUser: {
              ...state.currentUser,
              gatheringsCount: (state.currentUser?.gatheringsCount || 0) + 1,
            },
          };
        });
      },
      parties: [],
      currentPartyId: '',
      crews: [],
      currentCrewId: null,
      expenses: [],
      transactions: [],
      tasks: [],
      polls: [],
      activities: [],
      memories: [],
      whosMostLikely: [],
      thisOrThat: [],
      trivia: [],
      crewTrivia: [],
      activeGameId: 'whos-most-likely',

      setCurrentView: (view) => {
        set((state) => {
          if (state.currentView === view) return state;
          return {
            previousView: state.currentView,
            currentView: view,
          };
        });
      },

      selectParty: (partyId) => {
        set((state) => ({
          currentPartyId: partyId,
          previousView:
            state.currentView === 'join-party' || state.currentView === 'create-party'
              ? 'home'
              : state.currentView,
          currentView: 'party-detail',
        }));
      },

      goBack: () => {
        set((state) => {
          const isAuthed = Boolean(state.currentUser?.isPrivyAuthenticated || demoMode);

          if (state.currentView === 'home' && state.activeTab !== 'home') {
            return {
              activeTab: 'home',
            };
          }

          if (state.previousView === 'splash') {
            return {
              currentView: 'splash',
              previousView: null,
            };
          }

          if (!isAuthed) {
            return {
              currentView: 'splash',
              previousView: null,
            };
          }

          if (state.currentView === 'profile') {
            return {
              currentView: 'home',
              activeTab: 'home',
              previousView: null,
            };
          }

          if (
            state.previousView &&
            state.previousView !== state.currentView &&
            state.previousView !== 'join-party' &&
            state.previousView !== 'create-party'
          ) {
            return {
              currentView: state.previousView,
              previousView: null,
            };
          }

          return { currentView: 'home', activeTab: 'home', previousView: null };
        });
      },

      setActiveTab: (tab) => {
        set({
          activeTab: tab,
          currentView: 'home',
        });
      },

      selectCrew: (crewId) => {
        set((state) => ({
          currentCrewId: crewId,
          previousView: state.currentView,
          currentView: 'crew-detail',
        }));
      },

      createCrew: ({ name, description, coverImage }) => {
        const state = get();
        const newCrew: Crew = {
          id: `c-${Date.now()}`,
          name: name.trim() || 'My Secret Crew',
          description: description.trim() || 'Private trust network for gatherings.',
          coverImage: coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
          ownerId: state.currentUser.id,
          membersCount: 1,
          partiesCount: 0,
          totalSpent: 0,
          nightsTogether: 1,
          topGame: "Who's Most Likely",
          treasuryBalance: 0,
          lastActivity: 'Just now',
          createdAt: new Date().toISOString(),
          members: [
            {
              id: `cm-${Date.now()}`,
              userId: state.currentUser.id,
              name: state.currentUser.name,
              handle: state.currentUser.handle,
              avatar: state.currentUser.avatar,
              role: 'owner',
              joinedAt: 'Today',
              walletAddress: state.currentUser.walletAddress,
              nightsTogether: 1,
            },
          ],
          memories: [],
        };

        set((s) => ({
          crews: [newCrew, ...s.crews],
          currentCrewId: newCrew.id,
          previousView: s.currentView,
          currentView: 'crew-detail',
        }));

        persistCrewToSupabase(newCrew, state.currentUser);
        return newCrew;
      },

      addCrewMember: (crewId, memberData) => {
        set((s) => ({
          crews: s.crews.map((c) => {
            if (c.id !== crewId) return c;
            const newMember: CrewMember = {
              id: `cm-${Date.now()}`,
              userId: memberData.userId || `u-${Date.now()}`,
              name: memberData.name || 'Anonymous Guest',
              handle: memberData.handle || '@guest',
              avatar: memberData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
              role: memberData.role || 'member',
              joinedAt: 'Today',
              walletAddress: memberData.walletAddress,
              nightsTogether: 1,
            };
            return {
              ...c,
              membersCount: c.membersCount + 1,
              members: [...c.members, newMember],
              lastActivity: 'Just now',
            };
          }),
        }));

        addMemberToCrewInDb(crewId, {
          id: memberData.userId || `u-${Date.now()}`,
          name: memberData.name || 'Anonymous Guest',
          role: memberData.role || 'member',
        });
      },

      addCrewMemory: (crewId, memory) => {
        const state = get();
        set((s) => ({
          crews: s.crews.map((c) => {
            if (c.id !== crewId) return c;
            const newMemory: CrewMemory = {
              id: `mem-${Date.now()}`,
              crewId,
              imageUrl: memory.imageUrl,
              caption: memory.caption,
              uploadedBy: state.currentUser.name,
              uploadedAt: 'Just now',
              partyTitle: memory.partyTitle,
            };
            return {
              ...c,
              memories: [newMemory, ...c.memories],
              lastActivity: 'Just now',
            };
          }),
        }));
      },

      createParty: ({ title, date, time, location, description, coverImage, crewId }) => {
        const state = get();
        const code = generatePartyCode();
        const newParty: Party = {
          id: `p-${Date.now()}`,
          code,
          title: title.trim() || 'EPIC NIGHT',
          date: date || 'TONIGHT',
          time: time || '10:00 PM',
          location: location || 'Private Location',
          description: description || 'Good vibes, music and memories.',
          coverImage,
          hostId: state.currentUser.id,
          hostName: state.currentUser.name,
          crewId: crewId || undefined,
          members: [
            {
              id: state.currentUser.id,
              name: state.currentUser.name,
              avatar: state.currentUser.avatar,
              role: 'host',
              status: 'going',
              nightsTogether: state.currentUser.gatheringsCount,
            },
          ],
          potBalance: 0,
          createdAt: new Date().toISOString(),
          status: 'live',
        };

        const newActivity: ActivityItem = {
          id: `act-${Date.now()}`,
          partyId: newParty.id,
          type: 'join',
          text: `${state.currentUser.name} created the party: ${newParty.title}`,
          time: 'Just now',
          avatar: state.currentUser.avatar,
        };

        set((s) => ({
          parties: [newParty, ...s.parties],
          currentPartyId: newParty.id,
          activities: [newActivity, ...s.activities],
          crews: crewId
            ? s.crews.map((c) =>
                c.id === crewId
                  ? { ...c, partiesCount: c.partiesCount + 1, lastActivity: 'Just now' }
                  : c
              )
            : s.crews,
        }));

        persistPartyToSupabase(newParty, state.currentUser);
        persistActivityToSupabase(newActivity);

        return newParty;
      },

      joinPartyByCode: async (code, authToken) => {
        const state = get();
        const normalized = code.trim().toUpperCase();

        const result = await joinPartyWithInviteCode(normalized, authToken || null);
        if (!result.success || !result.party) {
          return {
            success: false,
            message: result.error || 'The server could not confirm this invite join.',
          };
        }

        const confirmedParty = result.party;
        const partyExists = state.parties.some((p) => p.id === confirmedParty.id);
        const updatedParties = partyExists
          ? state.parties.map((p) => (p.id === confirmedParty.id ? confirmedParty : p))
          : [...state.parties, confirmedParty];

        const newActivity: ActivityItem = {
          id: `act-${Date.now()}`,
          partyId: confirmedParty.id,
          type: 'join',
          text: `${state.currentUser.name} joined via code ${confirmedParty.code}`,
          time: 'Just now',
          avatar: state.currentUser.avatar,
        };

        set({
          parties: updatedParties,
          currentPartyId: confirmedParty.id,
          activities: [newActivity, ...state.activities],
        });

        return { success: true, party: confirmedParty };
      },

      addPartyMemory: async ({ imageUrl, caption }) => {
        const state = get();
        const partyId = state.currentPartyId || 'party_hackathon_demo';
        const newMemory: PartyMemory = {
          id: `mem-${Date.now()}`,
          partyId,
          imageUrl,
          caption,
          uploadedById: state.currentUser.id,
          uploadedByName: state.currentUser.name || 'Anonymous',
          uploadedByAvatar: state.currentUser.avatar,
          createdAt: 'Just now',
        };

        const newActivity: ActivityItem = {
          id: `act-memory-${Date.now()}`,
          partyId,
          type: 'game',
          text: `📸 ${state.currentUser.name} añadió una nueva foto al álbum!`,
          time: 'Just now',
          avatar: state.currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        };

        set((s) => ({
          memories: [newMemory, ...s.memories],
          activities: [newActivity, ...s.activities],
        }));

        if (!demoMode && partyId) {
          await Promise.all([
            persistPartyMemoryToSupabase(newMemory),
            persistActivityToSupabase(newActivity),
          ]);
        }
      },

      toggleRsvp: (partyId) => {
        set((state) => {
          const party = state.parties.find((p) => p.id === partyId);
          if (!party) return state;

          const isMember = party.members.some((m) => m.id === state.currentUser.id);
          let updatedMembers: Member[];

          if (isMember) {
            updatedMembers = party.members.filter((m) => m.id !== state.currentUser.id);
          } else {
            updatedMembers = [
              ...party.members,
              {
                id: state.currentUser.id,
                name: state.currentUser.name,
                avatar: state.currentUser.avatar,
                role: 'guest',
                status: 'going',
              },
            ];
          }

          return {
            parties: state.parties.map((p) =>
              p.id === partyId ? { ...p, members: updatedMembers } : p
            ),
          };
        });
      },

      addExpense: ({ partyId, description, amount, paidById, splitBetweenIds, category = 'general' }) => {
        set((state) => {
          const payer = state.parties
            .find((p) => p.id === partyId)
            ?.members.find((m) => m.id === paidById) || state.currentUser;

          const newExpense: Expense = {
            id: `exp-${Date.now()}`,
            partyId,
            description,
            amount,
            paidById,
            paidByName: payer.name,
            paidByAvatar: payer.avatar,
            splitBetweenIds,
            category,
            isSettled: false,
            createdAt: 'Just now',
          };

          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            partyId,
            type: 'expense',
            text: `${payer.name} added ${category !== 'general' ? `[${category.toUpperCase()}] ` : ''}expense: "${description}" ($${amount.toFixed(2)})`,
            time: 'Just now',
            avatar: payer.avatar,
          };

          persistExpenseToSupabase(newExpense);
          persistActivityToSupabase(newActivity);

          return {
            expenses: [newExpense, ...state.expenses],
            activities: [newActivity, ...state.activities],
          };
        });
      },

      settleAllDebts: async (targetPartyId?: string) => {
        const state = get();
        const pId = targetPartyId || state.currentPartyId;
        const party = state.parties.find((p) => p.id === pId) || state.parties[0];
        if (!party) return { status: 'available', message: 'No active party found' };

        const partyExpenses = state.expenses.filter((e) => e.partyId === party.id && !e.isSettled);
        const netBalances = calculateNetBalances(partyExpenses, party.members);
        const debtSettlements = computeDebtSettlements(netBalances, party.members);

        let receipt: TreasuryReceipt | undefined;
        try {
          receipt = await settleDamageOnchain(party.id, debtSettlements, state.currentUser.walletAddress);
        } catch (err) {
          console.warn('Onchain settle fallback:', err);
        }

        const updatedExpenses = state.expenses.map((e) =>
          e.partyId === party.id ? { ...e, isSettled: true } : e
        );

        const newActivity: ActivityItem = {
          id: `act-${Date.now()}`,
          partyId: party.id,
          type: 'pot',
          text: `⚡ Cuentas saldadas en Monad Testnet (${debtSettlements.length} pagos liquidados en USDC)`,
          time: 'Just now',
          avatar: state.currentUser.avatar,
        };

        set({
          expenses: updatedExpenses,
          activities: [newActivity, ...state.activities],
        });

        return {
          status: 'available',
          message: 'All debts settled successfully on Monad Testnet (USDC)',
          receipt,
        };
      },

      addToPot: async (partyId: string, amount: number, description?: string) => {
        const state = get();
        const numAmount = Math.max(1, amount);

        let receipt: TreasuryReceipt | undefined;
        try {
          receipt = await depositToPartyPotOnchain(partyId, numAmount, {
            userAddress: state.currentUser.walletAddress,
            userId: state.currentUser.id,
            userName: state.currentUser.name,
          });
        } catch (err) {
          console.warn('Onchain deposit fallback:', err);
        }

        const newTx: PotTransaction = {
          id: `tx-${Date.now()}`,
          partyId,
          amount: numAmount,
          type: 'add',
          description: description || `Deposit into party pot via Monad Testnet (USDC)`,
          userName: state.currentUser.name,
          userAvatar: state.currentUser.avatar,
          timestamp: 'Just now',
          txHash: receipt?.txHash,
        };

        const updatedParties = state.parties.map((p) =>
          p.id === partyId ? { ...p, potBalance: (p.potBalance || 0) + numAmount } : p
        );

        const newActivity: ActivityItem = {
          id: `act-${Date.now()}`,
          partyId,
          type: 'pot',
          text: `💰 ${state.currentUser.name} aportó $${numAmount.toFixed(2)} USDC al Party Pot (Monad)`,
          time: 'Just now',
          avatar: state.currentUser.avatar,
        };

        set({
          parties: updatedParties,
          transactions: [newTx, ...state.transactions],
          activities: [newActivity, ...state.activities],
        });

        return {
          status: 'available',
          message: `$${numAmount.toFixed(2)} USDC deposited into Party Pot on Monad`,
          receipt,
        };
      },

      spendFromPot: async (partyId: string, amount: number, description: string) => {
        const state = get();
        const numAmount = Math.max(1, amount);

        let receipt: TreasuryReceipt | undefined;
        try {
          receipt = await distributeBountyOnchain(
            partyId,
            state.currentUser.walletAddress || '0x0000000000000000000000000000000000000001',
            numAmount,
            description,
            state.currentUser.name
          );
        } catch (err) {
          console.warn('Onchain spend fallback:', err);
        }

        const newTx: PotTransaction = {
          id: `tx-${Date.now()}`,
          partyId,
          amount: numAmount,
          type: 'spend',
          description: description || `Expense paid from party pot`,
          userName: state.currentUser.name,
          userAvatar: state.currentUser.avatar,
          timestamp: 'Just now',
          txHash: receipt?.txHash,
        };

        const updatedParties = state.parties.map((p) =>
          p.id === partyId ? { ...p, potBalance: Math.max(0, (p.potBalance || 0) - numAmount) } : p
        );

        const newActivity: ActivityItem = {
          id: `act-${Date.now()}`,
          partyId,
          type: 'pot',
          text: `💸 Gasto de $${numAmount.toFixed(2)} USDC pagado del Party Pot: "${description}"`,
          time: 'Just now',
          avatar: state.currentUser.avatar,
        };

        set({
          parties: updatedParties,
          transactions: [newTx, ...state.transactions],
          activities: [newActivity, ...state.activities],
        });

        return {
          status: 'available',
          message: `$${numAmount.toFixed(2)} USDC reimbursement processed on Monad`,
          receipt,
        };
      },

      rolloverPotToCrew: async (partyId: string, crewId: string) => {
        const state = get();
        const party = state.parties.find((p) => p.id === partyId) || state.parties[0];
        const currentBalance = party?.potBalance || 0;

        let receipt: TreasuryReceipt | undefined;
        try {
          receipt = await rolloverFundsOnchain(partyId, crewId, currentBalance);
        } catch (err) {
          console.warn('Onchain rollover fallback:', err);
        }

        const newTx: PotTransaction = {
          id: `tx-${Date.now()}`,
          partyId,
          amount: currentBalance,
          type: 'rollover',
          description: `Rollover of remaining funds to next gathering`,
          userName: state.currentUser.name,
          userAvatar: state.currentUser.avatar,
          timestamp: 'Just now',
          txHash: receipt?.txHash,
        };

        const updatedParties = state.parties.map((p) =>
          p.id === partyId ? { ...p, potBalance: 0 } : p
        );

        const newActivity: ActivityItem = {
          id: `act-${Date.now()}`,
          partyId,
          type: 'pot',
          text: `🔄 $${currentBalance.toFixed(2)} USDC transferidos para la próxima fiesta de la Crew (Monad)`,
          time: 'Just now',
          avatar: state.currentUser.avatar,
        };

        set({
          parties: updatedParties,
          transactions: [newTx, ...state.transactions],
          activities: [newActivity, ...state.activities],
        });

        return {
          status: 'available',
          message: `$${currentBalance.toFixed(2)} USDC rolled over on Monad`,
          receipt,
        };
      },

      createPartyTask: ({ partyId, title, rewardAmount }) => {
        set((state) => {
          const newTask: PartyTask = {
            id: `task-${Date.now()}`,
            partyId,
            title,
            rewardAmount,
            status: 'open',
            createdAt: 'Just now',
          };

          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            partyId,
            type: 'pot',
            text: `New bounty created: "${title}" ($${rewardAmount.toFixed(2)} reward) 🎯`,
            time: 'Just now',
            avatar: state.currentUser.avatar,
          };

          persistTaskToSupabase(newTask);
          persistActivityToSupabase(newActivity);

          return {
            tasks: [newTask, ...state.tasks],
            activities: [newActivity, ...state.activities],
          };
        });
      },

      claimPartyTask: (taskId, memberId) => {
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const member =
            state.parties
              .find((p) => p.id === task.partyId)
              ?.members.find((m) => m.id === memberId) || state.currentUser;

          const updatedTask: PartyTask = {
            ...task,
            status: 'claimed',
            claimedById: member.id,
            claimedByName: member.name,
            claimedByAvatar: member.avatar,
          };

          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            partyId: task.partyId,
            type: 'pot',
            text: `${member.name} claimed bounty: "${task.title}" 🙋‍♂️`,
            time: 'Just now',
            avatar: member.avatar,
          };

          updateTaskInSupabase(updatedTask);
          persistActivityToSupabase(newActivity);

          return {
            tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
            activities: [newActivity, ...state.activities],
          };
        });
      },

      completePartyTask: (taskId) => {
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const updatedTask: PartyTask = {
            ...task,
            status: 'completed',
            completedAt: 'Just now',
          };

          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            partyId: task.partyId,
            type: 'pot',
            text: `${task.claimedByName || 'Attendee'} completed: "${task.title}"! Awaiting host verification 📦`,
            time: 'Just now',
            avatar: task.claimedByAvatar || state.currentUser.avatar,
          };

          updateTaskInSupabase(updatedTask);
          persistActivityToSupabase(newActivity);

          return {
            tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
            activities: [newActivity, ...state.activities],
          };
        });
      },

      verifyAndPayPartyTask: async (taskId: string) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return { status: 'available', message: 'Task not found' };

        let receipt: TreasuryReceipt | undefined;
        try {
          receipt = await distributeBountyOnchain(
            task.partyId,
            state.currentUser.walletAddress || '0x0000000000000000000000000000000000000001',
            task.rewardAmount,
            `BOUNTY_${task.title.replace(/\s+/g, '_').toUpperCase()}`,
            task.claimedByName
          );
        } catch (err) {
          console.warn('Onchain task reward fallback:', err);
        }

        const updatedTask: PartyTask = {
          ...task,
          status: 'verified',
        };

        const newTx: PotTransaction = {
          id: `tx-${Date.now()}`,
          partyId: task.partyId,
          amount: task.rewardAmount,
          type: 'reward',
          description: `Bounty paid: "${task.title}"`,
          userName: task.claimedByName || state.currentUser.name,
          userAvatar: task.claimedByAvatar || state.currentUser.avatar,
          timestamp: 'Just now',
          txHash: receipt?.txHash,
        };

        const newActivity: ActivityItem = {
          id: `act-${Date.now()}`,
          partyId: task.partyId,
          type: 'pot',
          text: `🎯 Recompensa de $${task.rewardAmount.toFixed(2)} USDC pagada a ${task.claimedByName || 'Asistente'} por "${task.title}" (Monad)`,
          time: 'Just now',
          avatar: task.claimedByAvatar || state.currentUser.avatar,
        };

        updateTaskInSupabase(updatedTask);

        set({
          tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
          transactions: [newTx, ...state.transactions],
          activities: [newActivity, ...state.activities],
        });

        return {
          status: 'available',
          message: `Bounty of $${task.rewardAmount.toFixed(2)} USDC verified and paid on Monad`,
          receipt,
        };
      },

      votePoll: (pollId, optionId) => {
        set((state) => {
          const poll = state.polls.find((p) => p.id === pollId);
          if (!poll) return state;

          const wasAlreadyVoted = poll.userVoteId === optionId;

          const updatedOptions = poll.options.map((opt) => {
            let votes = opt.votes;
            let voters = [...opt.voters];

            if (poll.userVoteId === opt.id) {
              votes = Math.max(0, votes - 1);
              voters = voters.filter((id) => id !== state.currentUser.id);
            }

            if (!wasAlreadyVoted && opt.id === optionId) {
              votes += 1;
              voters.push(state.currentUser.id);
            }

            return { ...opt, votes, voters };
          });

          const newTotal = updatedOptions.reduce((acc, o) => acc + o.votes, 0);

          const updatedPoll: Poll = {
            ...poll,
            options: updatedOptions,
            totalVotes: newTotal,
            userVoteId: wasAlreadyVoted ? undefined : optionId,
          };

          return {
            polls: state.polls.map((p) => (p.id === pollId ? updatedPoll : p)),
          };
        });
      },

      createPoll: (partyId, question, optionLabels) => {
        set((state) => {
          const newPoll: Poll = {
            id: `poll-${Date.now()}`,
            partyId,
            question: question.toUpperCase(),
            options: optionLabels.filter(Boolean).map((label, idx) => ({
              id: `opt-${Date.now()}-${idx}`,
              label,
              votes: 0,
              voters: [],
            })),
            totalVotes: 0,
            createdAt: 'Just now',
          };

          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            partyId,
            type: 'poll',
            text: `${state.currentUser.name} created a poll: "${question}"`,
            time: 'Just now',
            avatar: state.currentUser.avatar,
          };

          return {
            polls: [newPoll, ...state.polls],
            activities: [newActivity, ...state.activities],
          };
        });
      },

      setActiveGame: (gameId) => {
        set({ activeGameId: gameId });
      },

      voteWhosMostLikely: (questionId, memberId) => {
        set((state) => {
          const updated = state.whosMostLikely.map((q) => {
            if (q.id === questionId) {
              const currentVotes = q.votes[memberId] || 0;
              return {
                ...q,
                votes: { ...q.votes, [memberId]: currentVotes + 1 },
              };
            }
            return q;
          });

          return { whosMostLikely: updated };
        });
      },

      voteThisOrThat: (questionId, choice) => {
        set((state) => {
          const updated = state.thisOrThat.map((q) => {
            if (q.id === questionId) {
              return {
                ...q,
                votesA: choice === 'A' ? q.votesA + 1 : q.votesA,
                votesB: choice === 'B' ? q.votesB + 1 : q.votesB,
                userVote: choice,
              };
            }
            return q;
          });
          return { thisOrThat: updated };
        });
      },

      rewardGameWinner: async ({ partyId, memberId, amount, gameTitle }) => {
        const state = get();
        const party = state.parties.find((p) => p.id === partyId) || state.parties[0];
        const member = party?.members.find((m) => m.id === memberId) || state.currentUser;

        let receipt: TreasuryReceipt | undefined;
        try {
          receipt = await distributeBountyOnchain(
            partyId,
            member.walletAddress || '0x0000000000000000000000000000000000000001',
            amount,
            `WINNER_${gameTitle.replace(/\s+/g, '_').toUpperCase()}`,
            member.name
          );
        } catch (err) {
          console.warn('Onchain game reward fallback:', err);
        }

        const newTx: PotTransaction = {
          id: `tx-${Date.now()}`,
          partyId,
          amount,
          type: 'reward',
          description: `Winner reward: ${gameTitle}`,
          userName: member.name,
          userAvatar: member.avatar,
          timestamp: 'Just now',
          txHash: receipt?.txHash,
        };

        const newActivity: ActivityItem = {
          id: `act-${Date.now()}`,
          partyId,
          type: 'game',
          text: `🏆 ${member.name} ganó $${amount.toFixed(2)} USDC jugando a ${gameTitle}! (Monad)`,
          time: 'Just now',
          avatar: member.avatar,
        };

        set({
          transactions: [newTx, ...state.transactions],
          activities: [newActivity, ...state.activities],
        });

        return {
          status: 'available',
          message: `Reward of $${amount.toFixed(2)} USDC sent to ${member.name} on Monad`,
          receipt,
        };
      },

      getSharedConnection: (targetMember) => {
        const state = get();
        const currentUserId = state.currentUser.id;
        const currentUserName = state.currentUser.name;
        const currentUserWallet = state.currentUser.walletAddress;

        const targetId = targetMember.id;
        const targetName = targetMember.name;
        const targetWallet = targetMember.walletAddress;

        const mutualParties = state.parties.filter((p) => {
          const hasCurrentUser = p.members.some(
            (m) =>
              (currentUserId && m.id === currentUserId) ||
              (currentUserName && m.name?.toLowerCase() === currentUserName.toLowerCase()) ||
              (currentUserWallet && m.walletAddress && m.walletAddress.toLowerCase() === currentUserWallet.toLowerCase())
          );
          const hasTarget = p.members.some(
            (m) =>
              (targetId && m.id === targetId) ||
              (targetName && m.name?.toLowerCase() === targetName.toLowerCase()) ||
              (targetWallet && m.walletAddress && m.walletAddress.toLowerCase() === targetWallet.toLowerCase())
          );
          return hasCurrentUser && hasTarget;
        });

        const mutualPartyIds = new Set(mutualParties.map((p) => p.id));

        let realGames = 0;
        state.activities.forEach((act) => {
          if (mutualPartyIds.has(act.partyId) && act.type === 'game') {
            realGames++;
          }
        });
        state.whosMostLikely.forEach((q) => {
          const votesForTarget = q.votes[targetId] || 0;
          const votesForUser = q.votes[currentUserId] || 0;
          if (votesForTarget > 0 || votesForUser > 0) {
            realGames += votesForTarget + votesForUser;
          }
        });
        state.thisOrThat.forEach((tot) => {
          if (tot.userVote) realGames++;
        });

        let realSettlements = 0;
        let unsettledCount = 0;
        state.expenses.forEach((exp) => {
          if (mutualPartyIds.has(exp.partyId)) {
            const isTargetInvolved = exp.paidById === targetId || exp.splitBetweenIds.includes(targetId);
            const isUserInvolved = exp.paidById === currentUserId || exp.splitBetweenIds.includes(currentUserId);
            if (isTargetInvolved && isUserInvolved) {
              if (exp.isSettled) {
                realSettlements++;
              } else {
                unsettledCount++;
              }
            }
          }
        });

        const sharedCrews = state.crews.filter((c) => {
          const hasUser = c.members?.some(
            (m) => (currentUserId && m.userId === currentUserId) || m.name === currentUserName
          );
          const hasTarget = c.members?.some(
            (m) => (targetId && m.userId === targetId) || m.name === targetName
          );
          return hasUser && hasTarget;
        });

        const onchainNights = targetMember.nightsTogether || 0;

        const gatheringsTogether = Math.max(mutualParties.length, onchainNights, 1);
        const gamesPlayedTogether = realGames;
        const settlementsTogether = realSettlements;
        const recurringCrewsShared = sharedCrews.length;

        let settlementReputation = '100% Instant Settler';
        if (unsettledCount > 0) {
          settlementReputation = `${unsettledCount} ${unsettledCount === 1 ? 'cuenta pendiente' : 'cuentas pendientes'}`;
        } else if (settlementsTogether > 0) {
          settlementReputation = '100% Instant Settler';
        } else {
          settlementReputation = 'Sin deudas pendientes';
        }

        let favoriteGame = "Who's Most Likely";
        if (state.whosMostLikely.length > 0 && state.whosMostLikely.some((q) => Object.keys(q.votes).length > 0)) {
          favoriteGame = "Who's Most Likely";
        } else if (state.thisOrThat.some((t) => t.userVote)) {
          favoriteGame = 'This or That';
        } else if (state.trivia.length > 0) {
          favoriteGame = 'Crew Trivia';
        }

        const totalScore = gatheringsTogether * 4 + gamesPlayedTogether * 2 + settlementsTogether * 3 + recurringCrewsShared * 5;
        let sparkLevel: 'Kindling' | 'Ignited' | 'Soul Crew' | 'Ride or Die' = 'Kindling';
        if (totalScore >= 45) {
          sparkLevel = 'Ride or Die';
        } else if (totalScore >= 20) {
          sparkLevel = 'Soul Crew';
        } else if (totalScore >= 8) {
          sparkLevel = 'Ignited';
        } else {
          sparkLevel = 'Kindling';
        }

        let cleanHandle = targetMember.handle;
        if (!cleanHandle) {
          cleanHandle = `@${targetMember.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        }
        if (!cleanHandle.startsWith('@')) {
          cleanHandle = `@${cleanHandle}`;
        }

        return {
          targetUserId: targetId,
          targetUserName: targetMember.name,
          targetUserHandle: cleanHandle,
          targetUserAvatar: targetMember.avatar,
          gatheringsTogether,
          gamesPlayedTogether,
          settlementsTogether,
          recurringCrewsShared,
          sparkLevel,
          settlementReputation,
          favoriteGame,
          onchainNights: targetMember.nightsTogether,
        };
      },

      syncConnectionOnchain: async (targetMember) => {
        const state = get();
        const partyId = state.currentPartyId || 'party_hackathon_demo';
        const userAAddress = state.currentUser.walletAddress || '';
        const userBAddress = targetMember.walletAddress || '';

        try {
          const receipt = await recordGatheringOnchain(
            partyId,
            [userAAddress, userBAddress],
            {
              userAName: state.currentUser.name,
              userBName: targetMember.name,
              userAId: state.currentUser.id,
              userBId: targetMember.id,
            }
          );

          const updatedNights = receipt.nightsTogether || (targetMember.nightsTogether || 1) + 1;
          set((s) => ({
            parties: s.parties.map((p) => {
              if (p.id !== partyId) return p;
              return {
                ...p,
                members: p.members.map((m) =>
                  m.id === targetMember.id || m.name === targetMember.name
                    ? { ...m, nightsTogether: updatedNights }
                    : m
                ),
              };
            }),
          }));

          if (!demoMode && partyId) {
            get().loadPartyFromSupabase(partyId).catch(() => {});
          }

          return {
            success: true,
            txHash: receipt.txHash,
            blockNumber: receipt.blockNumber,
            explorerUrl: receipt.explorerUrl,
            nightsTogether: updatedNights,
          };
        } catch (err) {
          console.error('Failed to sync connection onchain:', err);
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Error syncing onchain',
          };
        }
      },

      sendPartyCheers: async (targetMember) => {
        const state = get();
        const partyId = state.currentPartyId;
        const newActivity: ActivityItem = {
          id: `act-cheers-${Date.now()}`,
          partyId: partyId || 'party_hackathon_demo',
          type: 'game',
          text: `🥂 ${state.currentUser.name} brindó con ${targetMember.name}!`,
          time: 'Just now',
          avatar: state.currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        };

        set((s) => ({
          activities: [newActivity, ...s.activities],
        }));

        if (!demoMode && partyId) {
          persistActivityToSupabase(newActivity).catch(() => {});
        }
      },

      updateUser: async (updates, authToken) => {
        const state = get();
        const updated = {
          ...state.currentUser,
          ...updates,
        };

        set({ currentUser: updated });

        if (authToken && updated.id) {
          await syncUserDataToDb(updated, authToken);
        } else if (!demoMode && updated.id) {
          await syncUserDataToDb(updated, null).catch((error) =>
            console.warn('User profile changes are not persisted:', error)
          );
        }
      },

      resetUserSession: () => {
        set({
          currentUser: signedOutUser,
          currentView: 'splash',
        });
      },

      hydrateFromSupabase: async () => {
        const [dbParties, dbCrews, dbActivities] = await Promise.all([
          fetchPartiesFromDb(),
          fetchCrewsFromDb(),
          fetchActivitiesFromDb(),
        ]);

        if (dbParties.length > 0) {
          set((s) => ({
            parties: dbParties,
            currentPartyId:
              s.currentPartyId && dbParties.some((p) => p.id === s.currentPartyId)
                ? s.currentPartyId
                : dbParties[0].id,
          }));
        }

        if (dbCrews.length > 0) {
          set((s) => ({
            crews: dbCrews,
            currentCrewId:
              s.currentCrewId && dbCrews.some((c) => c.id === s.currentCrewId)
                ? s.currentCrewId
                : dbCrews[0].id,
          }));
        }

        if (dbActivities.length > 0) {
          set({ activities: dbActivities });
        }
      },

      loadPartyFromSupabase: async (partyId: string) => {
        const details = await fetchPartyDetailsFromDb(partyId);
        if (!details || !details.party) return;

        const [dbPolls, dbGameSessions] = await Promise.all([
          fetchPollsFromDb(partyId),
          fetchGameSessionsFromDb(partyId),
        ]);

        set((s) => ({
          parties: s.parties.some((p) => p.id === partyId)
            ? s.parties.map((p) => (p.id === partyId ? details.party : p))
            : [details.party, ...s.parties],
          currentPartyId: partyId,
          expenses: details.expenses.length > 0 ? details.expenses : s.expenses,
          transactions: details.transactions.length > 0 ? details.transactions : s.transactions,
          tasks: details.tasks.length > 0 ? details.tasks : s.tasks,
          activities: details.activities.length > 0 ? details.activities : s.activities,
          memories: details.memories && details.memories.length > 0 ? details.memories : s.memories,
          polls: dbPolls.length > 0 ? dbPolls : s.polls,
        }));

        // Load game sessions into appropriate game state
        dbGameSessions.forEach((session) => {
          if (session.gameType === 'whos-most-likely' && session.questions.length > 0) {
            set({ whosMostLikely: session.questions });
          } else if (session.gameType === 'this-or-that' && session.questions.length > 0) {
            set({ thisOrThat: session.questions });
          } else if (session.gameType === 'crew-trivia' && session.questions.length > 0) {
            set({ crewTrivia: session.questions });
          }
        });
      },

      listenToActivePartyRealtime: (partyId: string) => {
        const unsubParty = subscribeToPartyRealtime(partyId, () => {
          get().loadPartyFromSupabase(partyId);
        });
        const unsubTasks = subscribeToTasksRealtime(partyId, () => {
          get().loadPartyFromSupabase(partyId);
        });

        return () => {
          unsubParty();
          unsubTasks();
        };
      },

      resetToDefaults: () => {
        set({
          currentUser: signedOutUser,
          parties: [],
          crews: [],
          expenses: [],
          transactions: [],
          tasks: [],
          polls: [],
          activities: [],
          memories: [],
          whosMostLikely: [],
          thisOrThat: [],
          trivia: [],
        });
      },
    }),
    {
      name: 'partylot-storage-v1',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : volatileStorage
      ),
      partialize: (state) => ({
        currentUser: state.currentUser,
        parties: state.parties,
        crews: state.crews,
        currentCrewId: state.currentCrewId,
        expenses: state.expenses,
        transactions: state.transactions,
        tasks: state.tasks,
        polls: state.polls,
        currentPartyId: state.currentPartyId,
        language: state.language,
        theme: state.theme,
        starredUserIds: state.starredUserIds,
        attendedPartyIds: state.attendedPartyIds,
      }),
    }
  )
);

// Hook to hydrate data from Supabase on app mount
export function useHydrateStore() {
  const hydrateFromSupabase = usePartyStore((state) => state.hydrateFromSupabase);
  
  useEffect(() => {
    if (!demoMode) {
      hydrateFromSupabase();
    }
  }, [hydrateFromSupabase]);
}
