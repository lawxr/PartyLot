'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import {
  MapPin,
  ArrowRight,
  Plus,
  Search,
  Check,
  KeyRound,
  Clock,
  DoorOpen,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getCoverUrl, getAvatarUrl } from '@/lib/imageOptimization';
import { MonadLogo } from '@/components/ui/TokenLogo';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { persistActivityToSupabase } from '@/services/supabaseService';
import type { Party, ActivityItem } from '@/types';

type RadarFilter = 'all' | 'tonight' | 'my-crews' | 'discover';

/**
 * Tonight View — Social Discovery & Gatherings
 *
 * Warm, editorial, intimate Partylot design language (DESIGN.md):
 * - Clean typography & ivory/cream surfaces (#F7F2E8, #FFFDF8).
 * - Primary brand accent #F0DC00 (Party Yellow).
 * - Real photo cards with natural warm overlays.
 * - Active Gathering Card & Gatherings in Other Crews.
 */
export const ActivityView: React.FC = () => {
  const {
    parties,
    currentPartyId,
    selectParty,
    crews,
    setCurrentView,
    currentUser,
    setPendingInviteCode,
  } = usePartyStore();

  const { language } = useTranslation();
  const isEs = language === 'es';

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<RadarFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Knock on Door Modal & Request tracking
  const [selectedPartyForKnock, setSelectedPartyForKnock] = useState<Party | null>(null);
  const [requestedPartyIds, setRequestedPartyIds] = useState<Set<string>>(new Set());
  const [knockMessage, setKnockMessage] = useState('');
  const [knockSuccess, setKnockSuccess] = useState(false);

  // 100% Real parties from store
  const allCommunityParties = parties;

  // Real crews map for badge labels
  const crewMap = useMemo(() => {
    const map = new Map<string, string>();
    crews.forEach((c) => {
      map.set(c.id, c.name);
    });
    return map;
  }, [crews]);

  // Primary active gathering for tonight
  const activeParty = useMemo(() => {
    if (currentPartyId) {
      const match = allCommunityParties.find((p) => p.id === currentPartyId);
      if (match) return match;
    }
    const todayLive = allCommunityParties.find(
      (p) =>
        p.status === 'live' ||
        p.date.toLowerCase() === 'today' ||
        p.date.toLowerCase() === 'hoy'
    );
    return todayLive || allCommunityParties[0] || null;
  }, [allCommunityParties, currentPartyId]);

  const associatedCrewName = activeParty?.crewId ? crewMap.get(activeParty.crewId) : null;
  const isUserInActiveParty = useMemo(() => {
    if (!activeParty) return false;
    if (activeParty.hostId === currentUser.id) return true;
    return (activeParty.members || []).some(
      (m) => m.id === currentUser.id || m.name.toLowerCase() === currentUser.name.toLowerCase()
    );
  }, [activeParty, currentUser]);

  // Filter parties for the community list
  const otherParties = useMemo(() => {
    let list = allCommunityParties.filter((p) => p.id !== activeParty?.id);

    // Apply Filter Chips
    if (activeFilter === 'tonight') {
      list = list.filter(
        (p) =>
          p.status === 'live' ||
          p.date.toLowerCase().includes('today') ||
          p.date.toLowerCase().includes('hoy')
      );
    } else if (activeFilter === 'my-crews') {
      list = list.filter((p) => {
        const inCrew = crews.some((c) => c.id === p.crewId);
        const isMember = (p.members || []).some(
          (m) => m.id === currentUser.id || m.name.toLowerCase() === currentUser.name.toLowerCase()
        );
        return inCrew || isMember || p.hostId === currentUser.id;
      });
    } else if (activeFilter === 'discover') {
      list = list.filter((p) => {
        const isMember = (p.members || []).some(
          (m) => m.id === currentUser.id || m.name.toLowerCase() === currentUser.name.toLowerCase()
        );
        return !isMember && p.hostId !== currentUser.id;
      });
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const crewName = p.crewId ? crewMap.get(p.crewId) || '' : '';
        return (
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          crewName.toLowerCase().includes(q) ||
          p.hostName.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [allCommunityParties, activeParty?.id, activeFilter, searchQuery, crews, currentUser, crewMap]);

  // Send knock request
  const handleSendKnock = () => {
    if (!selectedPartyForKnock) return;
    setRequestedPartyIds((prev) => new Set(prev).add(selectedPartyForKnock.id));
    setKnockSuccess(true);

    // Persist real knock request in Supabase activity feed
    const knockActivity: ActivityItem = {
      id: `knock_${Date.now()}`,
      partyId: selectedPartyForKnock.id,
      type: 'join',
      text: `${currentUser.name || 'Alguien'} tocó la puerta para unirse a ${selectedPartyForKnock.title}${knockMessage ? `: "${knockMessage}"` : ''}`,
      time: 'Just now',
      avatar: currentUser.avatar || '',
    };
    persistActivityToSupabase(knockActivity).catch(() => {});

    setTimeout(() => {
      setKnockSuccess(false);
      setSelectedPartyForKnock(null);
      setKnockMessage('');
    }, 1500);
  };

  const handleOpenDirectCode = (party: Party) => {
    if (party.code) {
      setPendingInviteCode(party.code);
    }
    setCurrentView('join-party');
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-32 pt-2 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto safe-top select-none w-full transition-colors duration-200">
      {/* Editorial Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 pb-5 border-b border-black/8 dark:border-white/10 mb-6">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white tracking-tight">
            {isEs ? 'Esta noche' : 'Tonight'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6F6A62] dark:text-[#A8A196] font-medium mt-1">
            {isEs
              ? 'Tus planes confirmados y reuniones en otras crews.'
              : 'Your confirmed plans & gatherings across other crews.'}
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('join-party')}
            className="px-3.5 py-2 rounded-full border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 text-[#171512] dark:text-white text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#B89600] dark:text-[#F0DC00]" />
            <span>{isEs ? 'Tengo un código' : 'Have a code'}</span>
          </button>

          <button
            onClick={() => setCurrentView('create-party')}
            className="px-4 py-2 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] text-xs font-bold active:scale-95 hover:bg-black/90 dark:hover:bg-white/90 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEs ? 'Crear Fiesta' : 'Create Party'}</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 1. HERO SECTION: TU PLAN DE HOY (Active Gathering)            */}
      {/* ============================================================== */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="font-display font-bold text-base sm:text-lg text-[#171512] dark:text-white tracking-tight">
            {isEs ? 'Tu plan de hoy' : 'Your Plan Tonight'}
          </h2>
          {activeParty && (
            <span className="text-[11px] font-bold text-[#6F6A62] dark:text-[#A8A196] px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10">
              {activeParty.date || (isEs ? 'Hoy' : 'Today')}
            </span>
          )}
        </div>

        {activeParty ? (
          <div className="group relative overflow-hidden rounded-[28px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-[0_8px_30px_rgba(65,48,25,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all">
            {/* Visual Photo Card Top */}
            <div
              onClick={() => selectParty(activeParty.id)}
              className="relative h-52 sm:h-64 w-full overflow-hidden bg-black/10 dark:bg-white/5 cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getCoverUrl(activeParty.coverImage)}
                alt={activeParty.title}
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              {/* Top Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#F0DC00] text-[#171512] font-display font-extrabold text-xs shadow-xs">
                    {activeParty.date || (isEs ? 'Esta noche' : 'Tonight')}
                  </span>
                  {associatedCrewName && (
                    <span className="px-3 py-1 rounded-full bg-black/45 text-white/95 text-xs font-semibold backdrop-blur-md border border-white/20">
                      {associatedCrewName}
                    </span>
                  )}
                </div>

                {activeParty.potBalance > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-mono font-bold backdrop-blur-md border border-white/20 shadow-xs">
                    <MonadLogo size="xs" />
                    <span>{activeParty.potBalance.toFixed(2)} MON</span>
                  </div>
                )}
              </div>

              {/* Bottom Hero Info */}
              <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
                <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight drop-shadow-sm">
                  {activeParty.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-white/90 font-medium mt-1.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#F0DC00]" />
                    {activeParty.date} {activeParty.time ? `· ${activeParty.time}` : ''}
                  </span>
                  {activeParty.location && (
                    <span className="flex items-center gap-1 truncate max-w-[260px]">
                      <MapPin className="w-3.5 h-3.5 text-[#F0DC00]" />
                      {activeParty.location.split('·')[0].trim()}
                    </span>
                  )}
                  {activeParty.hostName && (
                    <span className="text-white/70">
                      Host: <strong className="text-white">{activeParty.hostName}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Bar: Facepile & Enter Button */}
            <div className="p-4 sm:p-5 bg-[#FFFDF8] dark:bg-[#1C1A16] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-black/5 dark:border-white/10">
              {/* Member Facepile */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  {(activeParty.members || []).slice(0, 5).map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="inline-block w-8 h-8 rounded-full ring-2 ring-[#FFFDF8] dark:ring-[#1C1A16] overflow-hidden bg-black/10 shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getAvatarUrl(m.avatar)}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#171512] dark:text-white">
                    {(activeParty.members || []).length} {isEs ? 'personas confirmadas' : 'guests confirmed'}
                  </div>
                  <div className="text-[11px] font-medium text-[#6F6A62] dark:text-[#A8A196]">
                    {isUserInActiveParty
                      ? (isEs ? 'Asistiendo a esta fiesta' : 'You are attending')
                      : (isEs ? 'Reunión disponible' : 'Open gathering')}
                  </div>
                </div>
              </div>

              {/* Main Enter CTA */}
              <button
                onClick={() => selectParty(activeParty.id)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] hover:bg-[#F0DC00] hover:text-[#171512] dark:hover:bg-[#F0DC00] dark:hover:text-[#171512] text-xs font-extrabold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs group/btn"
              >
                <span>{isEs ? 'Ver fiesta' : 'View party'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-7 rounded-[28px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-dashed border-black/15 dark:border-white/15 text-center">
            <h3 className="font-display font-bold text-base text-[#171512] dark:text-white mb-1">
              {isEs ? 'Sin planes confirmados para hoy' : 'No confirmed plans for tonight'}
            </h3>
            <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] max-w-sm mx-auto mb-4">
              {isEs
                ? 'Explora las reuniones de otras crews a continuación para solicitar unirte, o crea tu propia fiesta.'
                : 'Check out parties from other crews below to knock, or host your own gathering.'}
            </p>
            <button
              onClick={() => setCurrentView('create-party')}
              className="px-4 py-2 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] text-xs font-bold active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEs ? 'Crear fiesta para hoy' : 'Host a party tonight'}</span>
            </button>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 2. GATHERINGS IN OTHER CREWS                                   */}
      {/* ============================================================== */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-0.5">
          <div>
            <h2 className="font-display font-extrabold text-xl text-[#171512] dark:text-white tracking-tight">
              {isEs ? 'Ocurriendo en otras crews' : 'Happening in Other Crews'}
            </h2>
            <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] font-medium mt-0.5">
              {isEs
                ? 'Reuniones de otras crews a las que puedes solicitar unirte.'
                : 'Gatherings from other crews you can request to join.'}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E887E] dark:text-[#A8A196]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEs ? 'Buscar fiesta, crew o ciudad...' : 'Search party, crew or city...'}
              className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs bg-white dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 text-[#171512] dark:text-white placeholder-[#8E887E] dark:placeholder-[#A8A196] focus:outline-hidden focus:border-[#F0DC00] transition-colors"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4">
          {[
            { id: 'all', label: isEs ? 'Todas las fiestas' : 'All Parties' },
            { id: 'tonight', label: isEs ? 'Esta noche' : 'Tonight' },
            { id: 'my-crews', label: isEs ? 'Mis crews' : 'My Crews' },
            { id: 'discover', label: isEs ? 'Otras crews' : 'Other Crews' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id as RadarFilter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === pill.id
                  ? 'bg-[#171512] dark:bg-white text-white dark:text-[#171512] shadow-2xs'
                  : 'bg-white dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Other Parties Grid */}
        {otherParties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherParties.map((party) => {
              const partyCrewName = party.crewId ? crewMap.get(party.crewId) : null;
              const isMember = (party.members || []).some(
                (m) =>
                  m.id === currentUser.id ||
                  m.name.toLowerCase() === currentUser.name.toLowerCase()
              );
              const isHost = party.hostId === currentUser.id;
              const isRequested = requestedPartyIds.has(party.id);

              return (
                <div
                  key={party.id}
                  className="rounded-[24px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 overflow-hidden shadow-xs hover:border-black/20 dark:hover:border-white/20 transition-all flex flex-col justify-between group"
                >
                  {/* Photo Header */}
                  <div
                    onClick={() => selectParty(party.id)}
                    className="relative h-40 w-full overflow-hidden bg-black/10 dark:bg-white/5 cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getCoverUrl(party.coverImage)}
                      alt={party.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top tags on photo */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                      {partyCrewName ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-white/95 text-[10px] font-bold backdrop-blur-md border border-white/20">
                          {partyCrewName}
                        </span>
                      ) : <div />}

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-bold backdrop-blur-md border border-white/20">
                          {party.date} {party.time ? `· ${party.time}` : ''}
                        </span>
                        {party.potBalance > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-mono font-bold backdrop-blur-md border border-white/20">
                            <MonadLogo size="xs" />
                            {party.potBalance.toFixed(0)} MON
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title on photo */}
                    <div className="absolute bottom-3 left-3 right-3 z-10 text-white">
                      <h4 className="font-display font-extrabold text-xl text-white tracking-tight leading-tight truncate">
                        {party.title}
                      </h4>
                      <p className="text-[11px] text-white/80 font-medium truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#F0DC00]" />
                        {party.location}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    {/* Description & Host */}
                    <div>
                      {party.description && (
                        <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] line-clamp-2 leading-relaxed">
                          {party.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2.5 text-[11px] text-[#8E887E] dark:text-[#A8A196]">
                        <span>
                          {isEs ? 'Organizado por' : 'Host'}:{' '}
                          <strong className="text-[#171512] dark:text-white font-semibold">
                            {party.hostName}
                          </strong>
                        </span>
                        <span>
                          {(party.members || []).length} {isEs ? 'confirmados' : 'attending'}
                        </span>
                      </div>
                    </div>

                    {/* Attendee Stack & CTA Action */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                      {/* Attendees Avatars */}
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {(party.members || []).slice(0, 4).map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className="inline-block w-6 h-6 rounded-full ring-2 ring-[#FFFDF8] dark:ring-[#1C1A16] overflow-hidden bg-black/10 shrink-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getAvatarUrl(m.avatar)}
                              alt={m.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Interactive Buttons */}
                      {isMember || isHost ? (
                        <button
                          onClick={() => selectParty(party.id)}
                          className="px-3.5 py-1.5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-[#171512] dark:text-white text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>{isEs ? 'Ver fiesta' : 'View party'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : isRequested ? (
                        <div className="px-3 py-1.5 rounded-full bg-[#F0DC00]/15 border border-[#F0DC00]/35 text-[#171512] dark:text-[#F0DC00] text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#B89600] dark:text-[#F0DC00]" />
                          <span>{isEs ? 'Solicitud enviada' : 'Requested'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenDirectCode(party)}
                            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-colors cursor-pointer"
                            title={isEs ? 'Tengo un código' : 'I have a code'}
                          >
                            <KeyRound className="w-3.5 h-3.5 text-[#B89600] dark:text-[#F0DC00]" />
                          </button>
                          <button
                            onClick={() => setSelectedPartyForKnock(party)}
                            className="px-3.5 py-1.5 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] hover:bg-[#F0DC00] hover:text-[#171512] dark:hover:bg-[#F0DC00] dark:hover:text-[#171512] text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <DoorOpen className="w-3.5 h-3.5 text-[#F0DC00] dark:text-[#171512]" />
                            <span>{isEs ? 'Tocar puerta' : 'Knock'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-[24px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 text-center">
            <p className="font-bold text-sm text-[#171512] dark:text-white mb-1">
              {isEs ? 'No se encontraron fiestas con ese filtro' : 'No parties found with this filter'}
            </p>
            <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] mb-3">
              {isEs
                ? 'Prueba seleccionando "Todas las fiestas" o crea una para tu crew.'
                : 'Try selecting "All parties" or host one for your crew.'}
            </p>
            <button
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 rounded-full border border-black/10 dark:border-white/15 text-xs font-semibold text-[#171512] dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
            >
              {isEs ? 'Restablecer filtros' : 'Reset filters'}
            </button>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 3. KNOCK ON DOOR (TOCAR LA PUERTA) BOTTOM SHEET                */}
      {/* ============================================================== */}
      <BottomSheet
        isOpen={Boolean(selectedPartyForKnock)}
        onClose={() => {
          setSelectedPartyForKnock(null);
          setKnockMessage('');
          setKnockSuccess(false);
        }}
        title={isEs ? 'Tocar la puerta' : 'Knock on the Door'}
      >
        {selectedPartyForKnock && (
          <div className="space-y-4">
            {/* Party Mini Preview */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getCoverUrl(selectedPartyForKnock.coverImage)}
                  alt={selectedPartyForKnock.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-extrabold text-sm text-[#171512] dark:text-white truncate">
                  {selectedPartyForKnock.title}
                </div>
                <div className="text-xs text-[#6F6A62] dark:text-[#A8A196] truncate">
                  {selectedPartyForKnock.location}
                </div>
                <div className="text-[11px] text-[#B89600] dark:text-[#F0DC00] font-semibold mt-0.5">
                  Host: {selectedPartyForKnock.hostName} · {selectedPartyForKnock.date}
                </div>
              </div>
            </div>

            {knockSuccess ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-5 rounded-2xl bg-[#F0DC00]/15 border border-[#F0DC00]/30 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-[#171512] dark:bg-white text-[#F0DC00] dark:text-[#171512] flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-display font-bold text-sm text-[#171512] dark:text-white">
                  {isEs ? '¡Tocaste a la puerta con éxito!' : 'Knock sent successfully!'}
                </h4>
                <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] mt-1">
                  {isEs
                    ? `Le avisamos al host (${selectedPartyForKnock.hostName}). Recibirás la confirmación pronto.`
                    : `Notification sent to ${selectedPartyForKnock.hostName}. You'll be alerted when accepted.`}
                </p>
              </motion.div>
            ) : (
              <>
                <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] leading-relaxed">
                  {isEs
                    ? `Esta fiesta está organizada por ${selectedPartyForKnock.hostName}. Puedes solicitar unirte o ingresar directamente si ya tienes el código de invitación.`
                    : `This party is hosted by ${selectedPartyForKnock.hostName}. You can knock to request access or enter directly if you already have the 4-digit code.`}
                </p>

                {/* Optional note input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196] mb-1.5">
                    {isEs ? 'Mensaje para el host (opcional)' : 'Note for host (optional)'}
                  </label>
                  <input
                    type="text"
                    value={knockMessage}
                    onChange={(e) => setKnockMessage(e.target.value)}
                    placeholder={
                      isEs
                        ? '¡Hola! Voy con amigos de la crew...'
                        : "Hey! Coming with friends from the crew..."
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#171512] dark:text-white placeholder-[#8E887E] dark:placeholder-[#A8A196] focus:outline-hidden focus:border-[#F0DC00]"
                  />
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleSendKnock}
                    className="w-full py-3 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] hover:bg-[#F0DC00] hover:text-[#171512] dark:hover:bg-[#F0DC00] dark:hover:text-[#171512] font-display font-bold text-xs tracking-tight shadow-sm active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <DoorOpen className="w-4 h-4 text-[#F0DC00] dark:text-[#171512]" />
                    <span>{isEs ? 'Enviar solicitud (Tocar puerta)' : 'Send Knock Request'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const p = selectedPartyForKnock;
                      setSelectedPartyForKnock(null);
                      handleOpenDirectCode(p);
                    }}
                    className="w-full py-2.5 rounded-full border border-black/10 dark:border-white/15 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#171512] dark:text-white font-semibold text-xs active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#B89600] dark:text-[#F0DC00]" />
                    <span>{isEs ? 'Ya tengo el código de 4 dígitos' : 'I have the 4-digit code'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
