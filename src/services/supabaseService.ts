import { getSupabase } from '@/lib/supabase/client';
import { getRandomPastelBanner } from '@/lib/pastelBanners';
import { getClientPrivyToken } from '@/hooks/usePrivySync';
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
  PartyMemory,
  Poll,
} from '@/types';

/**
 * Service providing database persistence and Realtime synchronization
 * for Partylot, honoring the offchain architecture outlined in PRODUCT.md.
 */

export interface InviteValidationResult {
  valid: boolean;
  partyId?: string;
  partyTitle?: string;
  partyLocation?: string;
  error?: string;
}

/**
 * Validates an invite code against server-side invitation records via the API route.
 * Verifies revocation, expiration, and usage limits.
 */
export async function validateServerInviteCode(code: string): Promise<InviteValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, error: 'Invite code cannot be empty.' };
  }

  try {
    const res = await fetch(`/api/invites/validate?code=${encodeURIComponent(normalized)}`);
    const data = await res.json();

    if (!res.ok || !data.valid) {
      return {
        valid: false,
        error: data.error || 'Invite code could not be verified. Check with the host.',
      };
    }

    return {
      valid: true,
      partyId: data.party_id,
      partyTitle: data.party_title,
      partyLocation: data.party_location,
    };
  } catch (err) {
    console.warn('Invite validation fetch failed:', err);
    return { valid: false, error: 'Invite validation service is unreachable. Please try again later.' };
  }
}

/**
 * Atomically validates the invite code and enrolls the authenticated Privy user
 * into the party via the server-side API route.
 */
export async function joinPartyWithInviteCode(
  code: string,
  authToken: string | null
): Promise<{ success: boolean; partyId?: string; party?: Party; error?: string }> {
  if (!authToken) {
    return {
      success: false,
      error: 'Authentication is required to join a party. Please sign in first.',
    };
  }

  const normalized = code.trim().toUpperCase();

  try {
    const res = await fetch('/api/parties/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ inviteCode: normalized }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || data.error || 'The server could not confirm this invite join.',
      };
    }

    // Format the returned database party record to match the frontend Party interface
    const rawParty = data.party;
    const formattedParty: Party = {
      id: rawParty.id,
      crewId: rawParty.crew_id || undefined,
      code: rawParty.code,
      title: rawParty.title,
      date: rawParty.date,
      time: rawParty.time,
      location: rawParty.location,
      description: rawParty.description || '',
      coverImage:
        rawParty.cover_image ||
        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      hostId: rawParty.host_id || 'host',
      hostName: rawParty.host_name || 'Host',
      members: (rawParty.members || []).map((m: Record<string, unknown>) => ({
        id: (m.user_id as string) || (m.id as string),
        name: (m.name as string) || 'Member',
        avatar:
          (m.avatar as string) ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        role: (m.role as 'host' | 'guest') || 'guest',
        status: (m.status as 'going' | 'maybe' | 'invited') || 'going',
        nightsTogether: Number(m.nights_together) || 1,
        walletAddress: (m.wallet_address as string) || undefined,
      })),
      potBalance: Number(rawParty.pot_balance) || 0,
      createdAt: rawParty.created_at || new Date().toISOString(),
      status: (rawParty.status as 'upcoming' | 'live' | 'past') || 'upcoming',
    };

    return {
      success: true,
      partyId: data.party_id,
      party: formattedParty,
    };
  } catch (err) {
    console.warn('Authenticated invite join failed:', err);
    return { success: false, error: 'Joining is unavailable. Please try again later.' };
  }
}

/**
 * Persists a newly created party and its secure server-side invitation
 */
export async function persistPartyToSupabase(
  party: Party,
  hostUser: { id: string; name: string; handle?: string; avatar?: string }
): Promise<void> {
  try {
    const token = await getClientPrivyToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/parties', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: party.id,
        title: party.title,
        date: party.date,
        time: party.time,
        location: party.location,
        description: party.description,
        coverImage: party.coverImage,
        code: party.code,
        crewId: party.crewId,
        hostUser,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Backend party persistence warning:', errData);
    }
  } catch (err) {
    console.warn('Failed to persist party via API:', err);
  }
}

/**
 * Persists an expense added to a party (delegated to features/expenses domain)
 */
export { persistExpenseToSupabase } from '@/features/expenses';

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
 * Persists an activity feed entry via authenticated scoped endpoint
 */
export async function persistActivityToSupabase(activity: ActivityItem): Promise<void> {
  const authToken = await getClientPrivyToken();
  if (!authToken) return;

  try {
    await fetch('/api/activities', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });
  } catch (err) {
    console.warn('Failed to persist activity:', err);
  }
}

/**
 * Persists a new party memory/photo to Supabase via authenticated scoped endpoint
 */
export async function persistPartyMemoryToSupabase(memory: PartyMemory): Promise<void> {
  const authToken = await getClientPrivyToken();
  if (!authToken) return;

  try {
    await fetch('/api/parties/memories', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memory),
    });
  } catch (err) {
    console.warn('Failed to persist party memory:', err);
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
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'party_memories',
        filter: `party_id=eq.${partyId}`,
      },
      () => onPartyChange()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
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
export async function syncUserDataToDb(user: User, authToken?: string | null): Promise<void> {
  const isNewUser = !user.coverImage;
  const coverImageToUse = isNewUser ? getRandomPastelBanner() : user.coverImage;

  if (authToken) {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: user.name,
          handle: user.handle,
          avatar: user.avatar,
          coverImage: coverImageToUse,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to sync user profile via API.');
      }
      return;
    } catch (apiErr) {
      console.warn('API profile sync error:', apiErr);
      throw apiErr;
    }
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('User profile persistence is unavailable because the database is not configured.');
  }

  try {
    const { error } = await supabase.rpc('update_user_profile', {
      p_user_id: user.id,
      p_name: user.name,
      p_handle: user.handle,
      p_avatar: user.avatar || null,
      p_cover_image: coverImageToUse || null,
    });
    if (error) throw error;
  } catch (err) {
    console.warn('Failed to sync user to Supabase:', err);
    throw err;
  }
}

/**
 * Fetches persisted user profile from Supabase
 */
export async function fetchUserProfileFromDb(userId: string): Promise<{
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  walletAddress?: string;
} | null> {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase.rpc('get_user_profile', {
      p_user_id: userId,
    });
    if (error) {
      console.warn('Could not fetch user profile from Supabase:', error);
      return null;
    }
    return data || null;
  } catch (err) {
    console.warn('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Fetches all parties from Supabase with their associated members
 */
export async function fetchPartiesFromDb(userId?: string): Promise<Party[]> {
  // Keep the legacy argument for callers, but never trust it for authorization.
  void userId;
  const authToken = await getClientPrivyToken();
  if (!authToken) return [];

  try {
    const response = await fetch('/api/parties/read', {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const { parties: partiesData } = await response.json();
    if (!Array.isArray(partiesData)) return [];

    const membersByParty: Record<string, Member[]> = {};
    partiesData.forEach((party) => {
      membersByParty[party.id] = (party.members || []).map((m: Record<string, unknown>) => {
        const memberId = String(m.user_id || m.id || '');
        return {
          id: memberId,
          name: String(m.name || 'Member'),
          avatar: String(m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
          role: (m.role as 'host' | 'guest') || 'guest',
          status: (m.status as 'going' | 'maybe' | 'invited') || 'going',
          nightsTogether: Number(m.nights_together) || 1,
          walletAddress: (m.wallet_address as string) || undefined,
          handle: (m.handle as string) || undefined,
        };
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
  } catch {
    return [];
  }
}

/**
 * Fetches all details, expenses, pot transactions, tasks and activities for a specific party
 */
export async function fetchPartyDetailsFromDb(partyId: string) {
  const authToken = await getClientPrivyToken();
  if (!authToken) return null;

  try {
    const response = await fetch(`/api/parties/details?partyId=${encodeURIComponent(partyId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || !data.party) return null;



    const members: Member[] = (data.members || []).map((m: Record<string, unknown>) => ({
      id: String(m.user_id || m.id || ''),
      name: String(m.name || 'Member'),
      avatar: String(m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
      role: (m.role as 'host' | 'guest') || 'guest',
      status: (m.status as 'going' | 'maybe' | 'invited') || 'going',
      nightsTogether: Number(m.nights_together) || 1,
      walletAddress: (m.wallet_address as string) || undefined,
      handle: (m.handle as string) || undefined,
    }));

    const expenses: Expense[] = (data.expenses || []).map((e: Record<string, unknown>) => ({
      id: String(e.id),
      partyId: String(e.party_id),
      description: String(e.description),
      amount: Number(e.amount),
      paidById: String(e.paid_by_id || 'u-unknown'),
      paidByName: String(e.paid_by_name || 'Member'),
      paidByAvatar: String(e.paid_by_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
      splitBetweenIds: Array.isArray(e.split_between_ids) ? e.split_between_ids : [],
      category: 'general',
      isSettled: Boolean(e.is_settled),
      createdAt: String(e.created_at || ''),
      txHash: e.tx_hash ? String(e.tx_hash) : undefined,
    }));

    const transactions: PotTransaction[] = (data.transactions || []).map((t: Record<string, unknown>) => ({
      id: String(t.id),
      partyId: String(t.party_id),
      userId: t.user_id ? String(t.user_id) : undefined,
      userName: String(t.user_name || 'Member'),
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      type: (t.type === 'deposit'
        ? 'add'
        : t.type === 'reimbursement'
        ? 'spend'
        : t.type) as 'add' | 'spend' | 'reward' | 'rollover',
      amount: Number(t.amount),
      description: String(t.description || ''),
      timestamp: String(t.created_at || ''),
      txHash: t.tx_hash ? String(t.tx_hash) : undefined,
    }));

    const tasks: PartyTask[] = (data.tasks || []).map((tk: Record<string, unknown>) => ({
      id: String(tk.id),
      partyId: String(tk.party_id),
      title: String(tk.title),
      rewardAmount: Number(tk.reward_amount),
      status: (tk.status as 'open' | 'claimed' | 'completed' | 'verified') || 'open',
      claimedById: tk.claimed_by_id ? String(tk.claimed_by_id) : undefined,
      claimedByName: tk.claimed_by_name ? String(tk.claimed_by_name) : undefined,
      claimedByAvatar: tk.claimed_by_avatar ? String(tk.claimed_by_avatar) : undefined,
      completedAt: tk.completed_at ? String(tk.completed_at) : undefined,
      createdAt: String(tk.created_at || 'Just now'),
    }));

    const activities: ActivityItem[] = (data.activities || []).map((a: Record<string, unknown>) => ({
      id: String(a.id),
      partyId: String(a.party_id),
      type: (a.type === 'deposit' ? 'pot' : a.type) as 'join' | 'pot' | 'poll' | 'game' | 'expense',
      text: String(a.text || a.details || ''),
      time: String(a.time || a.timestamp || ''),
      avatar: a.avatar ? String(a.avatar) : undefined,
    }));

    const memories: PartyMemory[] = (data.memories || []).map((m: Record<string, unknown>) => ({
      id: String(m.id),
      partyId: String(m.party_id),
      imageUrl: String(m.image_url),
      caption: m.caption ? String(m.caption) : undefined,
      uploadedById: m.uploaded_by_id ? String(m.uploaded_by_id) : undefined,
      uploadedByName: String(m.uploaded_by_name || 'Anonymous'),
      uploadedByAvatar: m.uploaded_by_avatar ? String(m.uploaded_by_avatar) : undefined,
      createdAt: String(m.created_at),
    }));

    const p = data.party;
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

    return { party, members, expenses, transactions, tasks, activities, memories };
  } catch (err) {
    console.warn('Failed to fetch party details from server:', err);
    return null;
  }
}

/**
 * Fetches Crews and their members from Supabase
 */
export async function fetchCrewsFromDb(userId?: string): Promise<Crew[]> {
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

    const filteredCrews = userId
      ? crewsData.filter(
          (c) => c.owner_id === userId || (membersByCrew[c.id] || []).some((m) => m.userId === userId)
        )
      : crewsData;

    return filteredCrews.map((c) => ({
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

/**
 * Fetches activities via scoped server API
 */
export async function fetchActivitiesFromDb(partyId?: string): Promise<ActivityItem[]> {
  const authToken = await getClientPrivyToken();
  if (!authToken) return [];

  try {
    const url = partyId ? `/api/activities?partyId=${encodeURIComponent(partyId)}` : '/api/activities';
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data.activities)) return [];

    return data.activities.map((a: Record<string, unknown>) => ({
      id: String(a.id),
      partyId: String(a.party_id),
      type: (a.type === 'deposit' ? 'pot' : a.type) as 'join' | 'pot' | 'poll' | 'game' | 'expense',
      text: String(a.text || a.details || ''),
      time: String(a.time || a.timestamp || ''),
      avatar: a.avatar ? String(a.avatar) : undefined,
    }));
  } catch (err) {
    console.warn('Failed to fetch activities from server:', err);
    return [];
  }
}

export interface GameSessionRecord {
  id: string;
  partyId: string;
  gameType: string;
  questions: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetches polls for a party from Supabase
 */
export async function fetchPollsFromDb(partyId: string): Promise<Poll[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('party_id', partyId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((p) => ({
      id: p.id,
      partyId: p.party_id,
      question: p.question,
      options: p.options || [],
      totalVotes: (p.options || []).reduce((acc: number, opt: { votes?: number }) => acc + (opt.votes || 0), 0),
      createdAt: p.created_at,
    }));
  } catch (err) {
    console.warn('Failed to fetch polls from Supabase:', err);
    return [];
  }
}

/**
 * Persists a poll to Supabase
 */
export async function persistPollToSupabase(poll: Poll): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('polls').upsert({
      id: poll.id,
      party_id: poll.partyId,
      question: poll.question,
      options: poll.options,
      created_by_id: null,
    });
  } catch (err) {
    console.warn('Failed to persist poll to Supabase:', err);
  }
}

/**
 * Fetches game sessions for a party from Supabase
 */
export async function fetchGameSessionsFromDb(
  partyId: string,
  gameType?: string
): Promise<GameSessionRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('game_sessions')
      .select('*')
      .eq('party_id', partyId)
      .order('created_at', { ascending: false });

    if (gameType) {
      query = query.eq('game_type', gameType);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((g) => ({
      id: g.id,
      partyId: g.party_id,
      gameType: g.game_type,
      questions: g.questions,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    }));
  } catch (err) {
    console.warn('Failed to fetch game sessions from Supabase:', err);
    return [];
  }
}

/**
 * Persists a game session to Supabase via authenticated scoped API
 */
export async function persistGameSessionToSupabase(session: {
  id: string;
  partyId: string;
  gameType: string;
  questions?: unknown;
}): Promise<void> {
  const authToken = await getClientPrivyToken();
  if (!authToken) return;

  try {
    await fetch('/api/parties/games', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(session),
    });
  } catch (err) {
    console.warn('Failed to persist game session via API:', err);
  }
}
