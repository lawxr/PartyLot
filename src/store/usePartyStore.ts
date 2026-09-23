import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
} from '@/types';
import {
  CURRENT_USER,
  INITIAL_MEMBERS,
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
  persistMemberJoinToSupabase,
  persistExpenseToSupabase,
  persistPotTransactionToSupabase,
  persistActivityToSupabase,
  persistCrewToSupabase,
  addMemberToCrewInDb,
} from '@/services/supabaseService';

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
  joinPartyByCode: (code: string) => { success: boolean; party?: Party; message?: string };
  toggleRsvp: (partyId: string) => void;

  // Expense & Split Actions
  addExpense: (params: {
    partyId: string;
    description: string;
    amount: number;
    paidById: string;
    splitBetweenIds: string[];
  }) => void;
  settleAllDebts: (partyId: string) => void;

  // Party Pot Actions
  addToPot: (partyId: string, amount: number, description?: string) => void;
  spendFromPot: (partyId: string, amount: number, description: string) => void;

  // Polls Actions
  votePoll: (pollId: string, optionId: string) => void;
  createPoll: (partyId: string, question: string, options: string[]) => void;

  // Games Actions
  setActiveGame: (gameId: GameId) => void;
  voteWhosMostLikely: (questionId: string, memberId: string) => void;
  voteThisOrThat: (questionId: string, choice: 'A' | 'B') => void;

  // User & Auth Actions
  updateUser: (updates: Partial<User>) => void;
  resetUserSession: () => void;

  // Reset
  resetToDefaults: () => void;
}

export const usePartyStore = create<PartyStoreState>()(
  persist(
    (set, get) => ({
      currentUser: CURRENT_USER,
      currentView: 'splash',
      previousView: null,
      activeTab: 'home',
      parties: INITIAL_PARTIES,
      currentPartyId: 'p-404',
      crews: INITIAL_CREWS,
      currentCrewId: 'c-404',
      expenses: INITIAL_EXPENSES,
      transactions: INITIAL_TRANSACTIONS,
      polls: INITIAL_POLLS,
      activities: INITIAL_ACTIVITIES,
      whosMostLikely: WHOS_MOST_LIKELY_QUESTIONS,
      thisOrThat: THIS_OR_THAT_QUESTIONS,
      trivia: TRIVIA_QUESTIONS,
      activeGameId: 'whos-most-likely',

      setCurrentView: (view) => {
        set((state) => ({
          previousView: state.currentView,
          currentView: view,
        }));
      },

      goBack: () => {
        set((state) => {
          if (state.previousView) {
            return {
              currentView: state.previousView,
              previousView: null,
            };
          }
          return { currentView: 'home' };
        });
      },

      setActiveTab: (tab) => {
        set({
          activeTab: tab,
          currentView: 'home',
        });
      },

      selectParty: (partyId) => {
        set((state) => ({
          currentPartyId: partyId,
          previousView: state.currentView,
          currentView: 'party-detail',
        }));
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

      joinPartyByCode: (code) => {
        const state = get();
        const normalized = code.trim().toUpperCase();
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

          persistMemberJoinToSupabase(matched.id, newMember);
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

      addExpense: ({ partyId, description, amount, paidById, splitBetweenIds }) => {
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
            createdAt: 'Just now',
          };

          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            partyId,
            type: 'expense',
            text: `${payer.name} added expense: "${description}" ($${amount.toFixed(2)})`,
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

      settleAllDebts: (partyId) => {
        set((state) => {
          const party = state.parties.find((p) => p.id === partyId);
          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            partyId,
            type: 'expense',
            text: `All expenses settled up for ${party?.title || 'the party'}! 🎉`,
            time: 'Just now',
            avatar: state.currentUser.avatar,
          };

          return {
            // Keep expenses history but record settlement event
            activities: [newActivity, ...state.activities],
          };
        });
      },

      addToPot: (partyId, amount, description = 'Pot contribution') => {
        set((state) => {
          const newTx: PotTransaction = {
            id: `tx-${Date.now()}`,
            partyId,
            type: 'add',
            amount,
            description,
            userName: state.currentUser.name,
            userAvatar: state.currentUser.avatar,
            timestamp: 'Just now',
          };

          const updatedParties = state.parties.map((p) =>
            p.id === partyId ? { ...p, potBalance: p.potBalance + amount } : p
          );

          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            partyId,
            type: 'pot',
            text: `${state.currentUser.name} added $${amount.toFixed(2)} to the pot`,
            time: 'Just now',
            avatar: state.currentUser.avatar,
          };

          const targetParty = state.parties.find((p) => p.id === partyId);
          const newBal = (targetParty?.potBalance || 0) + amount;
          persistPotTransactionToSupabase(newTx, newBal);
          persistActivityToSupabase(newActivity);

          return {
            parties: updatedParties,
            transactions: [newTx, ...state.transactions],
            activities: [newActivity, ...state.activities],
          };
        });
      },

      spendFromPot: (partyId, amount, description) => {
        set((state) => {
          const newTx: PotTransaction = {
            id: `tx-${Date.now()}`,
            partyId,
            type: 'spend',
            amount,
            description,
            userName: state.currentUser.name,
            userAvatar: state.currentUser.avatar,
            timestamp: 'Just now',
          };

          const updatedParties = state.parties.map((p) =>
            p.id === partyId ? { ...p, potBalance: Math.max(0, p.potBalance - amount) } : p
          );

          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            partyId,
            type: 'pot',
            text: `Spent $${amount.toFixed(2)} from pot for "${description}"`,
            time: 'Just now',
            avatar: state.currentUser.avatar,
          };

          const targetParty = state.parties.find((p) => p.id === partyId);
          const newBal = Math.max(0, (targetParty?.potBalance || 0) - amount);
          persistPotTransactionToSupabase(newTx, newBal);
          persistActivityToSupabase(newActivity);

          return {
            parties: updatedParties,
            transactions: [newTx, ...state.transactions],
            activities: [newActivity, ...state.activities],
          };
        });
      },

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

      updateUser: (updates) => {
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            ...updates,
          },
        }));
      },

      resetUserSession: () => {
        set({
          currentUser: CURRENT_USER,
          currentView: 'splash',
        });
      },

      resetToDefaults: () => {
        set({
          currentUser: CURRENT_USER,
          parties: INITIAL_PARTIES,
          crews: INITIAL_CREWS,
          expenses: INITIAL_EXPENSES,
          transactions: INITIAL_TRANSACTIONS,
          polls: INITIAL_POLLS,
          activities: INITIAL_ACTIVITIES,
          whosMostLikely: WHOS_MOST_LIKELY_QUESTIONS,
          thisOrThat: THIS_OR_THAT_QUESTIONS,
          trivia: TRIVIA_QUESTIONS,
        });
      },
    }),
    {
      name: 'partylot-storage-v1',
      partialize: (state) => ({
        currentUser: state.currentUser,
        parties: state.parties,
        crews: state.crews,
        currentCrewId: state.currentCrewId,
        expenses: state.expenses,
        transactions: state.transactions,
        polls: state.polls,
        currentPartyId: state.currentPartyId,
      }),
    }
  )
);
