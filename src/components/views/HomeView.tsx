'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Clock } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { ActivityView } from '@/components/views/ActivityView';
import { ProfileView } from '@/components/views/ProfileView';
import { CrewsView } from '@/components/views/CrewsView';

export const HomeView: React.FC = () => {
  const {
    currentUser,
    parties,
    crews,
    selectParty,
    setCurrentView,
    activeTab,
  } = usePartyStore();

  // Handle active bottom tab views
  if (activeTab === 'crews') {
    return <CrewsView />;
  }

  if (activeTab === 'activity') {
    return <ActivityView />;
  }

  if (activeTab === 'profile') {
    return <ProfileView />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 pt-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto safe-top select-none w-full">
      {/* Responsive Header */}
      <header className="flex items-center justify-between py-4 mb-6 sm:mb-8 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-wider text-white/50 font-semibold block mb-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
            Good evening, <span className="text-[#E9FF32]">{currentUser.name}</span>
          </h2>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Desktop Create Button */}
          <div className="hidden sm:block">
            <GlassButton
              variant="accent"
              size="md"
              onClick={() => setCurrentView('create-party')}
              icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
            >
              Create Party
            </GlassButton>
          </div>

          {/* User Avatar */}
          <button
            onClick={() => setCurrentView('profile')}
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/20 p-0.5 liquid-glass-card shadow-lg active:scale-95 transition-transform"
            aria-label="Profile"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover rounded-full"
            />
          </button>
        </div>
      </header>

      {/* Main Section: YOUR PARTIES */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-extrabold text-lg sm:text-xl tracking-wide uppercase text-white/90">
              YOUR PARTIES
            </h3>
            <span className="text-xs text-white/50">Active private gatherings</span>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
            {parties.length} upcoming
          </span>
        </div>

        {/* Responsive Layout: Swipeable on mobile, Balanced 3-column Grid on desktop */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-3 pt-1">
          {parties.map((party) => (
            <motion.div
              key={party.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectParty(party.id)}
              className="snap-center shrink-0 w-[290px] sm:w-[320px] md:w-auto h-[440px] sm:h-[480px] lg:h-[500px] rounded-[32px] relative overflow-hidden cursor-pointer shadow-2xl group border border-white/15"
            >
              {/* Background Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={party.coverImage}
                alt={party.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Atmospheric Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />

              {/* Top Pill Tags */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-nav text-xs font-bold text-[#E9FF32]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E9FF32] animate-pulse" />
                  {party.date}
                </span>

                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono tracking-wider text-white/90 border border-white/10">
                  CODE {party.code}
                </span>
              </div>

              {/* Bottom Details Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 lg:p-7 flex flex-col justify-end z-10">
                <h4 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-none mb-2 drop-shadow-lg">
                  {party.title}
                </h4>

                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80 font-medium mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#E9FF32]" />
                    {party.time}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate max-w-[180px]">
                    <MapPin className="w-3.5 h-3.5 text-[#E9FF32]" />
                    {party.location.split('·')[0]}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/15 flex items-center justify-between">
                  <AvatarStack members={party.members} size="sm" countLabel="going" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#E9FF32] group-hover:translate-x-1 transition-transform">
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
          <div>
            <h3 className="font-display font-extrabold text-lg sm:text-xl tracking-wide uppercase text-white/90">
              YOUR CREWS
            </h3>
            <span className="text-xs text-white/50">Private circles</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {crews.map((crew) => (
            <GlassPanel
              key={crew.id}
              level={2}
              className="p-4 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group border border-white/10"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 relative border border-white/15">
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
                <p className="text-xs text-white/60 flex items-center gap-2 mt-1">
                  <span>{crew.membersCount} members</span>
                  <span>•</span>
                  <span className="text-[#E9FF32]/90">{crew.lastActivity}</span>
                </p>
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* Floating CTA: + Create (Mobile Only) */}
      <div className="fixed bottom-20 right-6 z-40 sm:hidden">
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
