import type { ThisOrThatQuestion, WhosMostLikelyQuestion } from '@/types';

/**
 * Standard palette for minigame celebration confetti
 */
export const GAME_CONFETTI_COLORS = ['#F0DC00', '#FFF8E6', '#FF7A3D', '#171512'] as const;

function isThisOrThatQuestion(
  question: WhosMostLikelyQuestion | ThisOrThatQuestion
): question is ThisOrThatQuestion {
  return 'optionA' in question;
}

/**
 * Derives votes map for WhosMostLikely from voters, preserving any legacy counts baseline.
 */
function deriveWhosMostLikelyVotes(
  question: WhosMostLikelyQuestion,
  newVoters: Record<string, string>
): Record<string, number> {
  const oldVoters = question.voters ?? {};
  const oldVotersCounts: Record<string, number> = {};
  for (const choice of Object.values(oldVoters)) {
    oldVotersCounts[choice] = (oldVotersCounts[choice] || 0) + 1;
  }

  // Preserve legacy baseline that wasn't tied to known voters
  const legacyBase: Record<string, number> = {};
  for (const [memberId, count] of Object.entries(question.votes || {})) {
    const legacy = Math.max(0, count - (oldVotersCounts[memberId] || 0));
    if (legacy > 0) {
      legacyBase[memberId] = legacy;
    }
  }

  const finalVotes: Record<string, number> = { ...legacyBase };
  for (const memberId of Object.values(newVoters)) {
    finalVotes[memberId] = (finalVotes[memberId] || 0) + 1;
  }

  return finalVotes;
}

/**
 * Derives votesA / votesB for ThisOrThat from voters, preserving any legacy counts baseline.
 */
function deriveThisOrThatVotes(
  question: ThisOrThatQuestion,
  newVoters: Record<string, 'A' | 'B'>
): { votesA: number; votesB: number } {
  const oldVoters = question.voters ?? {};
  let oldA = 0;
  let oldB = 0;
  for (const choice of Object.values(oldVoters)) {
    if (choice === 'A') oldA++;
    else if (choice === 'B') oldB++;
  }

  const legacyBaseA = Math.max(0, (question.votesA || 0) - oldA);
  const legacyBaseB = Math.max(0, (question.votesB || 0) - oldB);

  let countA = 0;
  let countB = 0;
  for (const choice of Object.values(newVoters)) {
    if (choice === 'A') countA++;
    else if (choice === 'B') countB++;
  }

  return {
    votesA: legacyBaseA + countA,
    votesB: legacyBaseB + countB,
  };
}

/**
 * Idempotently applies a vote by a unique user to a question.
 * If the user already cast this exact vote, returns the question as-is.
 * If the user changes their vote, the old vote is removed and the new one applied.
 */
export function applyVote(
  question: WhosMostLikelyQuestion,
  userId: string,
  choice: string
): WhosMostLikelyQuestion;
export function applyVote(
  question: ThisOrThatQuestion,
  userId: string,
  choice: 'A' | 'B'
): ThisOrThatQuestion;
export function applyVote(
  question: WhosMostLikelyQuestion | ThisOrThatQuestion,
  userId: string,
  choice: string
): WhosMostLikelyQuestion | ThisOrThatQuestion {
  if (isThisOrThatQuestion(question)) {
    if (choice !== 'A' && choice !== 'B') {
      return question;
    }
    const currentVoters = question.voters ?? {};
    if (currentVoters[userId] === choice) {
      return question; // Idempotent: same vote already registered
    }

    const nextVoters: Record<string, 'A' | 'B'> = {
      ...currentVoters,
      [userId]: choice as 'A' | 'B',
    };
    const { votesA, votesB } = deriveThisOrThatVotes(question, nextVoters);

    return {
      ...question,
      voters: nextVoters,
      votesA,
      votesB,
      userVote: choice as 'A' | 'B',
    };
  }

  // WhosMostLikelyQuestion
  const currentVoters = question.voters ?? {};
  if (currentVoters[userId] === choice) {
    return question; // Idempotent
  }

  const nextVoters: Record<string, string> = {
    ...currentVoters,
    [userId]: choice,
  };
  const votes = deriveWhosMostLikelyVotes(question, nextVoters);

  return {
    ...question,
    voters: nextVoters,
    votes,
  };
}

/**
 * Returns tallies per choice for a question.
 */
export function tally(question: WhosMostLikelyQuestion): Record<string, number>;
export function tally(question: ThisOrThatQuestion): { A: number; B: number };
export function tally(
  question: WhosMostLikelyQuestion | ThisOrThatQuestion
): Record<string, number> | { A: number; B: number } {
  if (isThisOrThatQuestion(question)) {
    return {
      A: question.votesA || 0,
      B: question.votesB || 0,
    };
  }
  return { ...(question.votes || {}) };
}

/**
 * Total unique voters count for a question.
 */
export function votersCount(question: WhosMostLikelyQuestion | ThisOrThatQuestion): number {
  if (question.voters && Object.keys(question.voters).length > 0) {
    return Object.keys(question.voters).length;
  }
  if (isThisOrThatQuestion(question)) {
    return (question.votesA || 0) + (question.votesB || 0);
  }
  return Object.values(question.votes || {}).reduce((sum, count) => sum + Math.max(0, count), 0);
}

/**
 * Sorts members descending by vote count, using stable alphabetical tie-breaking by member name.
 */
export function rank<T extends { id: string; name: string }>(
  members: T[],
  votes: Record<string, number>
): T[] {
  return [...members].sort((a, b) => {
    const diff = (votes[b.id] || 0) - (votes[a.id] || 0);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Returns all winners (tied for the highest vote count).
 * If nobody received any votes, returns an empty array.
 */
export function winners<T extends { id: string; name?: string }>(
  members: T[],
  votes: Record<string, number>
): T[] {
  const topVotes = Math.max(0, ...Object.values(votes));
  if (topVotes === 0) return [];
  return members.filter((m) => (votes[m.id] || 0) === topVotes);
}

/**
 * Calculates whole percentages that sum to 100 using the Largest Remainder Method (Hamilton method).
 * If total votes is 0, returns zeroes.
 */
function calculatePercentagesArray(counts: number[]): number[] {
  const total = counts.reduce((acc, c) => acc + Math.max(0, c), 0);
  if (total === 0) {
    return counts.map(() => 0);
  }

  const raw = counts.map((c) => (Math.max(0, c) * 100) / total);
  const floors = raw.map(Math.floor);
  const remainders = raw.map((r, i) => ({ index: i, remainder: r - floors[i] }));
  const currentSum = floors.reduce((acc, f) => acc + f, 0);
  const diff = 100 - currentSum;

  // Sort descending by remainder; stable tie-break by index
  remainders.sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  const result = [...floors];
  for (let i = 0; i < diff && i < remainders.length; i++) {
    result[remainders[i].index]++;
  }

  return result;
}

export function percentages(counts: number[]): number[];
export function percentages(counts: Record<string, number>): Record<string, number>;
export function percentages(
  counts: number[] | Record<string, number>
): number[] | Record<string, number> {
  if (Array.isArray(counts)) {
    return calculatePercentagesArray(counts);
  }

  const keys = Object.keys(counts);
  const values = keys.map((k) => counts[k] || 0);
  const pcts = calculatePercentagesArray(values);

  const result: Record<string, number> = {};
  keys.forEach((key, index) => {
    result[key] = pcts[index];
  });
  return result;
}

/**
 * Recomputes and validates question tallies from its voters dictionary.
 */
export function recalculateWhosMostLikely(question: WhosMostLikelyQuestion): WhosMostLikelyQuestion {
  const voters = question.voters ?? {};
  const votes = deriveWhosMostLikelyVotes(question, voters);
  return {
    ...question,
    voters,
    votes,
  };
}

export function recalculateThisOrThat(
  question: ThisOrThatQuestion,
  currentUserId?: string
): ThisOrThatQuestion {
  const voters = question.voters ?? {};
  const { votesA, votesB } = deriveThisOrThatVotes(question, voters);
  const userVote = currentUserId ? voters[currentUserId] : question.userVote;
  return {
    ...question,
    voters,
    votesA,
    votesB,
    userVote,
  };
}
