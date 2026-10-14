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
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { uploadImageFile } from '@/services/storageService';
import { Member } from '@/types';
import { SharedExperienceModal } from '@/components/ui/SharedExperienceModal';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Avatar } from '@/components/ui/Avatar';
import { formatHandle } from '@/lib/handle';

export const CrewDetailView: React.FC = () => {
  const {
    currentCrewId,
    crews,
    parties,
    currentUser,
    setCurrentView,
    selectParty,
    addCrewMember,
    removeCrewMember,
    addCrewMemory,
    getPastPartyPeers,
  } = usePartyStore();

  const { t, language } = useTranslation();
  const isEs = language === 'es';

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

  const currentUserId = currentUser?.id;
  const isOwner =
    crew?.ownerId === currentUserId ||
    crew?.members?.some((m) => (m.userId === currentUserId || m.id === currentUserId) && m.role === 'owner');
  const isAdmin =
    isOwner ||
    crew?.members?.some((m) => (m.userId === currentUserId || m.id === currentUserId) && m.role === 'admin');

  const pastPartyPeers = getPastPartyPeers().filter((peer) => {
    return !crew?.members?.some(
      (m) =>
        (m.userId && m.userId === peer.id) ||
        m.id === peer.id ||
        m.name.toLowerCase() === peer.name.toLowerCase()
    );
  });

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
      handle: newMemberHandle.trim() ? formatHandle(newMemberHandle) : formatHandle(newMemberName.toLowerCase().replace(/\s+/g, '')),
      role: 'member',
      avatar: '',
    });

    setNewMemberName('');
    setNewMemberHandle('');
    setIsInviteOpen(false);
  };

  const handleAddPastPeer = (peer: {
    id: string;
    name: string;
    handle?: string;
    avatar: string;
    nightsTogether: number;
    walletAddress?: string;
  }) => {
    addCrewMember(crew.id, {
      userId: peer.id,
      name: peer.name,
      handle: peer.handle ? formatHandle(peer.handle) : formatHandle(peer.name.toLowerCase().replace(/\s+/g, '')),
      avatar: peer.avatar,
      walletAddress: peer.walletAddress,
      nightsTogether: peer.nightsTogether,
      role: 'member',
    });
  };

  const handleRemoveMember = (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation();
    if (!isAdmin) return;
    removeCrewMember(crew.id, memberId);
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
    <div className="min-h-screen bg-bg-primary text-primary pb-32 pt-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto safe-top select-none w-full">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between py-3 mb-4">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEs ? 'Volver al Inicio' : 'Back to Dashboard'}</span>
        </button>

        <div className="flex items-center gap-3">
          <GlassButton
            variant="glass"
            size="sm"
            onClick={handleCopyInvite}
            icon={copiedLink ? <Check className="w-4 h-4 text-party-yellow" /> : <Share2 className="w-4 h-4 text-primary" />}
          >
            {copiedLink ? t.crewDetail.copied : t.crewDetail.copyLink}
          </GlassButton>

          <GlassButton
            variant="accent"
            size="sm"
            onClick={() => setCurrentView('create-party')}
            icon={<Plus className="w-4 h-4 text-primary stroke-[3]" />}
          >
            {isEs ? 'Organizar Fiesta' : 'Host Gathering'}
          </GlassButton>
        </div>
      </div>

      {/* Hero Cover Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 h-72 sm:h-96 mb-8 group shadow-xs">
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
            <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md text-xs font-mono font-bold text-primary shadow-xs">
              {crew.membersCount} {isEs ? 'MIEMBROS ACTIVOS' : 'ACTIVE MEMBERS'}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs text-white">
              {crewParties.length} {isEs ? (crewParties.length === 1 ? 'Fiesta organizada' : 'Fiestas organizadas') : 'Gatherings Hosted'}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs text-white/80">
              {crew.lastActivity}
            </span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-6xl text-white tracking-tight mb-2 drop-shadow">
            {crew.name}
          </h1>

          <p className="text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed drop-shadow">
            {crew.description || (isEs ? 'Red privada de confianza para encuentros íntimos, recuerdos compartidos y fondo común.' : 'Private trust network for secret gatherings, shared memories, and collective treasury.')}
          </p>
        </div>
      </div>

      {/* Collective Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-surface border border-divider shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-party-yellow/20 flex items-center justify-center text-text-primary dark:text-party-yellow">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-secondary block font-medium">
              {isEs ? 'Noches Juntos' : 'Nights Together'}
            </span>
            <span className="font-display font-extrabold text-xl text-primary">
              {crew.nightsTogether ?? 1} {isEs ? 'noches' : 'nights'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-divider shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-primary">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-secondary block font-medium">
              {isEs ? 'Gasto Compartido' : 'Shared Spend'}
            </span>
            <span className="font-display font-extrabold text-xl text-primary">${(crew.totalSpent ?? 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-divider shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-primary">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-secondary block font-medium">
              {isEs ? 'Juego Favorito' : 'Top Party Game'}
            </span>
            <span className="font-display font-extrabold text-sm sm:text-base text-primary truncate max-w-[130px] block">
              {crew.topGame || (isEs ? 'Ninguno aún' : 'None yet')}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-divider shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-primary">
            <PartyPopper className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-secondary block font-medium">
              {t.crewDetail.treasury}
            </span>
            <span className="font-display font-extrabold text-xl text-primary">${(crew.treasuryBalance ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-divider pb-4 mb-6">
        <button
          onClick={() => setActiveSubTab('gatherings')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'gatherings'
              ? 'bg-party-yellow text-primary shadow-xs'
              : 'text-secondary hover:text-primary bg-surface border border-divider'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t.crewDetail.tabGatherings} ({crewParties.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('members')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'members'
              ? 'bg-party-yellow text-primary shadow-xs'
              : 'text-secondary hover:text-primary bg-surface border border-divider'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.crewDetail.tabMembers} ({crew.members?.length || crew.membersCount})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('memories')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'memories'
              ? 'bg-party-yellow text-primary shadow-xs'
              : 'text-secondary hover:text-primary bg-surface border border-divider'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{t.crewDetail.tabMemories} ({crew.memories?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: GATHERINGS */}
      {activeSubTab === 'gatherings' && (
        <div>
          {crewParties.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-divider shadow-xs">
              <PartyPopper className="w-12 h-12 text-party-yellow mx-auto mb-4 opacity-90" />
              <h3 className="font-display font-extrabold text-2xl text-primary mb-2">
                {isEs ? 'No hay fiestas todavía' : 'No Gatherings Yet'}
              </h3>
              <p className="text-sm text-secondary max-w-md mx-auto mb-6">
                {isEs
                  ? 'Las fiestas fortalecen el Crew. Organiza el primer encuentro privado para este círculo.'
                  : 'Gatherings strengthen the Crew. Host the first private gathering for this circle.'}
              </p>
              <GlassButton
                variant="accent"
                size="md"
                onClick={() => setCurrentView('create-party')}
                icon={<Plus className="w-4 h-4 text-primary stroke-[3]" />}
              >
                {isEs ? `Crear fiesta para ${crew.name}` : `Host Party for ${crew.name}`}
              </GlassButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crewParties.map((party) => (
                <div
                  key={party.id}
                  className="flex flex-col justify-between h-[340px] rounded-[24px] bg-surface border border-divider shadow-xs overflow-hidden cursor-pointer group hover:shadow-sm transition-all"
                  onClick={() => selectParty(party.id)}
                >
                  {/* Photo Top */}
                  <div className="relative h-[180px] w-full overflow-hidden bg-bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={party.coverImage}
                      alt={party.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-md text-xs font-mono font-bold text-primary shadow-xs">
                        CODE: {party.code}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-md text-xs font-bold text-primary border border-divider shadow-xs">
                        ● {party.status}
                      </span>
                    </div>
                  </div>

                  {/* Surface Bottom */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-extrabold text-xl text-primary mb-1 group-hover:text-party-yellow transition-colors">
                        {party.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-secondary mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-party-yellow" /> {party.date} · {party.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-party-yellow" /> {party.location}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-divider flex items-center justify-between">
                      <span className="text-xs font-medium text-secondary">
                        {party.members.length} {isEs ? 'asistiendo' : 'going'} · ${party.potBalance.toFixed(2)} {isEs ? 'bote' : 'pot'}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {isEs ? 'Entrar a la Fiesta →' : 'Enter Party →'}
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
            <span className="text-xs font-semibold text-secondary">
              {isEs ? 'CÍRCULO DE CONFIANZA' : 'TRUST CIRCLE'}
            </span>
            {isAdmin && (
              <GlassButton
                variant="glass"
                size="sm"
                onClick={() => setIsInviteOpen(true)}
                icon={<Plus className="w-4 h-4 text-primary" />}
              >
                {isEs ? 'Añadir Miembro' : 'Add Member'}
              </GlassButton>
            )}
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
                className="p-4 rounded-2xl bg-surface border border-divider shadow-xs hover:shadow-sm transition-all flex items-center justify-between cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    user={{
                      name: m.name,
                      avatar: m.avatar,
                      id: m.userId || m.id,
                    }}
                    size="lg"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-primary">{m.name}</h4>
                      {m.role === 'owner' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-party-yellow/20 text-primary font-bold">
                          OWNER
                        </span>
                      )}
                      {m.role === 'admin' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-secondary text-primary font-bold border border-divider">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-secondary font-mono block">{formatHandle(m.handle)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-xs font-bold text-primary block">
                      {t.crewDetail.nightsTogether(m.nightsTogether || 1)}
                    </span>
                    {m.walletAddress && (
                      <span className="text-xs font-mono text-tertiary">{m.walletAddress.slice(0, 6)}...</span>
                    )}
                  </div>
                  {isAdmin && m.role !== 'owner' && m.userId !== crew.ownerId && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveMember(e, m.id)}
                      className="p-2 ml-1 rounded-xl text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={isEs ? 'Quitar del Crew' : 'Remove from Crew'}
                      aria-label={isEs ? `Quitar a ${m.name} del Crew` : `Remove ${m.name} from Crew`}
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Member Modal */}
          {isInviteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
              <div className="w-full max-w-md rounded-3xl border border-divider bg-surface p-6 shadow-xl text-primary max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-xl text-primary">
                    {isEs ? `Añadir Miembro a ${crew.name}` : `Add Member to ${crew.name}`}
                  </h3>
                  <button
                    onClick={() => setIsInviteOpen(false)}
                    className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-secondary mb-4">
                  {isEs ? 'Añade amigos con los que has ido de fiesta o invítalos por nombre.' : 'Add party peers or invite by name.'}
                </p>

                {/* Past party peers selector */}
                {pastPartyPeers.length > 0 && (
                  <div className="mb-5 pb-4 border-b border-divider">
                    <span className="text-xs uppercase font-mono tracking-wider text-secondary block mb-2">
                      {isEs ? 'Personas con las que has ido a fiesta' : 'People you partied with'}
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {pastPartyPeers.map((peer) => (
                        <div
                          key={peer.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-surface-secondary/70 border border-divider/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              user={{
                                name: peer.name,
                                avatar: peer.avatar,
                                id: peer.id,
                              }}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-primary block truncate">
                                {peer.name}
                              </span>
                              <span className="text-[10px] text-secondary">
                                {peer.nightsTogether} {peer.nightsTogether === 1 ? (isEs ? 'noche juntos' : 'night together') : (isEs ? 'noches juntos' : 'nights together')}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddPastPeer(peer)}
                            className="px-3 py-1.5 rounded-full bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{isEs ? 'Añadir' : 'Add'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-xs uppercase font-mono tracking-wider text-secondary block mb-2">
                  {isEs ? 'O añadir manualmente' : 'Or add manually'}
                </span>

                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      {isEs ? 'Nombre' : 'Name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isEs ? 'Ej. Alex' : 'e.g. Alex'}
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-divider text-primary text-sm outline-none focus:border-party-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      {isEs ? 'Usuario / Red Social' : 'Social Handle'}
                    </label>
                    <input
                      type="text"
                      placeholder={isEs ? 'Ej. @alex' : 'e.g. @alex'}
                      value={newMemberHandle}
                      onChange={(e) => setNewMemberHandle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-divider text-primary text-sm outline-none focus:border-party-yellow"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <GlassButton type="button" variant="subtle" size="sm" onClick={() => setIsInviteOpen(false)}>
                      {isEs ? 'Cancelar' : 'Cancel'}
                    </GlassButton>
                    <GlassButton type="submit" variant="accent" size="sm">
                      {isEs ? 'Añadir al Círculo' : 'Add to Circle'}
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
            <span className="text-xs font-semibold text-secondary">
              {isEs ? 'LÍNEA DE TIEMPO Y CÁPSULA DE RECUERDOS' : 'TIMELINE & MEMORY CAPSULE'}
            </span>
            <GlassButton
              variant="glass"
              size="sm"
              onClick={() => setIsMemoryOpen(true)}
              icon={<Camera className="w-4 h-4 text-primary" />}
            >
              {isEs ? 'Añadir Recuerdo' : 'Add Memory'}
            </GlassButton>
          </div>

          {(crew.memories || []).length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-divider shadow-xs">
              <Camera className="w-12 h-12 text-party-yellow mx-auto mb-4 opacity-90" />
              <h3 className="font-display font-extrabold text-2xl text-primary mb-2">
                {isEs ? 'Sin Recuerdos Guardados Aún' : 'No Memories Stored Yet'}
              </h3>
              <p className="text-sm text-secondary max-w-md mx-auto mb-6">
                {isEs
                  ? 'Sube los momentos de tu grupo después de cada fiesta para inmortalizar el legado de la crew.'
                  : 'Upload your group moments after each gathering to cement the crew’s legacy.'}
              </p>
              <GlassButton
                variant="accent"
                size="md"
                onClick={() => setIsMemoryOpen(true)}
                icon={<Camera className="w-4 h-4 text-primary stroke-[3]" />}
              >
                {isEs ? 'Subir Primer Recuerdo' : 'Upload First Memory'}
              </GlassButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {crew.memories.map((mem) => (
                <div
                  key={mem.id}
                  className="rounded-3xl overflow-hidden bg-surface border border-divider shadow-xs flex flex-col group"
                >
                  <div className="relative aspect-video overflow-hidden bg-bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mem.imageUrl}
                      alt={mem.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-md text-xs font-mono font-bold text-primary shadow-xs">
                      {mem.partyTitle || crew.name}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="text-sm text-primary font-semibold mb-3 leading-relaxed">
                      &quot;{mem.caption}&quot;
                    </p>
                    <div className="flex items-center justify-between text-xs text-secondary border-t border-divider pt-3">
                      <span>{isEs ? 'Subido por' : 'Uploaded by'} {mem.uploadedBy}</span>
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
              <div className="w-full max-w-md rounded-3xl border border-divider bg-surface p-6 shadow-xl text-primary">
                <h3 className="font-display font-bold text-xl text-primary mb-1">
                  {isEs ? 'Añadir Foto de Recuerdo' : 'Add Photo Memory'}
                </h3>
                <p className="text-xs text-secondary mb-4">
                  {isEs ? 'Publica un recuerdo de una fiesta reciente.' : 'Post a memory from a recent gathering.'}
                </p>
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
                    <label className="block text-xs font-semibold text-secondary mb-1.5 flex items-center justify-between">
                      <span>{isEs ? 'Foto' : 'Photo'}</span>
                      <button
                        type="button"
                        onClick={() => memoryFileInputRef.current?.click()}
                        disabled={isUploadingMemory}
                        className="text-xs text-primary font-bold hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingMemory
                          ? (isEs ? 'Subiendo...' : 'Uploading...')
                          : (isEs ? 'Subir desde dispositivo' : 'Upload from device')}
                      </button>
                    </label>

                    {memoryUrl ? (
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 mb-2 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={memoryUrl} alt="Memory preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => memoryFileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-bold transition-opacity"
                        >
                          {isEs ? 'Cambiar imagen' : 'Change image'}
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => memoryFileInputRef.current?.click()}
                        className="w-full h-28 rounded-2xl border-2 border-dashed border-divider hover:border-party-yellow bg-bg-primary flex flex-col items-center justify-center cursor-pointer transition-all mb-2"
                      >
                        {isUploadingMemory ? (
                          <div className="w-6 h-6 border-2 border-party-yellow border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-6 h-6 text-party-yellow mb-1.5" />
                            <span className="text-xs font-bold text-primary">
                              {isEs ? 'Seleccionar o tomar foto' : 'Select or take photo'}
                            </span>
                            <span className="text-xs text-secondary">
                              {isEs ? 'PNG, JPG o WEBP hasta 10MB' : 'PNG, JPG or WEBP up to 10MB'}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {memoryUploadError && (
                      <p className="text-xs text-red-500 mb-2">{memoryUploadError}</p>
                    )}

                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      {isEs ? 'Descripción / Momento' : 'Caption / Moment'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isEs ? 'Ej. Atardecer en el rooftop con la crew' : 'e.g. Sunrise rooftop set on the terrace'}
                      value={memoryCaption}
                      onChange={(e) => setMemoryCaption(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-divider text-primary text-sm outline-none focus:border-party-yellow"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <GlassButton type="button" variant="subtle" size="sm" onClick={() => setIsMemoryOpen(false)}>
                      {isEs ? 'Cancelar' : 'Cancel'}
                    </GlassButton>
                    <GlassButton type="submit" variant="accent" size="sm">
                      {isEs ? 'Publicar Recuerdo' : 'Post Memory'}
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
