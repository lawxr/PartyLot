import { describe, expect, it } from 'vitest';
import {
  applyVote,
  winners,
  percentages,
  votersCount,
  rank,
  tally,
} from '@/lib/games';
import type { WhosMostLikelyQuestion, ThisOrThatQuestion } from '@/types';
import { usePartyStore } from '@/store/usePartyStore';

describe('games pure voting logic (games-voting)', () => {
  describe('applyVote on WhosMostLikelyQuestion', () => {
    const baseQuestion: WhosMostLikelyQuestion = {
      id: 'wml-test',
      question: 'Who dances on tables?',
      voters: {},
      votes: {},
    };

    it('registers first vote correctly', () => {
      const q1 = applyVote(baseQuestion, 'user-1', 'member-a');
      expect(q1.voters).toEqual({ 'user-1': 'member-a' });
      expect(q1.votes).toEqual({ 'member-a': 1 });
      expect(votersCount(q1)).toBe(1);
    });

    it('is idempotent when same vote is repeated 5 times', () => {
      let q = baseQuestion;
      for (let i = 0; i < 5; i++) {
        q = applyVote(q, 'user-1', 'member-a');
      }
      expect(q.voters).toEqual({ 'user-1': 'member-a' });
      expect(q.votes).toEqual({ 'member-a': 1 });
      expect(votersCount(q)).toBe(1);
    });

    it('decrements old option and increments new option when user switches vote', () => {
      const q1 = applyVote(baseQuestion, 'user-1', 'member-a');
      const q2 = applyVote(q1, 'user-1', 'member-b');
      expect(q2.voters).toEqual({ 'user-1': 'member-b' });
      expect(q2.votes['member-a'] || 0).toBe(0);
      expect(q2.votes['member-b']).toBe(1);
      expect(votersCount(q2)).toBe(1);
    });

    it('records votes from two distinct users without overwriting', () => {
      const q1 = applyVote(baseQuestion, 'user-1', 'member-a');
      const q2 = applyVote(q1, 'user-2', 'member-b');
      expect(q2.voters).toEqual({ 'user-1': 'member-a', 'user-2': 'member-b' });
      expect(q2.votes['member-a']).toBe(1);
      expect(q2.votes['member-b']).toBe(1);
      expect(votersCount(q2)).toBe(2);
    });

    it('preserves legacy votes when question had no voters map', () => {
      const legacyQ: WhosMostLikelyQuestion = {
        id: 'wml-legacy',
        question: 'Legacy question',
        votes: { 'member-a': 3, 'member-b': 2 },
      };

      const q1 = applyVote(legacyQ, 'user-new', 'member-a');
      expect(q1.votes['member-a']).toBe(4);
      expect(q1.votes['member-b']).toBe(2);
      expect(q1.voters).toEqual({ 'user-new': 'member-a' });

      // Switching vote
      const q2 = applyVote(q1, 'user-new', 'member-b');
      expect(q2.votes['member-a']).toBe(3);
      expect(q2.votes['member-b']).toBe(3);
      expect(q2.voters).toEqual({ 'user-new': 'member-b' });
    });
  });

  describe('applyVote on ThisOrThatQuestion', () => {
    const baseThisOrThat: ThisOrThatQuestion = {
      id: 'tot-test',
      optionA: 'BEACH SUNRISE',
      optionB: 'ROOFTOP 4AM',
      votesA: 0,
      votesB: 0,
      voters: {},
    };

    it('registers first vote', () => {
      const q = applyVote(baseThisOrThat, 'user-1', 'A');
      expect(q.voters).toEqual({ 'user-1': 'A' });
      expect(q.votesA).toBe(1);
      expect(q.votesB).toBe(0);
      expect(q.userVote).toBe('A');
    });

    it('is idempotent when tapping same choice 5 times', () => {
      let q = baseThisOrThat;
      for (let i = 0; i < 5; i++) {
        q = applyVote(q, 'user-1', 'A');
      }
      expect(q.votesA).toBe(1);
      expect(q.votesB).toBe(0);
      expect(votersCount(q)).toBe(1);
    });

    it('switches vote from A to B smoothly', () => {
      const q1 = applyVote(baseThisOrThat, 'user-1', 'A');
      const q2 = applyVote(q1, 'user-1', 'B');
      expect(q2.votesA).toBe(0);
      expect(q2.votesB).toBe(1);
      expect(q2.voters).toEqual({ 'user-1': 'B' });
      expect(q2.userVote).toBe('B');
    });

    it('tallies two distinct users', () => {
      const q1 = applyVote(baseThisOrThat, 'user-1', 'A');
      const q2 = applyVote(q1, 'user-2', 'B');
      expect(q2.votesA).toBe(1);
      expect(q2.votesB).toBe(1);
      expect(votersCount(q2)).toBe(2);
      expect(tally(q2)).toEqual({ A: 1, B: 1 });
    });
  });

  describe('winners calculation', () => {
    const members = [
      { id: 'm1', name: 'Alice' },
      { id: 'm2', name: 'Bob' },
      { id: 'm3', name: 'Charlie' },
    ];

    it('returns empty array when nobody voted', () => {
      const result = winners(members, {});
      expect(result).toEqual([]);

      const resultZeroes = winners(members, { m1: 0, m2: 0, m3: 0 });
      expect(resultZeroes).toEqual([]);
    });

    it('returns single winner when one member leads', () => {
      const result = winners(members, { m1: 3, m2: 1, m3: 0 });
      expect(result).toEqual([{ id: 'm1', name: 'Alice' }]);
    });

    it('returns both tied members on a tie of two', () => {
      const result = winners(members, { m1: 4, m2: 4, m3: 1 });
      expect(result).toEqual([
        { id: 'm1', name: 'Alice' },
        { id: 'm2', name: 'Bob' },
      ]);
    });
  });

  describe('rank ordering and stable tie-breaking', () => {
    const members = [
      { id: 'm1', name: 'Charlie' },
      { id: 'm2', name: 'Alice' },
      { id: 'm3', name: 'Bob' },
    ];

    it('orders descending by votes, then alphabetically by name on tie', () => {
      const ranked = rank(members, { m1: 2, m2: 2, m3: 5 });
      expect(ranked.map((m) => m.name)).toEqual(['Bob', 'Alice', 'Charlie']);
    });
  });

  describe('percentages using largest remainder method', () => {
    it('sums to 100 with 3 voters (1, 1, 1)', () => {
      const pcts = percentages([1, 1, 1]);
      const sum = pcts.reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
      expect(pcts).toEqual([34, 33, 33]);
    });

    it('sums to 100 with 7 voters (3, 2, 2)', () => {
      const pcts = percentages([3, 2, 2]);
      const sum = pcts.reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
      expect(pcts).toEqual([43, 29, 28]);
    });

    it('sums to 100 with 7 voters (4, 2, 1)', () => {
      const pcts = percentages([4, 2, 1]);
      const sum = pcts.reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
      expect(pcts).toEqual([57, 29, 14]);
    });

    it('handles zero votes gracefully', () => {
      const pcts = percentages([0, 0]);
      expect(pcts).toEqual([0, 0]);
    });
  });

  describe('store vote idempotency', () => {
    it('leaves votesA === 1 after 5 consecutive voteThisOrThat calls for the same user', () => {
      const store = usePartyStore.getState();
      usePartyStore.setState({
        currentUser: {
          ...store.currentUser,
          id: 'store-tester-user',
          isPrivyAuthenticated: true,
        },
        thisOrThat: [
          {
            id: 'tot-store-test',
            optionA: 'OPTION A',
            optionB: 'OPTION B',
            votesA: 0,
            votesB: 0,
            voters: {},
          },
        ],
      });

      for (let i = 0; i < 5; i++) {
        usePartyStore.getState().voteThisOrThat('tot-store-test', 'A');
      }

      const updatedQ = usePartyStore.getState().thisOrThat.find((q) => q.id === 'tot-store-test');
      expect(updatedQ?.votesA).toBe(1);
      expect(updatedQ?.votesB).toBe(0);
      expect(updatedQ?.voters).toEqual({ 'store-tester-user': 'A' });
      expect(updatedQ?.userVote).toBe('A');
    });
  });
});
