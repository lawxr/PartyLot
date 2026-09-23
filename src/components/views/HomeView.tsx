'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Calendar, Clock, Sparkles } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ActivityView } from '@/components/views/ActivityView';
import { ProfileView } from '@/components/views/ProfileView';

export const HomeView: React.FC = () => {
  const {
    currentUser,
    parties,
    crews,
    selectParty,
    setCurrentView,
    activeTab,
  } = usePartyStore();

  // If user selected Activity or Profile tab from bottom bar
  if (activeTab === 'activity') {
    return <ActivityView />;
  }

  if (activeTab === 'profile') {
    return <ProfileView />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-28 pt-4 px-4 sm:px-6 max-w-2xl mx-auto safe-top select-none">
      {/* Header */}
      <header className="flex items-center justify-between py-3 mb-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-white/50 font-semibold">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Good evening, <span className="text-[#E9FF32]">{currentUser.name}</span>
          </h2>
        </div>

        {/* Small User Avatar */}
        <button
          onClick={() => setCurrentView('profile')}
          className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white/20 p-0.5 liquid-glass-card shadow-lg active:scale-95 transition-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-full h-full object-cover rounded-full"
          />
        </button>
      </header>

      {/* Main Section: YOUR PARTIES */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-extrabold text-lg tracking-wide uppercase text-white/90">
            YOUR PARTIES
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
            {parties.length} upcoming
          </span>
        </div>

        {/* Horizontal Swipeable Vertical Cards */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-2 pt-1">
          {parties.map((party, idx) => (
            <motion.div
              key={party.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectParty(party.id)}
              className="snap-center shrink-0 w-[280px] sm:w-[320px] h-[440px] rounded-[32px] relative overflow-hidden cursor-pointer shadow-2xl group border border-white/15"
            >
              {/* Background Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={party.coverImage}
                alt={party.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Atmospheric Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

              {/* Top Pill Tags */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-nav text-xs font-bold text-[#E9FF32]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E9FF32] animate-pulse" />
                  {party.date}
                </span>

                <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-mono tracking-wider text-white/90 border border-white/10">
                  CODE {party.code}
                </span>
              </div>

              {/* Bottom Details Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end">
                <h4 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-none mb-2 drop-shadow-lg">
                  {party.title}
                </h4>

                <div className="flex items-center gap-3 text-xs text-white/80 font-medium mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#E9FF32]" />
                    {party.time}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate max-w-[150px]">
                    <MapPin className="w-3.5 h-3.5 text-[#E9FF32]" />
                    {party.location.split('·')[0]}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                  <AvatarStack members={party.members} size="sm" countLabel="going" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#E9FF32] group-hover:translate-x-1 transition-transform">
                    Enter →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Crews Section: YOUR CREWS */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-extrabold text-lg tracking-wide uppercase text-white/90">
            YOUR CREWS
          </h3>
          <span className="text-xs text-white/50">Private circles</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {crews.map((crew) => (
            <GlassPanel
              key={crew.id}
              level={2}
              className="p-3.5 flex items-center gap-3.5 hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 relative border border-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={crew.coverImage}
                  alt={crew.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-display font-bold text-base text-white truncate">
                  {crew.name}
                </h4>
                <p className="text-xs text-white/60 flex items-center gap-2 mt-0.5">
                  <span>{crew.membersCount} members</span>
                  <span>•</span>
                  <span className="text-[#E9FF32]/90">{crew.lastActivity}</span>
                </p>
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* Floating CTA: + Create */}
      <div className="fixed bottom-20 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('create-party')}
          className="accent-button flex items-center gap-2 px-5 py-3.5 rounded-full shadow-2xl font-display font-bold text-sm tracking-tight text-black cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Create Party</span>
        </motion.button>
      </div>
    </div>
  );
};
