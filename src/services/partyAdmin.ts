import { getClientPrivyToken } from '@/hooks/usePrivySync';
import type { Member } from '@/types';

export type PartyEditableFields = Partial<{
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  coverImage: string;
}>;

export interface AdminResult<T = Record<string, unknown>> {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
}

export interface PartyCandidate {
  id: string;
  name: string;
  handle?: string;
  avatar: string;
}

async function call<T>(method: string, url: string, body?: unknown): Promise<AdminResult<T>> {
  const token = await getClientPrivyToken();
  if (!token) return { success: false, status: 401, message: 'AUTH_REQUIRED' };
  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
    return { success: res.ok, status: res.status, message: data.message || data.error, data };
  } catch {
    return { success: false, status: 0, message: 'NETWORK_ERROR' };
  }
}

export const updatePartyRemote = (partyId: string, updates: PartyEditableFields) =>
  call('PATCH', '/api/parties/manage', { partyId, updates });

export const deletePartyRemote = (partyId: string) =>
  call('DELETE', `/api/parties/manage?partyId=${encodeURIComponent(partyId)}`);

export const removeMemberRemote = (partyId: string, userId: string) =>
  call('POST', '/api/parties/manage', { partyId, action: 'remove', userId });

export const addMemberRemote = (partyId: string, userId: string) =>
  call<{ member?: Member }>('POST', '/api/parties/manage', { partyId, action: 'add', userId });

export const leavePartyRemote = (partyId: string) => call('POST', '/api/parties/manage', { partyId, action: 'leave' });

export const rotateCodeRemote = (partyId: string) =>
  call<{ code?: string }>('POST', '/api/parties/manage', { partyId, action: 'rotate-code' });

export const fetchCandidatesRemote = (partyId: string) =>
  call<{ candidates?: PartyCandidate[] }>('GET', `/api/parties/manage?partyId=${encodeURIComponent(partyId)}`);
