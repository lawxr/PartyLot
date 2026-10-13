'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Camera, Check, Loader2, LogOut, RefreshCw, Share2, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Avatar } from '@/components/ui/Avatar';
import { usePartyStore, type AdminActionResult } from '@/store/usePartyStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { uploadImageFile } from '@/services/storageService';
import { fetchCandidatesRemote, type PartyCandidate, type PartyEditableFields } from '@/services/partyAdmin';
import { LIMITS } from '@/lib/partyAdmin';
import type { Party } from '@/types';

interface PartyManageSheetProps {
  party: Party;
  isOpen: boolean;
  onClose: () => void;
  onShareInvite: () => void;
}

type Tab = 'details' | 'people' | 'more';

const inputClass =
  'w-full rounded-2xl bg-surface border border-divider px-4 py-3 text-[15px] text-primary placeholder:text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-party-yellow';
const labelClass = 'block text-[13px] font-semibold text-secondary mb-1.5';
const primaryBtn =
  'w-full min-h-12 rounded-full bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const ghostBtn =
  'min-h-11 px-4 rounded-full border border-divider bg-surface text-primary font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50';

export const PartyManageSheet: React.FC<PartyManageSheetProps> = ({ party, isOpen, onClose, onShareInvite }) => {
  const { t } = useTranslation();
  const a = t.partyAdmin;
  const showToast = useToastStore((s) => s.showToast);
  const { currentUser, updatePartyDetails, removePartyMember, addPartyMember, rotatePartyCode, deleteParty, leaveParty } =
    usePartyStore();

  const isHost = Boolean(currentUser?.id && party.hostId === currentUser.id);
  const [tab, setTab] = useState<Tab>(isHost ? 'details' : 'more');

  // ── details form ────────────────────────────────────────────────────────
  const initial = useMemo(
    () => ({
      title: party.title || '',
      date: party.date || '',
      time: party.time || '',
      location: party.location || '',
      description: party.description || '',
      coverImage: party.coverImage || '',
    }),
    [party.title, party.date, party.time, party.location, party.description, party.coverImage],
  );
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const changed = (Object.keys(form) as (keyof typeof form)[]).filter((k) => form[k].trim() !== initial[k].trim());
  const missing = (['title', 'date', 'time', 'location'] as const).filter((k) => !form[k].trim());

  const errorText = (res: AdminActionResult) => {
    switch (res.code) {
      case 'AUTH_REQUIRED':
        return a.errorAuth;
      case 'FORBIDDEN':
        return a.errorForbidden;
      case 'POT_NOT_EMPTY':
        return a.potNotEmpty;
      case 'NETWORK_ERROR':
        return a.errorNetwork;
      default:
        return res.message && res.code === 'INVALID' ? res.message : a.errorGeneric;
    }
  };

  const save = async () => {
    if (!changed.length) {
      showToast(a.nothingChanged, 'info');
      return;
    }
    if (missing.length) return;
    setSaving(true);
    const updates = Object.fromEntries(changed.map((k) => [k, form[k]])) as PartyEditableFields;
    const res = await updatePartyDetails(party.id, updates);
    setSaving(false);
    showToast(res.success ? a.saved : errorText(res), res.success ? 'success' : 'error');
  };

  const onPickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file, 'parties');
      setForm((f) => ({ ...f, coverImage: url }));
    } catch {
      showToast(a.errorGeneric, 'error');
    } finally {
      setUploading(false);
    }
  };

  // ── people ──────────────────────────────────────────────────────────────
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<PartyCandidate[] | null>(null);
  const [candidatesError, setCandidatesError] = useState(false);

  const loadCandidates = () => {
    setCandidates(null);
    setCandidatesError(false);
    fetchCandidatesRemote(party.id).then((res) => {
      if (res.success) setCandidates(res.data?.candidates || []);
      else setCandidatesError(true);
    });
  };

  const remove = async (userId: string) => {
    setBusyId(userId);
    const res = await removePartyMember(party.id, userId);
    setBusyId(null);
    setConfirmRemove(null);
    showToast(res.success ? a.removed : errorText(res), res.success ? 'success' : 'error');
  };

  const add = async (c: PartyCandidate) => {
    setBusyId(c.id);
    const res = await addPartyMember(party.id, c.id);
    setBusyId(null);
    if (res.success) setCandidates((list) => (list || []).filter((x) => x.id !== c.id));
    showToast(res.success ? a.added : errorText(res), res.success ? 'success' : 'error');
  };

  // ── more ────────────────────────────────────────────────────────────────
  const [confirmCode, setConfirmCode] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [working, setWorking] = useState(false);

  const newCode = async () => {
    setWorking(true);
    const res = await rotatePartyCode(party.id);
    setWorking(false);
    setConfirmCode(false);
    showToast(res.success ? `${a.newCodeDone}: ${res.code}` : errorText(res), res.success ? 'success' : 'error');
  };

  const remove_party = async () => {
    setWorking(true);
    const res = await deleteParty(party.id);
    setWorking(false);
    if (res.success) {
      showToast(a.deleted, 'success');
      onClose();
    } else {
      showToast(errorText(res), 'error');
    }
  };

  const leave = async () => {
    setWorking(true);
    const res = await leaveParty(party.id);
    setWorking(false);
    if (res.success) {
      showToast(a.left, 'success');
      onClose();
    } else {
      showToast(errorText(res), 'error');
    }
  };

  const tabs: { id: Tab; label: string }[] = isHost
    ? [
        { id: 'details', label: a.tabDetails },
        { id: 'people', label: a.tabPeople },
        { id: 'more', label: a.tabMore },
      ]
    : [];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={isHost ? a.manageTitle : a.partyOptions}>
      <div className="px-5 pb-8 pt-1 text-primary">
        {isHost && (
          <div role="tablist" aria-label={a.manageTitle} className="flex gap-1 p-1 rounded-full bg-surface-muted border border-divider mb-5">
            {tabs.map((x) => (
              <button
                key={x.id}
                role="tab"
                type="button"
                aria-selected={tab === x.id}
                onClick={() => {
                  setTab(x.id);
                  if (x.id === 'people' && candidates === null) loadCandidates();
                }}
                className={`flex-1 min-h-10 rounded-full text-sm font-bold transition-colors ${
                  tab === x.id ? 'bg-party-yellow text-on-party-yellow' : 'text-secondary hover:text-primary'
                }`}
              >
                {x.label}
              </button>
            ))}
          </div>
        )}

        {/* ── DETAILS ── */}
        {isHost && tab === 'details' && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div>
              <span className={labelClass}>{a.cover}</span>
              <div className="relative h-40 rounded-3xl overflow-hidden bg-surface-muted border border-divider">
                {form.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-3 right-3 min-h-10 px-4 rounded-full bg-black/60 text-white text-sm font-semibold flex items-center gap-2 backdrop-blur-sm disabled:opacity-70"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {uploading ? a.uploading : a.changePhoto}
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={onPickCover} />
              </div>
            </div>

            {(
              [
                ['title', a.name, 'text'],
                ['location', a.location, 'text'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label htmlFor={`pm-${key}`} className={labelClass}>
                  {label}
                </label>
                <input
                  id={`pm-${key}`}
                  className={inputClass}
                  value={form[key]}
                  maxLength={LIMITS[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  aria-invalid={missing.includes(key)}
                />
                {missing.includes(key) && <p className="mt-1 text-xs font-semibold text-[#B4441F]">{a.requiredField}</p>}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['date', a.date],
                  ['time', a.time],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label htmlFor={`pm-${key}`} className={labelClass}>
                    {label}
                  </label>
                  <input
                    id={`pm-${key}`}
                    className={inputClass}
                    value={form[key]}
                    maxLength={LIMITS[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    aria-invalid={missing.includes(key)}
                  />
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="pm-description" className={labelClass}>
                {a.description}
              </label>
              <textarea
                id="pm-description"
                rows={3}
                className={`${inputClass} resize-none`}
                value={form.description}
                maxLength={LIMITS.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <button type="submit" className={primaryBtn} disabled={saving || uploading || !changed.length || missing.length > 0}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? a.saving : a.save}
            </button>
          </form>
        )}

        {/* ── PEOPLE ── */}
        {isHost && tab === 'people' && (
          <div className="space-y-6">
            <ul className="divide-y divide-divider" aria-label={a.tabPeople}>
              {party.members.map((m) => {
                const isMe = m.id === currentUser?.id;
                const isPartyHost = m.id === party.hostId || m.role === 'host';
                return (
                  <li key={m.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={{ avatar: m.avatar, name: m.name }} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] truncate">
                          {m.name}
                          {isMe ? ` · ${a.you}` : ''}
                        </p>
                        <p className="text-xs text-secondary">
                          {isPartyHost ? a.host : m.status === 'invited' ? a.invited : a.going}
                        </p>
                      </div>
                      {!isPartyHost && !isMe && confirmRemove !== m.id && (
                        <button type="button" className={ghostBtn} onClick={() => setConfirmRemove(m.id)} aria-label={`${a.remove} ${m.name}`}>
                          <UserMinus className="w-4 h-4" />
                          {a.remove}
                        </button>
                      )}
                    </div>
                    {confirmRemove === m.id && (
                      <div className="mt-3 rounded-2xl bg-surface-muted border border-divider p-3">
                        <p className="text-sm font-semibold">{a.removeConfirm}</p>
                        <p className="text-xs text-secondary mt-1">{a.removeHint}</p>
                        <div className="flex gap-2 mt-3">
                          <button type="button" className={`${ghostBtn} flex-1`} onClick={() => setConfirmRemove(null)}>
                            {a.cancel}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === m.id}
                            onClick={() => remove(m.id)}
                            className="flex-1 min-h-11 rounded-full bg-primary text-bg-primary font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {busyId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                            {a.remove}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <section aria-labelledby="pm-add">
              <h3 id="pm-add" className="font-display font-bold text-lg">
                {a.addPeople}
              </h3>
              <p className="text-xs text-secondary mb-3">{a.addFromYourPeople}</p>
              {candidates === null && !candidatesError && (
                <div className="py-6 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                </div>
              )}
              {candidatesError && <p className="text-sm text-secondary py-2">{a.errorGeneric}</p>}
              {candidates && candidates.length === 0 && <p className="text-sm text-secondary py-2">{a.noCandidates}</p>}
              {candidates && candidates.length > 0 && (
                <ul className="divide-y divide-divider">
                  {candidates.map((c) => (
                    <li key={c.id} className="py-3 flex items-center gap-3">
                      <Avatar user={{ avatar: c.avatar, name: c.name }} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] truncate">{c.name}</p>
                        {c.handle && <p className="text-xs text-secondary truncate">@{c.handle}</p>}
                      </div>
                      <button type="button" className={ghostBtn} disabled={busyId === c.id} onClick={() => add(c)} aria-label={`${a.add} ${c.name}`}>
                        {busyId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {a.add}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className={`${ghostBtn} w-full mt-3`}
                onClick={() => {
                  onClose();
                  onShareInvite();
                }}
              >
                <Share2 className="w-4 h-4" />
                {a.shareInvite}
              </button>
            </section>
          </div>
        )}

        {/* ── MORE ── */}
        {tab === 'more' && (
          <div className="space-y-5">
            <button
              type="button"
              className={`${ghostBtn} w-full`}
              onClick={() => {
                onClose();
                onShareInvite();
              }}
            >
              <Share2 className="w-4 h-4" />
              {a.shareInvite}
            </button>

            {isHost && (
              <section className="rounded-3xl border border-divider bg-surface p-4">
                <p className="text-[13px] font-semibold text-secondary">{a.inviteCode}</p>
                <p className="font-mono text-2xl font-bold tracking-[0.2em] mt-1">{party.code}</p>
                {!confirmCode ? (
                  <button type="button" className={`${ghostBtn} w-full mt-3`} onClick={() => setConfirmCode(true)}>
                    <RefreshCw className="w-4 h-4" />
                    {a.newCode}
                  </button>
                ) : (
                  <div className="mt-3">
                    <p className="text-xs text-secondary">{a.newCodeHint}</p>
                    <div className="flex gap-2 mt-2">
                      <button type="button" className={`${ghostBtn} flex-1`} onClick={() => setConfirmCode(false)}>
                        {a.cancel}
                      </button>
                      <button type="button" className={`${primaryBtn} flex-1`} disabled={working} onClick={newCode}>
                        {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {a.confirm}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {isHost ? (
              <section className="rounded-3xl border border-[#B4441F]/30 bg-[#B4441F]/[0.06] p-4" aria-labelledby="pm-delete">
                <h3 id="pm-delete" className="font-bold text-[15px] text-[#B4441F] flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  {a.deleteParty}
                </h3>
                <p className="text-xs text-secondary mt-1">{a.deleteHint}</p>
                <label htmlFor="pm-delete-confirm" className={`${labelClass} mt-3`}>
                  {a.deleteConfirmLabel}: <span className="text-primary">{party.title}</span>
                </label>
                <input
                  id="pm-delete-confirm"
                  className={inputClass}
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  disabled={working || deleteText.trim() !== party.title.trim()}
                  onClick={remove_party}
                  className="w-full min-h-12 mt-3 rounded-full bg-[#B4441F] text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {a.deleteConfirmButton}
                </button>
              </section>
            ) : !confirmLeave ? (
              <button type="button" className={`${ghostBtn} w-full`} onClick={() => setConfirmLeave(true)}>
                <LogOut className="w-4 h-4" />
                {a.leaveParty}
              </button>
            ) : (
              <div className="rounded-2xl bg-surface-muted border border-divider p-3">
                <p className="text-sm font-semibold">{a.leaveConfirm}</p>
                <div className="flex gap-2 mt-3">
                  <button type="button" className={`${ghostBtn} flex-1`} onClick={() => setConfirmLeave(false)}>
                    {a.cancel}
                  </button>
                  <button
                    type="button"
                    disabled={working}
                    onClick={leave}
                    className="flex-1 min-h-11 rounded-full bg-primary text-bg-primary font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    {a.leaveParty}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
