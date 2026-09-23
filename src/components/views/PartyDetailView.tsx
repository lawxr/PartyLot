'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Receipt,
  Coins,
  BarChart2,
  Share2,
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { formatPartyInviteText } from '@/services/party';

export const PartyDetailView: React.FC = () => {
  const {
    parties,
    currentPartyId,
    activities,
    currentUser,
    setCurrentView,
    toggleRsvp,
    goBack,
  } = usePartyStore();

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyActivities = activities.filter((a) => a.partyId === party.id);
  const isGoing = party.members.some((m) => m.id === currentUser.id);

  const handleShare = async () => {
    const text = formatPartyInviteText(party);
    if (navigator.share) {
      try {
        await navigator.share({ title: party.title, text });
      } catch {
        await navigator.clipboard.writeText(text);
        alert('Invite link copied!');
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Invite link copied to clipboard!');
    }
  };

  const quickActions = [
    {
      id: 'games',
      label: 'PLAY',
      icon: Gamepad2,
      color: 'text-[#E9FF32]',
      sub: '3 minigames',
      onClick: () => setCurrentView('games'),
    },
    {
      id: 'split',
      label: 'SPLIT',
      icon: Receipt,
      color: 'text-rose-400',
      sub: 'Damage calculator',
      onClick: () => setCurrentView('split'),
    },
    {
      id: 'pot',
      label: 'POT',
      icon: Coins,
      color: 'text-amber-300',
      sub: `$${party.potBalance.toFixed(2)} active`,
      onClick: () => setCurrentView('party-pot'),
    },
    {
      id: 'polls',
      label: 'POLL',
      icon: BarChart2,
      color: 'text-sky-400',
      sub: 'Live voting',
      onClick: () => setCurrentView('polls'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 select-none">
      {/* 55-65vh Cinematic Hero Section */}
      <div className="relative h-[60vh] sm:h-[65vh] w-full overflow-hidden">
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={party.coverImage}
          alt={party.title}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Cinematic Vignettes and Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />

        {/* Top Navigation Bar Floating */}
        <div className="absolute top-0 left-0 right-0 z-30 px-4 py-3 safe-top flex items-center justify-between">
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full liquid-glass-button flex items-center justify-center text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('recap')}
              className="px-3 py-1.5 rounded-full liquid-glass-button text-xs font-bold flex items-center gap-1.5 text-white/90"
            >
              <FileText className="w-3.5 h-3.5 text-[#E9FF32]" />
              <span>Recap</span>
            </button>

            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full liquid-glass-button flex items-center justify-center text-white"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Overlay Content */}
        <div className="absolute bottom-6 left-0 right-0 px-5 sm:px-8 z-20 max-w-2xl mx-auto flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full liquid-glass-nav text-xs font-extrabold text-[#E9FF32] tracking-wider uppercase">
              {party.date} · {party.time}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-white/80 border border-white/10">
              CODE: {party.code}
            </span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight leading-[0.95] mb-2 drop-shadow-2xl">
            {party.title}
          </h1>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-white/90 font-medium mb-3">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#E9FF32]" />
              {party.location}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <AvatarStack members={party.members} size="md" countLabel="going" />

            <button
              onClick={() => toggleRsvp(party.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                isGoing
                  ? 'bg-white/20 backdrop-blur-md text-white border border-white/25'
                  : 'bg-[#E9FF32] text-black shadow-lg shadow-[#E9FF32]/25'
              }`}
            >
              {isGoing ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E9FF32]" />
                  <span>RSVP Confirmed</span>
                </>
              ) : (
                <>
                  <span>Join / RSVP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="px-4 sm:px-6 max-w-2xl mx-auto -mt-2 relative z-30">
        {/* Host & Description */}
        <div className="mb-6 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-white/40">
              Host
            </span>
            <span className="text-xs font-bold text-white">Hosted by {party.hostName}</span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed font-normal">
            {party.description}
          </p>
        </div>

        {/* Liquid Glass Floating Quick Actions Panel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">
              PARTY CONTROLS
            </span>
            <span className="text-[11px] text-[#E9FF32] font-semibold">Touch to interact</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.onClick}
                  className="liquid-glass-card p-4 rounded-3xl cursor-pointer hover:bg-white/10 transition-all flex flex-col justify-between h-28 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 group-hover:scale-110 transition-transform">
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <span className="text-[10px] font-bold text-white/40 group-hover:text-white/80 transition-colors">
                      →
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-black text-lg text-white tracking-tight">
                      {action.label}
                    </h3>
                    <p className="text-[11px] text-white/50 truncate font-medium">
                      {action.sub}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Section: Who's Coming */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-extrabold text-base tracking-wide text-white uppercase">
              Who&apos;s Coming ({party.members.length})
            </h3>
            <span className="text-xs text-white/40">Private guest list</span>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {party.members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16 text-center"
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 p-0.5 liquid-glass-card shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                  {member.role === 'host' && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-[#E9FF32] text-black text-[9px] font-black uppercase">
                      HOST
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold text-white/90 truncate w-full">
                  {member.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Party Activity Feed */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-extrabold text-base tracking-wide text-white uppercase">
              Party Activity
            </h3>
            <span className="text-xs text-[#E9FF32] font-semibold">Live updates</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {partyActivities.length > 0 ? (
              partyActivities.map((act) => (
                <GlassPanel
                  key={act.id}
                  level={2}
                  className="p-3.5 flex items-center gap-3 border border-white/10"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={act.avatar}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
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
              <p className="text-xs text-white/40 italic p-3">No activity yet. Be the first to start a game or add to the pot!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
