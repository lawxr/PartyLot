'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Calendar, Heart, Bell, ChevronRight } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { ActivityView } from '@/components/views/ActivityView';
import { ProfileView } from '@/components/views/ProfileView';
import { CrewsView } from '@/components/views/CrewsView';
import { TokenLogo, CryptoBadge } from '@/components/ui/TokenLogo';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { INITIAL_CREWS } from '@/data/mockData';

export const HomeView: React.FC = () => {
  const {
    currentUser,
    parties,
    crews,
    selectParty,
    setCurrentView,
    activeTab,
    setActiveTab,
  } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';
  const [isFavorited, setIsFavorited] = useState(false);

  const displayCrews = crews.length > 0 ? crews : INITIAL_CREWS;

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

  // Hero party is the active or first party (e.g. 404 House)
  const heroParty = parties[0] || {
    id: 'p-404',
    title: '404 House',
    date: 'Today',
    time: '9:00 PM',
    location: 'Laureles',
    coverImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    members: [],
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-32 pt-2 px-4 sm:px-6 md:px-8 max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-6xl mx-auto safe-top select-none w-full transition-colors duration-200">
      {/* Top Header: Brand Wordmark + Greeting + Notification Icon */}
      <header className="flex items-center justify-between py-3 mb-2 md:py-4 md:mb-4">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#171512] dark:text-white tracking-tight leading-none">
            Partylot
          </h1>
          <p className="text-xs sm:text-sm lg:text-base font-semibold text-[#6F6A62] dark:text-[#A8A196] mt-1 flex items-center gap-1.5">
            <span>👋</span>
            <span>
              {isEs ? `Buenas noches, ${currentUser.name || 'Law'}` : `Good evening, ${currentUser.name || 'Law'}`}
            </span>
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Circular Glass Notification Bell with Yellow Unread Indicator */}
          <button
            onClick={() => setActiveTab('activity')}
            className="relative w-11 h-11 rounded-full glass-light dark:bg-white/10 flex items-center justify-center border border-white/80 dark:border-white/15 shadow-[0_4px_14px_rgba(65,48,25,0.08)] active:scale-95 transition-transform cursor-pointer"
            aria-label="Activity notifications"
          >
            <Bell className="w-5 h-5 text-[#171512] dark:text-white stroke-[2.2]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F0DC00] border-2 border-[#F7F2E8] dark:border-[#12110E] absolute top-2 right-2.5" />
          </button>

          {/* Quick Create Action */}
          <button
            onClick={() => setCurrentView('create-party')}
            className="w-11 h-11 rounded-full bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] flex items-center justify-center font-bold shadow-[0_4px_16px_rgba(240,220,0,0.3)] active:scale-95 transition-transform shrink-0 cursor-pointer"
            aria-label="Create Party"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Main Responsive Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Main Party Card (Hero — Phone 1) */}
        <section className="lg:col-span-7 xl:col-span-8 mb-6 lg:mb-0">
          <motion.div
            whileTap={{ scale: 0.985 }}
            onClick={() => selectParty(heroParty.id)}
            className="w-full aspect-[1.12/1] lg:aspect-[16/10] rounded-[28px] sm:rounded-[32px] relative overflow-hidden cursor-pointer shadow-[0_16px_44px_rgba(65,48,25,0.13)] border border-white/60 group"
          >
          {/* Background Photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroParty.coverImage}
            alt={heroParty.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="eager"
            decoding="async"
          />

          {/* Soft Editorial Gradient Overlay (Only in the lower third as per DESIGN.md) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

          {/* Top Pill Tags & Favorite Action */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            {/* Yellow Tonight Pill */}
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#F0DC00] text-[#171512] font-display font-extrabold text-xs shadow-sm">
              {isEs ? 'Esta noche' : 'Tonight'}
            </span>

            {/* Circular Glass Heart Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFavorited(!isFavorited);
              }}
              className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-white border border-white/60 shadow-sm active:scale-90 transition-transform cursor-pointer"
              aria-label="Favorite party"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isFavorited ? 'fill-[#F0DC00] text-[#F0DC00]' : 'text-white'
                }`}
              />
            </button>
          </div>

          {/* Bottom Details Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex flex-col justify-end z-10">
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-none mb-1.5 drop-shadow-md">
              {heroParty.title}
            </h2>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90 font-medium mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#F0DC00]" />
                {heroParty.date} · {heroParty.time}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#F0DC00]" />
                {heroParty.location.split('·')[0].trim()}
              </span>
            </div>

            {/* Avatar Attendee Stack with Glass +12 Pill */}
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <div className="flex items-center -space-x-2">
                {(heroParty.members || []).slice(0, 5).map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-black/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <span className="px-2.5 py-1 rounded-full glass-light text-white text-[11px] font-bold border border-white/60 ml-2 shadow-sm">
                  +12
                </span>
              </div>

              <span className="text-xs font-bold text-[#F0DC00] group-hover:translate-x-1 transition-transform">
                {isEs ? 'Ver fiesta →' : 'View party →'}
              </span>
            </div>
          </div>
        </motion.div>
      </section>

        {/* Your Crews Section */}
        <section className="lg:col-span-5 xl:col-span-4 lg:col-start-8 xl:col-start-9 lg:row-start-1 mb-8 lg:mb-6">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-[#171512] dark:text-white tracking-tight">
              {isEs ? 'Tus crews' : 'Your crews'}
            </h3>
            <button
              onClick={() => setActiveTab('crews')}
              className="text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>{isEs ? 'Ver todos' : 'See all'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Cards Grid (Horizontal scroll on mobile, sleek list cards on desktop) */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3.5 lg:gap-3">
            {displayCrews.slice(0, 3).map((crew) => (
              <motion.div
                key={crew.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  usePartyStore.getState().selectCrew(crew.id);
                  setCurrentView('crew-detail');
                }}
                className="rounded-[20px] overflow-hidden bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/[0.07] dark:border-white/10 shadow-[0_6px_20px_rgba(65,48,25,0.06)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:shadow-md transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center lg:h-20"
              >
                {/* Top Photo on mobile / Left square on desktop */}
                <div className="h-24 sm:h-28 lg:h-full lg:w-20 w-full overflow-hidden relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={crew.coverImage}
                    alt={crew.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Bottom on mobile / Right text info on desktop */}
                <div className="p-2.5 lg:px-3.5 lg:py-2 bg-[#FFFDF8] dark:bg-[#1C1A16] flex flex-col justify-between flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-[#171512] dark:text-white truncate">
                        {crew.name}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-[#6F6A62] dark:text-[#A8A196] font-medium mt-0.5">
                        {crew.membersCount} {isEs ? 'miembros' : 'members'}
                      </p>
                    </div>
                    <ChevronRight className="hidden lg:block w-4 h-4 text-[#8E887E] dark:text-[#A8A196] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>

                  {/* Tiny Avatar Stack */}
                  <div className="flex items-center -space-x-1.5 mt-2 pt-1 border-t border-black/[0.05] dark:border-white/10 lg:mt-1 lg:pt-0.5 lg:border-t-0">
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-white dark:border-[#1C1A16] bg-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                        alt="member"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-white dark:border-[#1C1A16] bg-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80"
                        alt="member"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-white dark:border-[#1C1A16] bg-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                        alt="member"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Upcoming Section */}
        <section className="lg:col-span-7 xl:col-span-8 lg:row-start-2 mb-6">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-[#171512] dark:text-white tracking-tight">
              {isEs ? 'Próximas fiestas' : 'Upcoming'}
            </h3>
            <button
              onClick={() => setActiveTab('activity')}
              className="text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>{isEs ? 'Ver todas' : 'See all'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Upcoming Party Card */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const nextParty = parties[1] || parties[0];
              if (nextParty) selectParty(nextParty.id);
            }}
            className="rounded-[24px] p-3 sm:p-3.5 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/[0.07] dark:border-white/10 shadow-[0_8px_24px_rgba(65,48,25,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 sm:gap-4"
          >
            {/* Square Photo with Date Overlay */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-[18px] overflow-hidden relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
                alt="Rooftop Dinner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-white text-center">
                <span className="text-[10px] font-extrabold tracking-wider uppercase opacity-90 block leading-tight">
                  {isEs ? 'VIE' : 'FRI'}
                </span>
                <span className="text-xs font-black block leading-tight">
                  Sep 26
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-black text-sm sm:text-base text-[#171512] dark:text-white truncate">
                Rooftop Dinner
              </h4>
              <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] font-semibold mt-0.5 mb-2 truncate">
                8:00 PM · El Poblado
              </p>

              {/* Avatar Stack +6 */}
              <div className="flex items-center -space-x-1.5">
                {[
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
                ].map((avatar, idx) => (
                  <div
                    key={idx}
                    className="w-5 h-5 rounded-full overflow-hidden border border-white dark:border-[#1C1A16] bg-black/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt="attendee" className="w-full h-full object-cover" />
                  </div>
                ))}
                <span className="text-[10px] font-bold text-[#8E887E] dark:text-[#A8A196] pl-2">
                  +6
                </span>
              </div>
            </div>

            {/* Right Arrow Chevron */}
            <div className="text-[#8E887E] dark:text-[#A8A196] pr-1">
              <ChevronRight className="w-5 h-5" />
            </div>
          </motion.div>
        </section>

        {/* Desktop-Only Monad Treasury Quick Widget */}
        <section className="hidden lg:block lg:col-span-5 xl:col-span-4 lg:col-start-8 xl:col-start-9 lg:row-start-2 mb-6">
          <div className="rounded-[24px] p-5 bg-gradient-to-br from-[#836EF9]/10 via-[#2775CA]/10 to-transparent border border-[#836EF9]/25 shadow-[0_8px_24px_rgba(131,110,249,0.08)] backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TokenLogo token="usdc" size="sm" />
                <span className="text-xs font-bold text-[#171512] dark:text-white uppercase tracking-wider">
                  {isEs ? 'Tesorería Monad' : 'Monad Treasury'}
                </span>
              </div>
              <CryptoBadge token="usdc" network="Monad" />
            </div>

            <div className="mb-4">
              <span className="text-xs text-[#6F6A62] dark:text-[#A8A196] font-medium block">
                {isEs ? 'Bote activo' : 'Active Party Pot'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-bubble text-3xl text-[#171512] dark:text-white tracking-tight">
                  ${heroParty?.potBalance ? heroParty.potBalance.toFixed(2) : '186.40'}
                </span>
                <span className="text-xs font-bold text-[#836EF9]">USDC</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  selectParty(heroParty.id);
                  setCurrentView('party-pot');
                }}
                className="flex-1 py-2.5 px-3 rounded-full bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] font-display font-extrabold text-xs text-center shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                {isEs ? 'Ver pozo' : 'View pot'}
              </button>
              <button
                onClick={() => {
                  selectParty(heroParty.id);
                  setCurrentView('split');
                }}
                className="py-2.5 px-3 rounded-full bg-white/70 dark:bg-white/10 hover:bg-white text-[#171512] dark:text-white font-display font-bold text-xs border border-black/10 dark:border-white/15 transition-transform active:scale-95 cursor-pointer"
              >
                {isEs ? 'Dividir gastos' : 'Split expenses'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
