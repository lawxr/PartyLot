import { describe, it, expect } from 'vitest';

describe("Who's Most Likely Ranking & Winner Resolution (Phase 1)", () => {
  interface Friend {
    id: string;
    name: string;
  }

  const friends: Friend[] = [
    { id: 'f1', name: 'Sofia' },
    { id: 'f2', name: 'Mateo' },
    { id: 'f3', name: 'Valen' },
    { id: 'f4', name: 'Lucas' },
  ];

  it('ranks friends descending by vote counts correctly', () => {
    const votes: Record<string, number> = {
      f1: 5,
      f2: 9,
      f3: 2,
      f4: 1,
    };

    const ranked = [...friends].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));

    expect(ranked[0].id).toBe('f2');
    expect(ranked[1].id).toBe('f1');
    expect(ranked[2].id).toBe('f3');
    expect(ranked[3].id).toBe('f4');
  });

  it('identifies single clear winner', () => {
    const votes: Record<string, number> = {
      f1: 3,
      f2: 8,
      f3: 2,
    };

    const topVoteCount = Math.max(...Object.values(votes));
    const winners = friends.filter((f) => (votes[f.id] || 0) === topVoteCount);

    expect(winners).toHaveLength(1);
    expect(winners[0].id).toBe('f2');
  });

  it('identifies tie between top contenders gracefully', () => {
    const votes: Record<string, number> = {
      f1: 6,
      f2: 6,
      f3: 2,
      f4: 1,
    };

    const topVoteCount = Math.max(...Object.values(votes));
    const winners = friends.filter((f) => (votes[f.id] || 0) === topVoteCount);

    expect(winners).toHaveLength(2);
    expect(winners.map((w) => w.name)).toEqual(['Sofia', 'Mateo']);
  });

  it('calculates correct percentages across total votes', () => {
    const votes: Record<string, number> = {
      f1: 5,
      f2: 15,
    };
    const total = 20;

    const pctF1 = Math.round((votes.f1 / total) * 100);
    const pctF2 = Math.round((votes.f2 / total) * 100);

    expect(pctF1).toBe(25);
    expect(pctF2).toBe(75);
  });
});
