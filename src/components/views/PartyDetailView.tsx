'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Receipt,
  Coins,
  BarChart2,
  Share2,
  ArrowLeft,
  MapPin,
  Sparkles,
  FileText,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { PartyTasksBoard } from '@/components/party/PartyTasksBoard';
import { PartyInviteModal } from '@/components/ui/PartyInviteModal';
import { SharedExperienceModal } from '@/components/ui/SharedExperienceModal';
import { Member } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';

export const PartyDetailView: React.FC = () => {
  const {
    parties,
    currentPartyId,
    activities,
    currentUser,
    setCurrentView,
    toggleRsvp,
    goBack,
    listenToActivePartyRealtime,
    loadPartyFromSupabase,
  } = usePartyStore();
  const { t } = useTranslation();

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyActivities = activities.filter((a) => a.partyId === party?.id);
  const isGoing = party?.members.some((m) => m.id === currentUser.id);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    if (party?.id) {
      loadPartyFromSupabase(party.id);
      const unsub = listenToActivePartyRealtime(party.id);
      return () => unsub();
    }
  }, [party?.id, listenToActivePartyRealtime, loadPartyFromSupabase]);

  const handleShare = () => {
    setIsInviteOpen(true);
  };

  const quickActions = [
    {
      id: 'games',
      label: t.partyDetail.quickActions.play,
      icon: Gamepad2,
      color: 'text-[#F0DC00]',
      sub: t.partyDetail.quickActions.playSub,
      onClick: () => setCurrentView('games'),
    },
    {
      id: 'split',
      label: t.partyDetail.quickActions.split,
      icon: Receipt,
      color: 'text-rose-400',
      sub: t.partyDetail.quickActions.splitSub,
      onClick: () => setCurrentView('split'),
    },
    {
      id: 'pot',
      label: t.partyDetail.quickActions.pot,
      icon: Coins,
      color: 'text-amber-300',
      sub: t.partyDetail.quickActions.potSub(party.potBalance.toFixed(2)),
      onClick: () => setCurrentView('party-pot'),
    },
    {
      id: 'polls',
      label: t.partyDetail.quickActions.poll,
      icon: BarChart2,
      color: 'text-sky-400',
      sub: t.partyDetail.quickActions.pollSub,
      onClick: () => setCurrentView('polls'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#15140f] text-white pb-32 select-none">
      {/* Top Floating Navigation Bar (Mobile & Desktop) */}
      <header className="sticky top-0 left-0 right-0 z-40 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-3 safe-top flex items-center justify-between pointer-events-none max-w-[1800px] mx-auto w-full">
        <button
          onClick={goBack}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-button flex items-center justify-center text-white pointer-events-auto shadow-lg"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 pointer-events-auto">
          <LanguageSwitch compact />

          <button
            onClick={() => setCurrentView('recap')}
            className="px-3.5 py-1.5 sm:py-2 rounded-full liquid-glass-button text-xs font-bold flex items-center gap-1.5 text-white/90 shadow-lg"
          >
            <FileText className="w-3.5 h-3.5 text-[#F0DC00]" />
            <span>{t.partyDetail.recap}</span>
          </button>

          <button
            onClick={handleShare}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-button flex items-center justify-center text-white shadow-lg"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Responsive Wrapper */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 -mt-14 pt-14">
        {/* Hero Section: Full bleed on mobile, Cinematic rounded banner on desktop */}
        <div className="relative h-[55vh] sm:h-[60vh] lg:h-[500px] w-full rounded-b-[36px] lg:rounded-[36px] overflow-hidden border border-white/15 shadow-2xl mb-8">
          {/* Background Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={party.coverImage}
            alt={party.title}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#15140f] via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />

          {/* Hero Overlay Details */}
          <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 px-5 sm:px-8 z-20 flex flex-col justify-end">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full liquid-glass-nav text-xs font-extrabold text-[#F0DC00] tracking-wider uppercase">
                {party.date} · {party.time}
              </span>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-[11px] font-mono text-white/90 border border-white/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
                title="Tap to show QR and invite crew"
              >
                <QrCode className="w-3.5 h-3.5 text-[#F0DC00]" />
                <span>{t.partyDetail.codeLabel(party.code)}</span>
              </button>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-white/70 border border-white/10">
                <ShieldCheck className="w-3 h-3 text-[#F0DC00]" />
                {t.partyDetail.privateEvent}
              </span>
            </div>

            <h1 className="bubble text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[0.95] mb-2 drop-shadow-2xl">
              {party.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/90 font-medium mb-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#F0DC00]" />
                {party.location}
              </span>
              <span>•</span>
              <span className="text-white/60">{t.partyDetail.hostedBy(party.hostName)}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/15">
              <AvatarStack
                members={party.members}
                size="md"
                countLabel={t.home.going}
                onMemberClick={(m) => setSelectedMember(m)}
              />

              {/* 3-State RSVP Pill Bar */}
              <div className="flex items-center gap-1.5 p-1 rounded-full liquid-glass-nav border border-white/15">
                <button
                  onClick={() => { if (!isGoing) toggleRsvp(party.id); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isGoing
                      ? 'bg-[#F0DC00] text-[#0C0B0A] shadow-[0_2px_12px_rgba(240,220,0,0.4)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t.partyDetail.rsvpGoing}
                </button>
                <button
                  onClick={() => { if (isGoing) toggleRsvp(party.id); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    !isGoing
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t.partyDetail.rsvpNotGoing}
                </button>
                <button
                  onClick={() => { if (!isGoing) toggleRsvp(party.id); }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  {t.partyDetail.rsvpMaybe}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Party Overview & Guests (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Host & Description */}
            <GlassPanel level={2} className="p-5 sm:p-6 border border-white/15">
              <span className="text-[11px] uppercase font-bold tracking-wider text-white/40 block mb-1">
                {t.partyDetail.aboutTheNight}
              </span>
              <h3 className="font-display font-black text-xl text-white mb-2">
                {t.partyDetail.curatedBy(party.hostName)}
              </h3>
              <p className="text-sm text-white/80 leading-relaxed font-normal mb-4">
                {party.description}
              </p>

              {/* Dress Code & Vibe Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/90">
                  <Sparkles className="w-3.5 h-3.5 text-[#F0DC00]" /> Chic &amp; Stylish
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/90">
                  <span className="text-xs">✨</span> Golden Hour
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/70">
                  <span>🚫</span> Casual
                </span>
              </div>
            </GlassPanel>

            {/* Shared Album Grid */}
            <GlassPanel level={2} className="p-5 sm:p-6 border border-white/15">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F0DC00]" /> {t.partyDetail.sharedAlbum}
                </span>
                <span className="text-[11px] text-[#F0DC00] font-semibold">{t.partyDetail.photosCount(6)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=400&q=80'
                ].map((imgUrl, i) => (
                  <div key={i} className="h-16 sm:h-20 rounded-xl overflow-hidden border border-white/15 relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt="Party memory" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Section: Who's Coming */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <h3 className="font-display font-extrabold text-base tracking-wide text-white uppercase">
                    Who&apos;s Coming ({party.members.length})
                  </h3>
                  <span className="text-[11px] text-white/40">Tap any avatar for mutual chemistry &amp; stats</span>
                </div>
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="text-xs text-[#F0DC00] hover:underline font-bold flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Invite +
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-8 gap-3">
                {party.members.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="p-3 rounded-2xl liquid-glass-card flex flex-col items-center text-center border border-white/10 hover:border-[#F0DC00]/50 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                    title={`View shared experience with ${member.name}`}
                  >
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white/20 p-0.5 shadow-md mb-1.5 group-hover:border-[#F0DC00] flex items-center justify-center bg-black/40">
                      {member.avatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#F0DC00]/20 text-[#F0DC00] flex items-center justify-center font-display font-black text-sm">
                          {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                        </div>
                      )}
                      {member.role === 'host' && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-[#F0DC00] text-black text-[9px] font-black uppercase">
                          HOST
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white/90 truncate w-full group-hover:text-[#F0DC00]">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-white/40 truncate w-full">
                      {member.role === 'host' ? 'Host' : 'Going'}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Social Bounties & Tasks Board */}
            <section className="pt-2">
              <PartyTasksBoard partyId={party.id} />
            </section>
          </div>

          {/* Right Column: Controls Dock & Activity Feed (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Liquid Glass Floating Quick Actions Panel */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  PARTY CONTROLS
                </span>
                <span className="text-[11px] text-[#F0DC00] font-semibold">Touch to interact</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={action.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={action.onClick}
                      className="liquid-glass-card p-4 sm:p-5 rounded-3xl cursor-pointer hover:bg-white/10 transition-all flex flex-col justify-between h-32 group border border-white/15 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 group-hover:scale-110 transition-transform">
                          <Icon className={`w-5 h-5 ${action.color}`} />
                        </div>
                        <span className="text-xs font-bold text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all">
                          →
                        </span>
                      </div>

                      <div>
                        <h4 className="font-display font-black text-lg text-white tracking-tight">
                          {action.label}
                        </h4>
                        <p className="text-xs text-white/50 truncate font-medium">
                          {action.sub}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Section: Live Party Activity Feed */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-display font-extrabold text-base tracking-wide text-white uppercase">
                  Party Activity
                </h3>
                <span className="text-xs text-[#F0DC00] font-semibold">Live feed</span>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
                {partyActivities.length > 0 ? (
                  partyActivities.map((act) => (
                    <GlassPanel
                      key={act.id}
                      level={2}
                      className="p-3.5 flex items-center gap-3 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/20 flex items-center justify-center bg-black/40">
                        {act.avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={act.avatar}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#F0DC00]/20 text-[#F0DC00] flex items-center justify-center font-bold text-xs">
                            P
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-white/90 leading-tight">
                          {act.text}
                        </p>
                        <span className="text-[10px] text-white/40">{act.time}</span>
                      </div>
                    </GlassPanel>
                  ))
                ) : (
                  <p className="text-xs text-white/40 italic p-4 text-center">
                    No activity yet. Be the first to start a game or add to the pot!
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Social & Viral Modals */}
      <PartyInviteModal
        party={party}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      <SharedExperienceModal
        member={selectedMember}
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
};
