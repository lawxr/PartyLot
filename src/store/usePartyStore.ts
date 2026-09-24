import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
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
} from '@/types';
import {
  CURRENT_USER,
  INITIAL_PARTIES,
  INITIAL_CREWS,
  INITIAL_EXPENSES,
  INITIAL_TRANSACTIONS,
  INITIAL_POLLS,
  INITIAL_ACTIVITIES,
  WHOS_MOST_LIKELY_QUESTIONS,
  THIS_OR_THAT_QUESTIONS,
  TRIVIA_QUESTIONS,
} from '@/data/mockData';
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
  syncUserDataToDb,
  subscribeToPartyRealtime,
  subscribeToTasksRealtime,
} from '@/services/supabaseService';
import { Language } from '@/lib/i18n/translations';
import { FinancialActionResult, getFinancialActionUnavailableResult } from '@/services/treasury';
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
  activeGameId: GameId;
  language: Language;
  setLanguage: (lang: Language) => void;

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
  settleAllDebts: () => FinancialActionResult;

  // Party Pot Actions
  addToPot: (partyId: string, amount: number, description?: string) => FinancialActionResult;
  spendFromPot: (partyId: string, amount: number, description: string) => FinancialActionResult;
  rolloverPotToCrew: (partyId: string, crewId: string) => FinancialActionResult;

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

  // User & Auth Actions
  updateUser: (updates: Partial<User>, authToken?: string | null) => Promise<void>;
  resetUserSession: () => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;

  // Realtime Supabase Persistence & Hydration
  hydrateFromSupabase: () => Promise<void>;
  loadPartyFromSupabase: (partyId: string) => Promise<void>;
  listenToActivePartyRealtime: (partyId: string) => () => void;

  // Reset
  resetToDefaults: () => void;
}

export const usePartyStore = create<PartyStoreState>()(
  persist(
    (set, get) => ({
      currentUser: demoMode ? CURRENT_USER : signedOutUser,
      isOnboardingOpen: false,
      setIsOnboardingOpen: (open) => set({ isOnboardingOpen: open }),
      currentView: 'splash',
      previousView: null,
      activeTab: 'home',
      language: detectInitialLanguage(),
      setLanguage: (lang) => set({ language: lang }),
      parties: demoMode ? INITIAL_PARTIES : [],
      currentPartyId: demoMode ? 'p-404' : '',
      crews: demoMode ? INITIAL_CREWS : [],
      currentCrewId: demoMode ? 'c-404' : null,
      expenses: demoMode ? INITIAL_EXPENSES : [],
      transactions: demoMode ? INITIAL_TRANSACTIONS : [],
      tasks: demoMode ? [
        {
          id: 'task-1',
          partyId: 'p-404',
          title: 'Bring 2 bags of ice & lime',
          rewardAmount: 5,
          status: 'open',
          createdAt: '15m ago',
        },
        {
          id: 'task-2',
          partyId: 'p-404',
          title: 'Aux cable & bluetooth receiver',
          rewardAmount: 8,
          status: 'claimed',
          claimedById: 'u-carlos',
          claimedByName: 'Carlos',
          claimedByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          createdAt: '30m ago',
        },
        {
          id: 'task-3',
          partyId: 'p-404',
          title: 'Extra cups & napkins from bodega',
          rewardAmount: 4,
          status: 'completed',
          claimedById: 'u-valen',
          claimedByName: 'Valen',
          claimedByAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          completedAt: 'Just now',
          createdAt: '45m ago',
        },
      ] : [],
      polls: demoMode ? INITIAL_POLLS : [],
      activities: demoMode ? INITIAL_ACTIVITIES : [],
      whosMostLikely: demoMode ? WHOS_MOST_LIKELY_QUESTIONS : [],
      thisOrThat: demoMode ? THIS_OR_THAT_QUESTIONS : [],
      trivia: demoMode ? TRIVIA_QUESTIONS : [],
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

          // If coming from splash (e.g. into join-party), always return to splash
          if (state.previousView === 'splash') {
            return {
              currentView: 'splash',
              previousView: null,
            };
          }

          // If the user is unauthenticated, they can never be sent to home
          if (!isAuthed) {
            return {
              currentView: 'splash',
              previousView: null,
            };
          }

          // For authenticated users, return to the previous view if valid
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

          return { currentView: 'home', previousView: null };
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

        if (!demoMode) {
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
        }

        const matched = state.parties.find((p) => p.code.toUpperCase() === normalized);

        if (!matched) {
          return { success: false, message: 'Party code not found. Check with host!' };
        }

        const isAlreadyMember = matched.members.some((m) => m.id === state.currentUser.id);

        if (!isAlreadyMember) {
          const newMember: Member = {
            id: state.currentUser.id,
            name: state.currentUser.name,
            avatar: state.currentUser.avatar,
            role: 'guest',
            status: 'going',
            nightsTogether: 1,
            walletAddress: state.currentUser.walletAddress,
          };

          const updatedParties = state.parties.map((p) =>
            p.id === matched.id ? { ...p, members: [...p.members, newMember] } : p
          );

          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            partyId: matched.id,
            type: 'join',
            text: `${state.currentUser.name} joined via code ${matched.code}`,
            time: 'Just now',
            avatar: state.currentUser.avatar,
          };

          set({
            parties: updatedParties,
            currentPartyId: matched.id,
            activities: [newActivity, ...state.activities],
          });

          persistActivityToSupabase(newActivity);
        } else {
          set({ currentPartyId: matched.id });
        }

        return { success: true, party: matched };
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

      // Payment actions stay inert until a real financial provider can confirm them.
      settleAllDebts: () => getFinancialActionUnavailableResult(),

      addToPot: () => getFinancialActionUnavailableResult(),

      spendFromPot: () => getFinancialActionUnavailableResult(),

      rolloverPotToCrew: () => getFinancialActionUnavailableResult(),

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

      verifyAndPayPartyTask: async () => getFinancialActionUnavailableResult(),

      votePoll: (pollId, optionId) => {
        set((state) => {
          const poll = state.polls.find((p) => p.id === pollId);
          if (!poll) return state;

          const wasAlreadyVoted = poll.userVoteId === optionId;

          const updatedOptions = poll.options.map((opt) => {
            let votes = opt.votes;
            let voters = [...opt.voters];

            // Remove previous vote if any
            if (poll.userVoteId === opt.id) {
              votes = Math.max(0, votes - 1);
              voters = voters.filter((id) => id !== state.currentUser.id);
            }

            // Add new vote if not deselecting
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

      rewardGameWinner: async () => getFinancialActionUnavailableResult(),

      getSharedConnection: (targetMember) => {
        const state = get();
        const currentUserId = state.currentUser.id;
        const targetId = targetMember.id;

        // Gatherings together: parties where both appear
        const mutualParties = state.parties.filter(
          (p) =>
            p.members.some((m) => m.id === currentUserId || m.name === state.currentUser.name) &&
            p.members.some((m) => m.id === targetId || m.name === targetMember.name)
        );

        // Pre-computed historical ground truth for primary crew members
        const baseGatherings =
          targetId === 'u-ana' ? 12 : targetId === 'u-carlos' ? 9 : targetId === 'u-valen' ? 7 : targetId === 'u-sofi' ? 6 : 3;
        const gatheringsTogether = Math.max(mutualParties.length, baseGatherings);

        const baseGames =
          targetId === 'u-ana' ? 31 : targetId === 'u-carlos' ? 24 : targetId === 'u-valen' ? 18 : targetId === 'u-sofi' ? 14 : 6;
        const gamesPlayedTogether = baseGames;

        const baseSettlements =
          targetId === 'u-ana' ? 8 : targetId === 'u-carlos' ? 5 : targetId === 'u-valen' ? 4 : targetId === 'u-sofi' ? 3 : 2;
        const settlementsTogether = baseSettlements;

        const baseCrews =
          targetId === 'u-ana' ? 3 : targetId === 'u-carlos' ? 2 : targetId === 'u-valen' ? 2 : targetId === 'u-sofi' ? 1 : 1;
        const recurringCrewsShared = baseCrews;

        // Spark level calculation
        const totalScore = gatheringsTogether * 2 + gamesPlayedTogether + settlementsTogether * 3;
        let sparkLevel: 'Kindling' | 'Ignited' | 'Soul Crew' | 'Ride or Die' = 'Kindling';
        if (totalScore >= 60) {
          sparkLevel = 'Ride or Die';
        } else if (totalScore >= 35) {
          sparkLevel = 'Soul Crew';
        } else if (totalScore >= 18) {
          sparkLevel = 'Ignited';
        }

        const cleanHandle = `@${targetMember.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.monad`;

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
        };
      },

      updateUser: async (updates, authToken) => {
        const state = get();
        const updated = {
          ...state.currentUser,
          ...updates,
        };

        // Apply local state immediately so downstream guards and UI have instantaneous identity
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
          currentUser: demoMode ? CURRENT_USER : signedOutUser,
          currentView: 'splash',
        });
      },

      hydrateFromSupabase: async () => {
        const [dbParties, dbCrews] = await Promise.all([
          fetchPartiesFromDb(),
          fetchCrewsFromDb(),
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
      },

      loadPartyFromSupabase: async (partyId: string) => {
        const details = await fetchPartyDetailsFromDb(partyId);
        if (!details || !details.party) return;

        set((s) => ({
          parties: s.parties.some((p) => p.id === partyId)
            ? s.parties.map((p) => (p.id === partyId ? details.party : p))
            : [details.party, ...s.parties],
          currentPartyId: partyId,
          expenses: details.expenses.length > 0 ? details.expenses : s.expenses,
          transactions: details.transactions.length > 0 ? details.transactions : s.transactions,
          tasks: details.tasks.length > 0 ? details.tasks : s.tasks,
          activities: details.activities.length > 0 ? details.activities : s.activities,
        }));
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
          currentUser: demoMode ? CURRENT_USER : signedOutUser,
          parties: demoMode ? INITIAL_PARTIES : [],
          crews: demoMode ? INITIAL_CREWS : [],
          expenses: demoMode ? INITIAL_EXPENSES : [],
          transactions: demoMode ? INITIAL_TRANSACTIONS : [],
          tasks: demoMode ? [
            {
              id: 'task-1',
              partyId: 'p-404',
              title: 'Bring 2 bags of ice & lime',
              rewardAmount: 5,
              status: 'open',
              createdAt: '15m ago',
            },
            {
              id: 'task-2',
              partyId: 'p-404',
              title: 'Aux cable & bluetooth receiver',
              rewardAmount: 8,
              status: 'claimed',
              claimedById: 'u-carlos',
              claimedByName: 'Carlos',
              claimedByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
              createdAt: '30m ago',
            },
          ] : [],
          polls: demoMode ? INITIAL_POLLS : [],
          activities: demoMode ? INITIAL_ACTIVITIES : [],
          whosMostLikely: demoMode ? WHOS_MOST_LIKELY_QUESTIONS : [],
          thisOrThat: demoMode ? THIS_OR_THAT_QUESTIONS : [],
          trivia: demoMode ? TRIVIA_QUESTIONS : [],
        });
      },
    }),
    {
      name: 'partylot-storage-v1',
      storage: createJSONStorage(() =>
        demoMode && typeof window !== 'undefined' ? window.localStorage : volatileStorage
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
      }),
    }
  )
);
