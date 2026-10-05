'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Calendar, Heart, Bell, ChevronRight, Sparkles, KeyRound } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { ActivityView } from '@/components/views/ActivityView';
import { ProfileView } from '@/components/views/ProfileView';
import { CrewsView } from '@/components/views/CrewsView';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';

export const HomeView: React.FC = () => {
  const {
    currentUser,
    parties,
    crews,
    selectParty,
    setCurrentView,
    activeTab,
    setActiveTab,
    activities,
  } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';
  const [isFavorited, setIsFavorited] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const displayCrews = crews;

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

  // Hero party is the active or first party
  const heroParty = parties[0] || null;

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
        <div className="flex items-center gap-2.5 relative">
          {/* Circular Glass Notification Bell with Yellow Unread Indicator */}
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className={`relative w-11 h-11 rounded-full ${
              isNotificationsOpen
                ? 'bg-[#F0DC00] text-[#171512] shadow-[0_4px_16px_rgba(240,220,0,0.35)]'
                : 'glass-light dark:bg-white/10 text-[#171512] dark:text-white border border-white/80 dark:border-white/15 shadow-[0_4px_14px_rgba(65,48,25,0.08)]'
            } flex items-center justify-center active:scale-95 transition-all cursor-pointer p-0`}
            aria-label={isEs ? 'Notificaciones' : 'Notifications'}
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="w-5 h-5 stroke-[2.2]" />
            {activities.length > 0 && !isNotificationsOpen && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#F0DC00] border-2 border-[#F7F2E8] dark:border-[#12110E] absolute top-2 right-2.5" />
            )}
          </button>

          {/* Floating Notifications Popover */}
          <NotificationsPopover
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />

          {/* Quick Create Action */}
          <button
            onClick={() => setCurrentView('create-party')}
            className="w-11 h-11 rounded-full bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] flex items-center justify-center font-bold shadow-[0_4px_16px_rgba(240,220,0,0.3)] active:scale-95 transition-transform shrink-0 cursor-pointer p-0"
            aria-label="Create Party"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Main Responsive Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Main Party Card (Hero) */}
        <section className="lg:col-span-7 xl:col-span-8 mb-6 lg:mb-0">
          {!heroParty ? (
            <div className="w-full rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/[0.07] dark:border-white/10 shadow-[0_12px_36px_rgba(65,48,25,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)] flex flex-col justify-between min-h-[220px] sm:min-h-[260px]">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0DC00]/20 text-[#171512] dark:text-[#F0DC00] font-display font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#F0DC00]" />
                  {isEs ? 'Comienza la noche' : 'Start the night'}
                </span>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-[#171512] dark:text-white tracking-tight leading-tight mt-3">
                  {isEs ? 'No tienes fiestas activas' : 'No active parties yet'}
                </h2>
                <p className="text-xs sm:text-sm text-[#6F6A62] dark:text-[#A8A196] font-medium mt-1.5 max-w-md">
                  {isEs
                    ? 'Organiza una fiesta con tus amigos o ingresa el código de una reunión para unirte.'
                    : 'Host a gathering with your friends or enter an invite code to join.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-6">
                <button
                  onClick={() => setCurrentView('create-party')}
                  className="accent-button flex items-center justify-center gap-2 py-3 px-5 rounded-full text-sm font-bold shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isEs ? 'Crear fiesta' : 'Create party'}</span>
                </button>
                <button
                  onClick={() => setCurrentView('join-party')}
                  className="pill-outline flex items-center justify-center gap-2 py-3 px-5 rounded-full text-sm font-bold cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 stroke-[2]" />
                  <span>{isEs ? 'Unirse con código' : 'Join with code'}</span>
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              whileTap={{ scale: 0.985 }}
              onClick={() => selectParty(heroParty.id)}
              className="w-full aspect-[1.12/1] lg:aspect-[16/10] rounded-[28px] sm:rounded-[32px] relative overflow-hidden cursor-pointer shadow-[0_16px_44px_rgba(65,48,25,0.13)] border border-white/60 group"
            >
              {/* Background Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroParty.coverImage || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'}
                alt={heroParty.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="eager"
                decoding="async"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

              {/* Top Pill Tags & Favorite Action */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#F0DC00] text-[#171512] font-display font-extrabold text-xs shadow-sm">
                  {heroParty.date || (isEs ? 'Esta noche' : 'Tonight')}
                </span>

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
                    {heroParty.date} {heroParty.time ? `· ${heroParty.time}` : ''}
                  </span>
                  {heroParty.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#F0DC00]" />
                        {heroParty.location.split('·')[0].trim()}
                      </span>
                    </>
                  )}
                </div>

                {/* Avatar Attendee Stack - Real dynamic attendees */}
                <div className="flex items-center justify-between pt-2 border-t border-white/20">
                  <div className="flex items-center -space-x-2">
                    {(heroParty.members || []).slice(0, 4).map((m, idx) => (
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
                    {(heroParty.members || []).length > 4 && (
                      <span className="px-2.5 py-1 rounded-full glass-light text-white text-[11px] font-bold border border-white/60 ml-2 shadow-sm">
                        +{(heroParty.members || []).length - 4}
                      </span>
                    )}
                    {(!heroParty.members || heroParty.members.length === 0) && (
                      <span className="text-xs text-white/80 font-medium">
                        {isEs ? 'Sé el primero en unirte' : 'Be the first to join'}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-[#F0DC00] group-hover:translate-x-1 transition-transform">
                    {isEs ? 'Ver fiesta →' : 'View party →'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
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

          {/* Crews cards or empty state */}
          {displayCrews.length === 0 ? (
            <div
              onClick={() => setActiveTab('crews')}
              className="rounded-[20px] p-4 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-dashed border-black/15 dark:border-white/15 text-center cursor-pointer hover:border-[#F0DC00] transition-colors"
            >
              <p className="text-xs font-semibold text-[#6F6A62] dark:text-[#A8A196]">
                {isEs ? 'Aún no perteneces a ningún crew.' : 'No crews yet.'}
              </p>
              <span className="text-xs font-bold text-[#171512] dark:text-white mt-1 inline-block">
                {isEs ? 'Explorar crews →' : 'Explore crews →'}
              </span>
            </div>
          ) : (
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
                      {(crew.members && crew.members.length > 0 ? crew.members.slice(0, 3) : []).map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className="w-4 h-4 rounded-full overflow-hidden border border-white dark:border-[#1C1A16] bg-black/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                            alt={m.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {(crew.membersCount || 0) > 3 && (
                        <span className="text-[9px] font-bold text-[#8E887E] dark:text-[#A8A196] pl-1.5">
                          +{crew.membersCount - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Section */}
        <section className="lg:col-span-7 xl:col-span-8 lg:row-start-2 mb-6">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-[#171512] dark:text-white tracking-tight">
              {isEs ? 'Próximas fiestas' : 'Upcoming'}
            </h3>
            {parties.length > 1 && (
              <button
                onClick={() => setActiveTab('activity')}
                className="text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>{isEs ? 'Ver todas' : 'See all'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Upcoming Party Card */}
          {(() => {
            const upcomingParties = parties.slice(1);
            if (upcomingParties.length === 0) {
              return (
                <div
                  onClick={() => setCurrentView('create-party')}
                  className="rounded-[24px] p-5 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-dashed border-black/15 dark:border-white/15 text-center cursor-pointer hover:border-[#F0DC00] transition-colors"
                >
                  <p className="font-bold text-sm text-[#171512] dark:text-white">
                    {parties.length === 0
                      ? (isEs ? 'No hay fiestas próximas. ¡Crea una!' : 'No upcoming parties. Create one!')
                      : (isEs ? 'No tienes más fiestas programadas.' : 'No more upcoming parties scheduled.')}
                  </p>
                </div>
              );
            }

            const nextParty = upcomingParties[0];
            return (
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => selectParty(nextParty.id)}
                className="rounded-[24px] p-3 sm:p-3.5 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/[0.07] dark:border-white/10 shadow-[0_8px_24px_rgba(65,48,25,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 sm:gap-4"
              >
                {/* Square Photo with Date Overlay */}
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-[18px] overflow-hidden relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={nextParty.coverImage || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'}
                    alt={nextParty.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-center p-1">
                    <span className="text-[10px] font-extrabold tracking-wider uppercase opacity-90 block leading-tight">
                      {nextParty.date}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-black text-sm sm:text-base text-[#171512] dark:text-white truncate">
                    {nextParty.title}
                  </h4>
                  <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] font-semibold mt-0.5 mb-2 truncate">
                    {nextParty.time} · {nextParty.location}
                  </p>

                  {/* Avatar Stack */}
                  <div className="flex items-center -space-x-1.5">
                    {(nextParty.members || []).slice(0, 4).map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="w-5 h-5 rounded-full overflow-hidden border border-white dark:border-[#1C1A16] bg-black/20"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {(nextParty.members || []).length > 4 && (
                      <span className="text-[10px] font-bold text-[#8E887E] dark:text-[#A8A196] pl-2">
                        +{nextParty.members.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Arrow Chevron */}
                <div className="text-[#8E887E] dark:text-[#A8A196] pr-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </motion.div>
            );
          })()}
        </section>
      </div>
    </div>
  );
};
