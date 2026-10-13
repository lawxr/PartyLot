import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';
import { getServerSupabase } from '@/lib/supabase/server';
import { applyVote } from '@/lib/games';
import { WHOS_MOST_LIKELY_QUESTIONS, THIS_OR_THAT_QUESTIONS } from '@/data/mockData';
import type { WhosMostLikelyQuestion, ThisOrThatQuestion } from '@/types';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    return json({ error: 'Authentication is required.' }, 401);
  }

  let actorId: string;
  try {
    const profile = await verifyPrivyToken(match[1]);
    actorId = profile.userId;
    if (!actorId) return json({ error: 'Authentication is required.' }, 401);
  } catch {
    return json({ error: 'Authentication is required.' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const { id, partyId, gameType, questionId, choice, questions } = body;
  if (!partyId || !gameType) {
    return json({ error: 'Missing required partyId or gameType.' }, 400);
  }

  try {
    const supabase = getServerSupabase();

    // Verify actor is host or member of party
    const [partyRes, memberRes] = await Promise.all([
      supabase.from('parties').select('host_id').eq('id', partyId).single(),
      supabase.from('party_members').select('user_id').eq('party_id', partyId).eq('user_id', actorId),
    ]);

    const isHost = partyRes.data?.host_id === actorId;
    const isMember = (memberRes.data || []).length > 0;
    if (!isHost && !isMember) {
      return json({ error: 'Forbidden: only party members can modify game sessions.' }, 403);
    }

    const normalizedGameType = String(gameType);
    const sessionId = id
      ? String(id)
      : `gs-${partyId}-${normalizedGameType === 'whos-most-likely' ? 'wml' : normalizedGameType === 'this-or-that' ? 'tot' : 'trivia'}`;

    // Voting flow for Who's Most Likely and This Or That:
    // Disallow arbitrary client questions arrays with votes to prevent vote stuffing and state overwrite.
    // Actor identity is strictly bound to the verified Privy token.
    if (normalizedGameType === 'whos-most-likely' || normalizedGameType === 'this-or-that') {
      if (questionId) {
        if (typeof questionId !== 'string' || choice === undefined || choice === null) {
          return json({ error: 'Missing questionId or choice for game vote.' }, 400);
        }

        if (normalizedGameType === 'this-or-that' && choice !== 'A' && choice !== 'B') {
          return json({ error: "Invalid choice for this-or-that; expected 'A' or 'B'." }, 400);
        }

        // Read current game session from Supabase
        const existingSessionRes = await supabase
          .from('game_sessions')
          .select('*')
          .eq('party_id', partyId)
          .eq('game_type', normalizedGameType)
          .maybeSingle();

        let currentQuestions: Array<WhosMostLikelyQuestion | ThisOrThatQuestion> = [];
        if (
          existingSessionRes.data?.questions &&
          Array.isArray(existingSessionRes.data.questions) &&
          existingSessionRes.data.questions.length > 0
        ) {
          currentQuestions = existingSessionRes.data.questions;
        } else {
          currentQuestions =
            normalizedGameType === 'whos-most-likely'
              ? [...WHOS_MOST_LIKELY_QUESTIONS]
              : [...THIS_OR_THAT_QUESTIONS];
        }

        const targetIndex = currentQuestions.findIndex((q) => q.id === questionId);
        if (targetIndex === -1) {
          return json({ error: 'Target question not found.' }, 404);
        }

        const targetQuestion = currentQuestions[targetIndex];
        let updatedQuestion: WhosMostLikelyQuestion | ThisOrThatQuestion;

        if (normalizedGameType === 'this-or-that') {
          updatedQuestion = applyVote(targetQuestion as ThisOrThatQuestion, actorId, choice as 'A' | 'B');
        } else {
          updatedQuestion = applyVote(targetQuestion as WhosMostLikelyQuestion, actorId, String(choice));
        }

        const updatedQuestions = [...currentQuestions];
        updatedQuestions[targetIndex] = updatedQuestion;

        const payload = {
          id: sessionId,
          party_id: String(partyId),
          game_type: normalizedGameType,
          questions: updatedQuestions,
          updated_at: new Date().toISOString(),
        };

        const result = await supabase.from('game_sessions').upsert(payload);
        if (result.error) {
          return json({ error: 'Failed to persist game session.' }, 503);
        }

        return json({ success: true, session: payload, question: updatedQuestion }, 200);
      }

      // Session initialization without votes
      if (Array.isArray(questions)) {
        const hasVotes = (questions as Array<Record<string, unknown>>).some(
          (q) =>
            (q.votes && typeof q.votes === 'object' && Object.keys(q.votes).length > 0) ||
            Number(q.votesA) > 0 ||
            Number(q.votesB) > 0 ||
            (q.voters && typeof q.voters === 'object' && Object.keys(q.voters).length > 0)
        );

        if (hasVotes) {
          return json(
            { error: 'Cannot overwrite game vote counts directly. Vote via questionId and choice.' },
            400
          );
        }

        const payload = {
          id: sessionId,
          party_id: String(partyId),
          game_type: normalizedGameType,
          questions,
          updated_at: new Date().toISOString(),
        };

        const result = await supabase.from('game_sessions').upsert(payload);
        if (result.error) {
          return json({ error: 'Failed to persist game session.' }, 503);
        }

        return json({ success: true, session: payload }, 200);
      }

      return json({ error: 'Missing questionId or choice for game vote.' }, 400);
    }

    // Legacy fallback for crew-trivia (full session sync until trivia votes are hardened)
    const payload = {
      id: sessionId,
      party_id: String(partyId),
      game_type: normalizedGameType,
      questions: questions || [],
      updated_at: new Date().toISOString(),
    };

    const result = await supabase.from('game_sessions').upsert(payload);
    if (result.error) {
      return json({ error: 'Failed to persist game session.' }, 503);
    }

    return json({ success: true, session: payload }, 200);
  } catch {
    return json({ error: 'Failed to persist game session.' }, 503);
  }
}
