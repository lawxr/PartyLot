'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Calendar,
  Camera,
  Coins,
  Plus,
  Share2,
  Check,
  Flame,
  Award,
  MapPin,
  PartyPopper,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { uploadImageFile } from '@/services/storageService';
import { Member } from '@/types';
import { SharedExperienceModal } from '@/components/ui/SharedExperienceModal';

export const CrewDetailView: React.FC = () => {
  const {
    currentCrewId,
    crews,
    parties,
    setCurrentView,
    selectParty,
    addCrewMember,
    addCrewMemory,
  } = usePartyStore();

  const [activeSubTab, setActiveSubTab] = useState<'gatherings' | 'members' | 'memories'>('gatherings');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberHandle, setNewMemberHandle] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Add memory modal state
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [memoryUrl, setMemoryUrl] = useState('');
  const [memoryCaption, setMemoryCaption] = useState('');
  const [isUploadingMemory, setIsUploadingMemory] = useState(false);
  const [memoryUploadError, setMemoryUploadError] = useState<string | null>(null);
  const memoryFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleMemoryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMemory(true);
    setMemoryUploadError(null);
    try {
      const url = await uploadImageFile(file, 'crew-memories');
      setMemoryUrl(url);
    } catch (err) {
      console.error('Failed to upload memory photo:', err);
      setMemoryUploadError(err instanceof Error ? err.message : 'Error al subir la foto.');
    } finally {
      setIsUploadingMemory(false);
      if (memoryFileInputRef.current) memoryFileInputRef.current.value = '';
    }
  };

  const crew = crews.find((c) => c.id === currentCrewId) || crews[0];
  const crewParties = parties.filter((p) => p.crewId === crew?.id);

  if (!crew) {
    return (
      <div className="min-h-screen bg-[#F7F2E8] text-[#171512] flex items-center justify-center">
        <p className="text-[#6F6A62]">Crew not found</p>
      </div>
    );
  }

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText?.(window.location.origin + `?crew=${crew.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    addCrewMember(crew.id, {
      name: newMemberName.trim(),
      handle: newMemberHandle.trim() ? `@${newMemberHandle.replace('@', '')}` : `@${newMemberName.toLowerCase().replace(/\s+/g, '')}`,
      role: 'member',
      avatar: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 5000000)}?auto=format&fit=crop&w=400&q=80`,
    });

    setNewMemberName('');
    setNewMemberHandle('');
    setIsInviteOpen(false);
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryUrl.trim() || !memoryCaption.trim()) return;

    addCrewMemory(crew.id, {
      imageUrl: memoryUrl.trim(),
      caption: memoryCaption.trim(),
      partyTitle: crewParties[0]?.title || crew.name,
    });

    setMemoryUrl('');
    setMemoryCaption('');
    setIsMemoryOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#171512] pb-32 pt-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto safe-top select-none w-full">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between py-3 mb-4">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#6F6A62] hover:text-[#171512] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <GlassButton
            variant="glass"
            size="sm"
            onClick={handleCopyInvite}
            icon={copiedLink ? <Check className="w-4 h-4 text-[#B89600]" /> : <Share2 className="w-4 h-4 text-[#171512]" />}
          >
            {copiedLink ? 'Link Copied!' : 'Share Invite'}
          </GlassButton>

          <GlassButton
            variant="accent"
            size="sm"
            onClick={() => setCurrentView('create-party')}
            icon={<Plus className="w-4 h-4 text-[#171512] stroke-[3]" />}
          >
            Host Gathering
          </GlassButton>
        </div>
      </div>

      {/* Hero Cover Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-black/5 h-72 sm:h-96 mb-8 group shadow-[0_8px_30px_rgba(40,30,20,0.06)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={crew.coverImage}
          alt={crew.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-mono font-bold text-[#171512] shadow-sm">
              {crew.membersCount} ACTIVE MEMBERS
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs text-white">
              {crewParties.length} Gatherings Hosted
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs text-white/80">
              {crew.lastActivity}
            </span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-6xl text-white tracking-tight mb-2 drop-shadow">
            {crew.name}
          </h1>

          <p className="text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed drop-shadow">
            {crew.description || 'Private trust network for secret gatherings, shared memories, and collective treasury.'}
          </p>
        </div>
      </div>

      {/* Collective Metrics Bar (PRODUCT.md Section 4 & 7.2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_4px_16px_rgba(40,30,20,0.03)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF5C0] border border-[#F0DC00]/50 flex items-center justify-center text-[#B89600]">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#6F6A62] block">Nights Together</span>
            <span className="font-display font-extrabold text-xl text-[#171512]">{crew.nightsTogether ?? 1} nights</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_4px_16px_rgba(40,30,20,0.03)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#6F6A62] block">Shared Spend</span>
            <span className="font-display font-extrabold text-xl text-[#171512]">${(crew.totalSpent ?? 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_4px_16px_rgba(40,30,20,0.03)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#6F6A62] block">Top Party Game</span>
            <span className="font-display font-extrabold text-sm sm:text-base text-[#171512] truncate max-w-[130px] block">
              {crew.topGame || "None yet"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_4px_16px_rgba(40,30,20,0.03)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <PartyPopper className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#6F6A62] block">Treasury Reserve</span>
            <span className="font-display font-extrabold text-xl text-emerald-700">${(crew.treasuryBalance ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[rgba(35,30,22,0.08)] pb-4 mb-6">
        <button
          onClick={() => setActiveSubTab('gatherings')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'gatherings'
              ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
              : 'text-[#6F6A62] hover:text-[#171512] bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Gatherings ({crewParties.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('members')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'members'
              ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
              : 'text-[#6F6A62] hover:text-[#171512] bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Inner Circle ({crew.members?.length || crew.membersCount})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('memories')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'memories'
              ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
              : 'text-[#6F6A62] hover:text-[#171512] bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Memories Capsule ({crew.memories?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: GATHERINGS */}
      {activeSubTab === 'gatherings' && (
        <div>
          {crewParties.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-sm">
              <PartyPopper className="w-12 h-12 text-[#B89600] mx-auto mb-4 opacity-80" />
              <h3 className="font-display font-extrabold text-2xl text-[#171512] mb-2">No Gatherings Yet</h3>
              <p className="text-sm text-[#6F6A62] max-w-md mx-auto mb-6">
                Gatherings strengthen the Crew. Host the first private gathering for this circle.
              </p>
              <GlassButton
                variant="accent"
                size="md"
                onClick={() => setCurrentView('create-party')}
                icon={<Plus className="w-4 h-4 text-[#171512] stroke-[3]" />}
              >
                Host Party for {crew.name}
              </GlassButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crewParties.map((party) => (
                <div
                  key={party.id}
                  className="flex flex-col justify-between h-[340px] rounded-[24px] bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_4px_24px_rgba(40,30,20,0.04)] overflow-hidden cursor-pointer group hover:shadow-[0_12px_36px_rgba(40,30,20,0.08)] transition-all"
                  onClick={() => selectParty(party.id)}
                >
                  {/* Photo Top */}
                  <div className="relative h-[180px] w-full overflow-hidden bg-[#F1EADF]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={party.coverImage}
                      alt={party.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-mono font-bold text-[#171512] shadow-sm">
                        CODE: {party.code}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-emerald-500/30">
                        ● {party.status}
                      </span>
                    </div>
                  </div>

                  {/* Surface Bottom */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-extrabold text-xl text-[#171512] mb-1 group-hover:text-[#B89600] transition-colors">
                        {party.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#6F6A62] mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#B89600]" /> {party.date} · {party.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#B89600]" /> {party.location}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[rgba(35,30,22,0.06)] flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#8E887E]">
                        {party.members.length} going · ${party.potBalance.toFixed(2)} pot
                      </span>
                      <span className="text-xs font-bold text-[#171512]">
                        Enter Party →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeSubTab === 'members' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#6F6A62]">
              TRUST NETWORK · EIP-712 AUTHENTICATED
            </span>
            <GlassButton
              variant="glass"
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              icon={<Plus className="w-4 h-4 text-[#171512]" />}
            >
              Add Member
            </GlassButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(crew.members || []).map((m) => (
              <div
                key={m.id}
                onClick={() =>
                  setSelectedMember({
                    id: m.userId || m.id,
                    name: m.name,
                    avatar: m.avatar || '',
                    role: m.role === 'owner' ? 'host' : 'guest',
                    status: 'going',
                    nightsTogether: m.nightsTogether || 1,
                    walletAddress: m.walletAddress,
                    handle: m.handle,
                  })
                }
                className="p-4 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_4px_16px_rgba(40,30,20,0.03)] hover:shadow-md transition-all flex items-center justify-between cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#FFFDF8] shrink-0 flex items-center justify-center bg-[#F1EADF] shadow-sm">
                    {m.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#FFF5C0] text-[#171512] flex items-center justify-center font-display font-black text-sm">
                        {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-[#171512]">{m.name}</h4>
                      {m.role === 'owner' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#FFF5C0] text-[#8C7300] font-bold">
                          OWNER
                        </span>
                      )}
                      {m.role === 'admin' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-100 text-purple-700 font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#8E887E] font-mono block">{m.handle}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-[#171512] block">{m.nightsTogether || 1} nights</span>
                  {m.walletAddress && (
                    <span className="text-[10px] font-mono text-[#8E887E]">{m.walletAddress.slice(0, 6)}...</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Member Modal */}
          {isInviteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
              <div className="w-full max-w-md rounded-3xl border border-[rgba(35,30,22,0.12)] bg-[#FFFDF8] p-6 shadow-2xl text-[#171512]">
                <h3 className="font-display font-bold text-xl text-[#171512] mb-1">Add Member to {crew.name}</h3>
                <p className="text-xs text-[#6F6A62] mb-4">Add a friend directly to your trust circle.</p>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-mono text-[#6F6A62] mb-1">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Satoshi"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F7F2E8] border border-[rgba(35,30,22,0.12)] text-[#171512] text-sm outline-none focus:border-[#F0DC00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono text-[#6F6A62] mb-1">Social Handle</label>
                    <input
                      type="text"
                      placeholder="e.g. @satoshi.monad"
                      value={newMemberHandle}
                      onChange={(e) => setNewMemberHandle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F7F2E8] border border-[rgba(35,30,22,0.12)] text-[#171512] text-sm outline-none focus:border-[#F0DC00]"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <GlassButton type="button" variant="subtle" size="sm" onClick={() => setIsInviteOpen(false)}>
                      Cancel
                    </GlassButton>
                    <GlassButton type="submit" variant="accent" size="sm">
                      Add to Circle
                    </GlassButton>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEMORIES */}
      {activeSubTab === 'memories' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#6F6A62]">
              COLLECTIVE TIMELINE & TIME CAPSULE
            </span>
            <GlassButton
              variant="glass"
              size="sm"
              onClick={() => setIsMemoryOpen(true)}
              icon={<Camera className="w-4 h-4 text-[#171512]" />}
            >
              Add Memory
            </GlassButton>
          </div>

          {(crew.memories || []).length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-sm">
              <Camera className="w-12 h-12 text-[#B89600] mx-auto mb-4 opacity-80" />
              <h3 className="font-display font-extrabold text-2xl text-[#171512] mb-2">No Memories Stored Yet</h3>
              <p className="text-sm text-[#6F6A62] max-w-md mx-auto mb-6">
                Upload your group moments after each gathering to cement the crew’s legacy.
              </p>
              <GlassButton
                variant="accent"
                size="md"
                onClick={() => setIsMemoryOpen(true)}
                icon={<Camera className="w-4 h-4 text-[#171512] stroke-[3]" />}
              >
                Upload First Memory
              </GlassButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {crew.memories.map((mem) => (
                <div
                  key={mem.id}
                  className="rounded-3xl overflow-hidden bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_4px_20px_rgba(40,30,20,0.04)] flex flex-col group"
                >
                  <div className="relative aspect-video overflow-hidden bg-[#F1EADF]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mem.imageUrl}
                      alt={mem.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-mono font-bold text-[#171512] shadow-sm">
                      {mem.partyTitle || crew.name}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="text-sm text-[#171512] font-semibold mb-3 leading-relaxed">
                      &quot;{mem.caption}&quot;
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-[#8E887E] border-t border-[rgba(35,30,22,0.06)] pt-3">
                      <span>Uploaded by {mem.uploadedBy}</span>
                      <span>{mem.uploadedAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Memory Modal */}
          {isMemoryOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
              <div className="w-full max-w-md rounded-3xl border border-[rgba(35,30,22,0.12)] bg-[#FFFDF8] p-6 shadow-2xl text-[#171512]">
                <h3 className="font-display font-bold text-xl text-[#171512] mb-1">Add Photo Memory</h3>
                <p className="text-xs text-[#6F6A62] mb-4">Post a memory from a recent gathering.</p>
                <form onSubmit={handleAddMemory} className="space-y-4">
                  {/* Hidden file input */}
                  <input
                    ref={memoryFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleMemoryFileUpload}
                  />

                  <div>
                    <label className="block text-xs uppercase font-mono text-[#6F6A62] mb-1.5 flex items-center justify-between">
                      <span>Photo</span>
                      <button
                        type="button"
                        onClick={() => memoryFileInputRef.current?.click()}
                        disabled={isUploadingMemory}
                        className="text-xs text-[#B89600] font-bold hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingMemory ? 'Subiendo...' : 'Subir desde dispositivo'}
                      </button>
                    </label>

                    {memoryUrl ? (
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-black/10 mb-2 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={memoryUrl} alt="Memory preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => memoryFileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-bold transition-opacity"
                        >
                          Cambiar imagen
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => memoryFileInputRef.current?.click()}
                        className="w-full h-28 rounded-2xl border-2 border-dashed border-black/15 hover:border-[#F0DC00] bg-[#F7F2E8] flex flex-col items-center justify-center cursor-pointer transition-all mb-2"
                      >
                        {isUploadingMemory ? (
                          <div className="w-6 h-6 border-2 border-[#F0DC00] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-6 h-6 text-[#B89600] mb-1.5" />
                            <span className="text-xs font-bold text-[#171512]">Seleccionar o tomar foto</span>
                            <span className="text-[10px] text-[#8E887E]">PNG, JPG o WEBP hasta 10MB</span>
                          </>
                        )}
                      </div>
                    )}

                    {memoryUploadError && (
                      <p className="text-xs text-red-500 mb-2">{memoryUploadError}</p>
                    )}

                    <input
                      type="url"
                      placeholder="o ingresa un URL (https://...)"
                      value={memoryUrl}
                      onChange={(e) => setMemoryUrl(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-[#F7F2E8] border border-[rgba(35,30,22,0.1)] text-[#171512] text-xs outline-none focus:border-[#F0DC00] placeholder:text-[#999187]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono text-[#6F6A62] mb-1">Caption / Moment</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunrise rooftop set on the terrace"
                      value={memoryCaption}
                      onChange={(e) => setMemoryCaption(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F7F2E8] border border-[rgba(35,30,22,0.1)] text-[#171512] text-sm outline-none focus:border-[#F0DC00]"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <GlassButton type="button" variant="subtle" size="sm" onClick={() => setIsMemoryOpen(false)}>
                      Cancel
                    </GlassButton>
                    <GlassButton type="submit" variant="accent" size="sm">
                      Post Memory
                    </GlassButton>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      <SharedExperienceModal
        member={selectedMember}
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
};
