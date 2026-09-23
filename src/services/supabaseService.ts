import { getSupabase } from '@/lib/supabase/client';
import {
  Party,
  Member,
  Expense,
  PotTransaction,
  ActivityItem,
  Crew,
  PartyTask,
  User,
  CrewMember,
} from '@/types';

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
    return { valid: false, error: 'Invite validation is unavailable because the database is not configured.' };
  }

  const normalized = code.trim().toUpperCase();

  try {
    const { data: invite, error } = await supabase
      .from('invitations')
      .select('party_id, expires_at, max_uses, used_count, is_revoked')
      .eq('code', normalized)
      .eq('is_revoked', false)
      .single();

    if (error || !invite) {
      return { valid: false, error: 'Invite code could not be verified. Check with the host or try again later.' };
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { valid: false, error: 'This invitation has expired' };
    }

    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      return { valid: false, error: 'Invitation code has reached maximum uses' };
    }

    return { valid: true, partyId: invite.party_id };
  } catch (err) {
    console.warn('Supabase invite validation failed:', err);
    return { valid: false, error: 'Invite validation is unavailable. Please try again later.' };
  }
}

/**
 * The server must atomically validate the invite and create membership using
 * its authenticated identity mapping. No client-provided user identity is sent.
 */
export async function joinPartyWithInviteCode(code: string): Promise<{ success: boolean; partyId?: string; error?: string }> {
  const validation = await validateServerInviteCode(code);
  if (!validation.valid || !validation.partyId) {
    return { success: false, error: validation.error || 'Invite code could not be verified.' };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Joining is unavailable because the database is not configured.' };
  }

  try {
    const { data, error } = await supabase.rpc('join_party_with_invite', {
      p_code: code.trim().toUpperCase(),
    });
    if (error || !data) {
      console.warn('Authenticated invite join RPC unavailable:', error);
      return { success: false, error: 'Joining is unavailable until the server-side authenticated invite service is configured.' };
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result || result.party_id !== validation.partyId || result.joined !== true) {
      return { success: false, error: 'The server could not confirm this invite join.' };
    }

    return { success: true, partyId: result.party_id };
  } catch (err) {
    console.warn('Authenticated invite join failed:', err);
    return { success: false, error: 'Joining is unavailable. Please try again later.' };
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
      category: expense.category || 'general',
      is_settled: expense.isSettled || false,
      tx_hash: expense.txHash || null,
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
 * Persists an onchain debt settlement in Supabase
 */
export async function persistSettlementToSupabase(
  partyId: string,
  txHash: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase
      .from('expenses')
      .update({ is_settled: true, tx_hash: txHash || null })
      .eq('party_id', partyId);
  } catch (err) {
    console.warn('Failed to persist settlement in Supabase:', err);
  }
}

/**
 * Persists a Party Pot rollover to Crew Treasury
 */
export async function persistPotRolloverToSupabase(
  tx: PotTransaction,
  partyId: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('pot_transactions').upsert({
      id: tx.id,
      party_id: partyId,
      user_id: tx.userId || null,
      user_name: tx.userName,
      type: 'rollover',
      amount: tx.amount,
      description: tx.description,
      tx_hash: tx.txHash || null,
    });

    await supabase
      .from('parties')
      .update({ pot_balance: 0 })
      .eq('id', partyId);
  } catch (err) {
    console.warn('Failed to persist pot rollover in Supabase:', err);
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
  owner?: { id: string; name: string }
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // 1. Insert or update Crew
    await supabase.from('crews').upsert({
      id: crew.id,
      name: crew.name,
      cover_image: crew.coverImage,
      owner_id: owner?.id || crew.members.find((m) => m.role === 'owner')?.id || null,
      treasury_balance: crew.treasuryBalance ?? 0,
    });

    // 2. Insert Owner in crew_members junction if provided
    if (owner) {
      await supabase.from('crew_members').upsert({
        crew_id: crew.id,
        user_id: owner.id,
        role: 'owner',
      });
    }
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

/**
 * Persists a new Party Task / Bounty to Supabase
 */
export async function persistTaskToSupabase(task: PartyTask): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('tasks').upsert({
      id: task.id,
      party_id: task.partyId,
      title: task.title,
      reward_amount: task.rewardAmount,
      status: task.status,
      claimed_by_id: task.claimedById || null,
      claimed_by_name: task.claimedByName || null,
      claimed_by_avatar: task.claimedByAvatar || null,
      completed_at: task.completedAt || null,
    });
  } catch (err) {
    console.warn('Failed to persist task to Supabase:', err);
  }
}

/**
 * Updates an existing Party Task in Supabase
 */
export async function updateTaskInSupabase(task: PartyTask): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase
      .from('tasks')
      .update({
        status: task.status,
        claimed_by_id: task.claimedById || null,
        claimed_by_name: task.claimedByName || null,
        claimed_by_avatar: task.claimedByAvatar || null,
        completed_at: task.completedAt || null,
      })
      .eq('id', task.id);
  } catch (err) {
    console.warn('Failed to update task in Supabase:', err);
  }
}

/**
 * Subscribes to real-time changes on Tasks/Bounties for a specific Party
 */
export function subscribeToTasksRealtime(partyId: string, onTaskChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`tasks-${partyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `party_id=eq.${partyId}`,
      },
      () => onTaskChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Persists or updates user profile in Supabase
 */
export async function syncUserDataToDb(user: User): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('User profile persistence is unavailable because the database is not configured.');
  }

  try {
    await supabase.from('users').upsert({
      id: user.id,
      name: user.name,
      handle: user.handle,
      avatar: user.avatar,
      wallet_address: user.walletAddress || null,
      email: user.email || null,
      gatherings_count: user.gatheringsCount || 0,
      games_count: user.gamesCount || 0,
      people_count: user.peopleCount || 0,
      settlements_count: user.settlementsCount || 0,
      balance: user.balance || 0,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to sync user to Supabase:', err);
    throw err;
  }
}

/**
 * Fetches all parties from Supabase with their associated members
 */
export async function fetchPartiesFromDb(): Promise<Party[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data: partiesData, error: partiesErr } = await supabase
      .from('parties')
      .select('*')
      .order('created_at', { ascending: false });

    if (partiesErr || !partiesData) return [];

    const { data: membersData } = await supabase
      .from('party_members')
      .select('*');

    const membersByParty: Record<string, Member[]> = {};
    (membersData || []).forEach((m) => {
      if (!membersByParty[m.party_id]) {
        membersByParty[m.party_id] = [];
      }
      membersByParty[m.party_id].push({
        id: m.user_id,
        name: m.name,
        avatar: m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        role: m.role as 'host' | 'guest',
        status: m.status as 'going' | 'maybe' | 'invited',
        nightsTogether: m.nights_together || 1,
        walletAddress: m.wallet_address || undefined,
      });
    });

    return partiesData.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      date: p.date,
      time: p.time,
      location: p.location,
      description: p.description || '',
      coverImage: p.cover_image || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      hostId: p.host_id || 'u-host',
      hostName: p.host_name || 'Host',
      potBalance: Number(p.pot_balance) || 0,
      status: (p.status as 'upcoming' | 'live' | 'past') || 'upcoming',
      createdAt: p.created_at,
      crewId: p.crew_id || undefined,
      members: membersByParty[p.id] || [],
    }));
  } catch (err) {
    console.warn('Failed to fetch parties from Supabase:', err);
    return [];
  }
}

/**
 * Fetches all details, expenses, pot transactions, tasks and activities for a specific party
 */
export async function fetchPartyDetailsFromDb(partyId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const [partyRes, membersRes, expensesRes, transactionsRes, tasksRes, activitiesRes] = await Promise.all([
      supabase.from('parties').select('*').eq('id', partyId).single(),
      supabase.from('party_members').select('*').eq('party_id', partyId),
      supabase.from('expenses').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
      supabase.from('pot_transactions').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
    ]);

    if (!partyRes.data) return null;

    const members: Member[] = (membersRes.data || []).map((m) => ({
      id: m.user_id,
      name: m.name,
      avatar: m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      role: m.role as 'host' | 'guest',
      status: m.status as 'going' | 'maybe' | 'invited',
      nightsTogether: m.nights_together || 1,
      walletAddress: m.wallet_address || undefined,
    }));

    const expenses: Expense[] = (expensesRes.data || []).map((e) => ({
      id: e.id,
      partyId: e.party_id,
      description: e.description,
      amount: Number(e.amount),
      paidById: e.paid_by_id || 'u-unknown',
      paidByName: e.paid_by_name,
      paidByAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      splitBetweenIds: Array.isArray(e.split_between_ids) ? e.split_between_ids : [],
      category: 'general',
      isSettled: e.is_settled ?? false,
      createdAt: e.created_at,
      txHash: e.tx_hash || undefined,
    }));

    const transactions: PotTransaction[] = (transactionsRes.data || []).map((t) => ({
      id: t.id,
      partyId: t.party_id,
      userId: t.user_id || undefined,
      userName: t.user_name,
      userAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      type: (t.type === 'deposit'
        ? 'add'
        : t.type === 'reimbursement'
        ? 'spend'
        : t.type) as 'add' | 'spend' | 'reward' | 'rollover',
      amount: Number(t.amount),
      description: t.description || '',
      timestamp: t.created_at,
      txHash: t.tx_hash || undefined,
    }));

    const tasks: PartyTask[] = (tasksRes.data || []).map((tk) => ({
      id: tk.id,
      partyId: tk.party_id,
      title: tk.title,
      rewardAmount: Number(tk.reward_amount),
      status: tk.status as 'open' | 'claimed' | 'completed' | 'verified',
      claimedById: tk.claimed_by_id || undefined,
      claimedByName: tk.claimed_by_name || undefined,
      claimedByAvatar: tk.claimed_by_avatar || undefined,
      completedAt: tk.completed_at || undefined,
      createdAt: tk.created_at || 'Just now',
    }));

    const activities: ActivityItem[] = (activitiesRes.data || []).map((a) => ({
      id: a.id,
      partyId: a.party_id,
      type: (a.type === 'deposit' ? 'pot' : a.type) as 'join' | 'pot' | 'poll' | 'game' | 'expense',
      text: a.text,
      time: a.time,
      avatar: a.avatar || undefined,
    }));

    const p = partyRes.data;
    const party: Party = {
      id: p.id,
      code: p.code,
      title: p.title,
      date: p.date,
      time: p.time,
      location: p.location,
      description: p.description || '',
      coverImage: p.cover_image || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      hostId: p.host_id || 'u-host',
      hostName: p.host_name || 'Host',
      potBalance: Number(p.pot_balance) || 0,
      status: (p.status as 'upcoming' | 'live' | 'past') || 'upcoming',
      createdAt: p.created_at,
      crewId: p.crew_id || undefined,
      members,
    };

    return { party, members, expenses, transactions, tasks, activities };
  } catch (err) {
    console.warn('Failed to fetch party details from Supabase:', err);
    return null;
  }
}

/**
 * Fetches Crews and their members from Supabase
 */
export async function fetchCrewsFromDb(): Promise<Crew[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data: crewsData, error: crewsErr } = await supabase
      .from('crews')
      .select('*')
      .order('created_at', { ascending: false });

    if (crewsErr || !crewsData) return [];

    const { data: crewMembersData } = await supabase
      .from('crew_members')
      .select('*, users(*)');

    const membersByCrew: Record<string, CrewMember[]> = {};
    (crewMembersData || []).forEach((cm) => {
      if (!membersByCrew[cm.crew_id]) {
        membersByCrew[cm.crew_id] = [];
      }
      const u = cm.users;
      membersByCrew[cm.crew_id].push({
        id: cm.id,
        userId: cm.user_id,
        name: u?.name || 'Member',
        handle: u?.handle || '@member',
        avatar: u?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        role: cm.role as 'owner' | 'admin' | 'member',
        joinedAt: cm.joined_at,
        walletAddress: u?.wallet_address || undefined,
        nightsTogether: u?.gatherings_count || 1,
      });
    });

    return crewsData.map((c) => ({
      id: c.id,
      name: c.name,
      coverImage: c.cover_image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
      ownerId: c.owner_id || undefined,
      membersCount: (membersByCrew[c.id] || []).length || 1,
      members: membersByCrew[c.id] || [],
      partiesCount: 1,
      totalSpent: 0,
      nightsTogether: 1,
      topGame: "Who's Most Likely",
      treasuryBalance: Number(c.treasury_balance) || 0,
      memories: [],
      lastActivity: 'Active',
      createdAt: c.created_at,
    }));
  } catch (err) {
    console.warn('Failed to fetch crews from Supabase:', err);
    return [];
  }
}
