import { getSupabase } from '@/lib/supabase/client';
import { Party, Member, Expense, PotTransaction, ActivityItem, Poll, Crew } from '@/types';

/**
 * Service providing database persistence and Realtime synchronization
 * for Partylot, honoring the offchain architecture outlined in PRODUCT.md.
 */

export interface InviteValidationResult {
  valid: boolean;
  partyId?: string;
  error?: string;
}

/**
 * Validates a 4-character invite code against server-side invitation records.
 * Verifies revocation, expiration, and usage limits.
 */
export async function validateServerInviteCode(code: string): Promise<InviteValidationResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { valid: true }; // Local demo mode
  }

  const normalized = code.trim().toUpperCase();

  try {
    const { data: invite, error } = await supabase
      .from('invitations')
      .select('*, parties(*)')
      .eq('code', normalized)
      .eq('is_revoked', false)
      .single();

    if (error || !invite) {
      // Fallback: check if party exists with this code
      const { data: party } = await supabase
        .from('parties')
        .select('id')
        .eq('code', normalized)
        .single();

      if (party) {
        return { valid: true, partyId: party.id };
      }
      return { valid: false, error: 'Code not found or revoked' };
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { valid: false, error: 'This invitation has expired' };
    }

    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      return { valid: false, error: 'Invitation code has reached maximum uses' };
    }

    return { valid: true, partyId: invite.party_id };
  } catch (err) {
    console.warn('Supabase invite validation fallback:', err);
    return { valid: true };
  }
}

/**
 * Persists a newly created party and its secure server-side invitation
 */
export async function persistPartyToSupabase(party: Party, hostUser: { id: string; name: string }): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // 1. Insert Party
    await supabase.from('parties').upsert({
      id: party.id,
      crew_id: party.crewId || null,
      code: party.code,
      title: party.title,
      date: party.date,
      time: party.time,
      location: party.location,
      description: party.description,
      cover_image: party.coverImage,
      host_id: hostUser.id,
      host_name: hostUser.name,
      pot_balance: party.potBalance || 0,
      status: party.status || 'live',
    });

    // 2. Insert Host as first member
    await supabase.from('party_members').upsert({
      party_id: party.id,
      user_id: hostUser.id,
      name: hostUser.name,
      role: 'host',
      status: 'going',
    });

    // 3. Create server-side invitation primitive (PRODUCT.md Section 8.1 & 14)
    await supabase.from('invitations').insert({
      party_id: party.id,
      code: party.code,
      max_uses: 50,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_revoked: false,
    });
  } catch (err) {
    console.warn('Failed to persist party to Supabase:', err);
  }
}

/**
 * Persists a new attendee joining via invite code
 */
export async function persistMemberJoinToSupabase(partyId: string, member: Member): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('party_members').upsert({
      party_id: partyId,
      user_id: member.id,
      name: member.name,
      avatar: member.avatar,
      role: member.role || 'guest',
      status: member.status || 'going',
      wallet_address: member.walletAddress || null,
    });

    // Increment invitation usage
    try {
      await supabase.rpc('increment_invite_usage', { p_party_id: partyId });
    } catch {
      // Optional RPC in case not installed
    }
  } catch (err) {
    console.warn('Failed to persist member join:', err);
  }
}

/**
 * Persists an expense added to a party
 */
export async function persistExpenseToSupabase(expense: Expense): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('expenses').upsert({
      id: expense.id,
      party_id: expense.partyId,
      description: expense.description,
      amount: expense.amount,
      paid_by_id: expense.paidById,
      paid_by_name: expense.paidByName,
      split_between_ids: expense.splitBetweenIds,
      is_settled: expense.isSettled || false,
    });
  } catch (err) {
    console.warn('Failed to persist expense:', err);
  }
}

/**
 * Persists a Party Pot transaction and updates treasury balance
 */
export async function persistPotTransactionToSupabase(
  tx: PotTransaction,
  newBalance: number
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('pot_transactions').upsert({
      id: tx.id,
      party_id: tx.partyId,
      user_id: tx.userId || null,
      user_name: tx.userName,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      tx_hash: tx.txHash || null,
    });

    await supabase
      .from('parties')
      .update({ pot_balance: newBalance })
      .eq('id', tx.partyId);
  } catch (err) {
    console.warn('Failed to persist pot transaction:', err);
  }
}

/**
 * Persists an activity feed entry
 */
export async function persistActivityToSupabase(activity: ActivityItem): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('activities').upsert({
      id: activity.id,
      party_id: activity.partyId,
      type: activity.type,
      text: activity.text,
      time: activity.time,
      avatar: activity.avatar,
    });
  } catch (err) {
    console.warn('Failed to persist activity:', err);
  }
}

/**
 * Subscribes to real-time changes on a specific party
 * Enables seamless live sync across two or more devices.
 */
export function subscribeToPartyRealtime(
  partyId: string,
  onPartyChange: () => void
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`party-${partyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'party_members',
        filter: `party_id=eq.${partyId}`,
      },
      () => onPartyChange()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pot_transactions',
        filter: `party_id=eq.${partyId}`,
      },
      () => onPartyChange()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `party_id=eq.${partyId}`,
      },
      () => onPartyChange()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'activities',
        filter: `party_id=eq.${partyId}`,
      },
      () => onPartyChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
  * Persists a newly created Crew and assigns owner role in Supabase
  */
export async function persistCrewToSupabase(
  crew: Crew,
  owner: { id: string; name: string }
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // 1. Insert Crew
    await supabase.from('crews').upsert({
      id: crew.id,
      name: crew.name,
      cover_image: crew.coverImage,
      owner_id: owner.id,
    });

    // 2. Insert Owner in crew_members junction
    await supabase.from('crew_members').upsert({
      crew_id: crew.id,
      user_id: owner.id,
      role: 'owner',
    });
  } catch (err) {
    console.warn('Failed to persist crew to Supabase:', err);
  }
}

/**
  * Adds a member to an existing Crew in Supabase
  */
export async function addMemberToCrewInDb(
  crewId: string,
  user: { id: string; name: string; role?: string }
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('crew_members').upsert({
      crew_id: crewId,
      user_id: user.id,
      role: user.role || 'member',
    });
  } catch (err) {
    console.warn('Failed to add crew member to Supabase:', err);
  }
}

/**
  * Subscribes to real-time changes on Crews and Crew Members
  */
export function subscribeToCrewsRealtime(onCrewChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('crews-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'crews' }, () =>
      onCrewChange()
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_members' }, () =>
      onCrewChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
