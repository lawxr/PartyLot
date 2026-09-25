'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Camera,
  MapPin,
  Plus,
  ChevronRight,
  Star,
  Copy,
  Check,
  LogOut,
  ShieldCheck,
  X,
  Share2,
  Moon,
  Sun,
  Bell,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { usePrivySync } from '@/hooks/usePrivySync';
import { Member } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { EditProfileModal } from '@/components/ui/EditProfileModal';
import { SharedExperienceModal } from '@/components/ui/SharedExperienceModal';

export const ProfileView: React.FC = () => {
  const { currentUser, parties, crews, selectCrew, updateUser, theme, toggleTheme } = usePartyStore();
  const { logout: privyLogout } = usePrivySync();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const [copied, setCopied] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedConnectionMember, setSelectedConnectionMember] = useState<Member | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'nights' | 'crews' | 'photos'>('nights');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const activeAddress = currentUser.walletAddress;

  // Handle banner cover change
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const { uploadImageFile } = await import('@/services/storageService');
      const uploadedUrl = await uploadImageFile(file, 'banners');
      await updateUser({ coverImage: uploadedUrl });
    } catch (err) {
      console.error('Failed to upload cover banner:', err);
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  // Derive authentic connections from parties and crews
  const authenticMembersMap = new Map<string, Member>();
  parties.forEach((p) => {
    (p.members || []).forEach((m) => {
      const isSelf =
        (currentUser.id && m.id === currentUser.id) ||
        (currentUser.name && m.name?.toLowerCase() === currentUser.name?.toLowerCase()) ||
        (currentUser.walletAddress && m.walletAddress && m.walletAddress.toLowerCase() === currentUser.walletAddress.toLowerCase());
      if (!isSelf && (m.id || m.name)) {
        authenticMembersMap.set(m.id || m.name, m);
      }
    });
  });

  const handleCopyAddress = async () => {
    if (!activeAddress) return;
    await navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-32 select-none relative overflow-x-hidden transition-colors duration-200">
      {/* Hidden Banner File Input */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleBannerFileChange}
      />

      {/* ============================================================== */}
      {/* TOP COVER BANNER                                               */}
      {/* ============================================================== */}
      <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentUser.coverImage || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80'}
          alt="Profile Cover"
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Change Banner Button (Top-Left) */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={isUploadingBanner}
            className="px-3 py-1.5 rounded-full bg-white/75 dark:bg-black/60 backdrop-blur-md flex items-center gap-1.5 text-[#171512] dark:text-white border border-white/80 dark:border-white/20 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            aria-label="Change banner photo"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="text-xs font-bold">
              {isUploadingBanner ? (isEs ? 'Subiendo...' : 'Uploading...') : (isEs ? 'Cambiar portada' : 'Change banner')}
            </span>
          </button>
        </div>

        {/* Top-Right Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={async () => {
              if (typeof navigator !== 'undefined' && navigator.share) {
                try {
                  await navigator.share({
                    title: `${currentUser.name} on PartyLot`,
                    url: window.location.href,
                  });
                } catch {
                  // User cancelled share
                }
              } else {
                handleCopyAddress();
              }
            }}
            className="w-10 h-10 rounded-full bg-white/75 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-[#171512] dark:text-white border border-white/80 dark:border-white/20 shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            aria-label="Share profile"
          >
            <Share2 className="w-4 h-4 stroke-[2.2]" />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-white/75 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-[#171512] dark:text-white border border-white/80 dark:border-white/20 shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN PROFILE CARD SURFACE                                      */}
      {/* ============================================================== */}
      <div className="relative -mt-8 z-20 rounded-t-[34px] bg-[#FFFDF8] dark:bg-[#1C1A16] border-t border-black/5 dark:border-white/10 px-5 sm:px-6 md:px-8 pt-0 pb-12 shadow-[0_-12px_40px_rgba(65,48,25,0.06)] dark:shadow-[0_-12px_40px_rgba(0,0,0,0.5)] max-w-md md:max-w-xl lg:max-w-2xl mx-auto w-full transition-colors duration-200">
        {/* Circular Avatar Overlapping Cover & Card */}
        <div className="relative -mt-12 mb-2 inline-block">
          <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-full overflow-hidden border-4 border-white dark:border-[#1C1A16] shadow-md bg-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Small Camera Button on Bottom-Right */}
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-[#2C2822] text-[#171512] dark:text-white flex items-center justify-center border border-black/10 dark:border-white/15 shadow-sm active:scale-90 transition-transform cursor-pointer hover:bg-slate-50 dark:hover:bg-[#38332B]"
            aria-label="Change photo"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>

        {/* Name and Handle */}
        <div className="mb-3">
          <h2 className="font-display font-black text-2xl sm:text-3xl text-[#171512] dark:text-white tracking-tight leading-tight">
            {currentUser.name}
          </h2>
          <span className="text-xs sm:text-sm font-semibold text-[#8E887E] dark:text-[#A8A196] block mt-0.5">
            {currentUser.handle?.startsWith('@') ? currentUser.handle : `@${currentUser.handle || 'lawx'}`}
          </span>
        </div>

        {/* 3 Stats Columns */}
        <div className="grid grid-cols-3 divide-x divide-[#EFE8DD] dark:divide-white/10 text-center my-4 py-2 border-y border-[#EFE8DD] dark:border-white/10">
          <div>
            <span className="font-display font-black text-xl text-[#171512] dark:text-white block">
              {currentUser.gatheringsCount || 24}
            </span>
            <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
              {isEs ? 'noches' : 'nights'}
            </span>
          </div>
          <div>
            <span className="font-display font-black text-xl text-[#171512] dark:text-white block">
              {crews.length || 8}
            </span>
            <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
              crews
            </span>
          </div>
          <div>
            <span className="font-display font-black text-xl text-[#171512] dark:text-white block">
              {currentUser.gamesCount || 142}
            </span>
            <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
              {isEs ? 'juegos' : 'games'}
            </span>
          </div>
        </div>

        {/* Bio & Location */}
        <div className="mb-5">
          <p className="text-xs sm:text-sm text-[#504437] dark:text-[#D1C9BE] font-medium mb-1.5">
            {currentUser.bio || 'Good food, better people.'}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#8E887E] dark:text-[#A8A196] font-medium">
            <MapPin className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>{currentUser.location || 'Medellin, Colombia'}</span>
          </div>
        </div>

        {/* Floating Translucent Glass Options Container */}
        <nav
          className="relative rounded-[27px] p-1.5 sm:p-2 flex items-center justify-between gap-1.5 sm:gap-2 max-w-sm sm:max-w-md mx-auto mb-6 transition-all bg-[rgba(250,248,243,0.78)] dark:bg-[rgba(28,25,22,0.88)] border border-white/90 dark:border-white/15 shadow-[0_10px_25px_rgba(71,55,35,0.14)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          aria-label="Profile options"
        >
          {(
            [
              { id: 'nights', label: isEs ? 'Noches' : 'Nights' },
              { id: 'crews', label: 'Crews' },
              { id: 'photos', label: isEs ? 'Fotos' : 'Photos' },
            ] as const
          ).map((tab) => {
            const isActive = activeProfileTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveProfileTab(tab.id)}
                whileTap={{ scale: 0.96 }}
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(145deg, #ffe973, #ffce18 68%, #f8bf0a)',
                        boxShadow:
                          '0 8px 14px rgba(235, 179, 0, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.72)',
                      }
                    : {
                        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.47)',
                        boxShadow:
                          theme === 'dark'
                            ? '0 3px 9px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                            : '0 3px 9px rgba(74, 56, 35, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                      }
                }
                className={`flex-1 py-2 sm:py-2.5 px-3 rounded-[20px] text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center font-bold tracking-tight ${
                  isActive
                    ? 'text-[#161514] font-black'
                    : 'text-[#706B66] dark:text-[#A8A196] hover:text-[#161514] dark:hover:text-white font-semibold'
                }`}
              >
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Tab 1: Horizontal Thumbnails (3 Photos + 1 Plus Card) */}
        {activeProfileTab === 'nights' && (
          <div className="flex items-center gap-2.5 mb-6 overflow-x-auto no-scrollbar pb-1">
            <div className="h-24 w-20 sm:h-28 sm:w-24 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-black/5 dark:border-white/10 hover:scale-102 transition-transform cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=300&q=80"
                alt="Memory 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-24 w-20 sm:h-28 sm:w-24 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-black/5 dark:border-white/10 hover:scale-102 transition-transform cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80"
                alt="Memory 2"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-24 w-20 sm:h-28 sm:w-24 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-black/5 dark:border-white/10 hover:scale-102 transition-transform cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80"
                alt="Memory 3"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="h-24 w-20 sm:h-28 sm:w-24 rounded-2xl border-2 border-dashed border-[#D9D1C3] dark:border-white/20 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 flex items-center justify-center text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-colors shrink-0 cursor-pointer"
              aria-label="Add photo"
            >
              <Plus className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        )}

        {/* Tab 2: Crews Carousel */}
        {activeProfileTab === 'crews' && (
          <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar pb-1">
            {crews.map((crew) => (
              <div
                key={crew.id}
                onClick={() => selectCrew(crew.id)}
                className="w-36 rounded-2xl overflow-hidden p-2.5 bg-white/70 dark:bg-[#25221D] border border-black/5 dark:border-white/10 shadow-sm hover:scale-[1.02] active:scale-98 transition-all cursor-pointer shrink-0"
              >
                <div className="h-20 w-full rounded-xl overflow-hidden mb-2 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={crew.coverImage}
                    alt={crew.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-bold text-xs text-[#171512] dark:text-white truncate">{crew.name}</h4>
                <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196] font-medium block">
                  {crew.membersCount} {isEs ? 'miembros' : 'members'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Photos Gallery Grid */}
        {activeProfileTab === 'photos' && (
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[
              'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
            ].map((imgSrc, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 hover:scale-[1.02] transition-transform cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt={`Memory ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="aspect-square rounded-2xl border-2 border-dashed border-[#D9D1C3] dark:border-white/20 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 flex items-center justify-center text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Add photo"
            >
              <Plus className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        )}

        {/* "Your people" Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-extrabold text-base text-[#171512] dark:text-white tracking-tight">
              {isEs ? 'Tu gente' : 'Your people'}
            </h3>
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="text-xs font-semibold text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isEs ? 'Ver todo' : 'See all'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Row 1: Sofi */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#F0DC00] p-0.5 shadow-sm shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                    alt="Sofi"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <span className="font-bold text-sm text-[#171512] dark:text-white block">Sofi</span>
                  <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                    12 {isEs ? 'noches juntos' : 'nights together'}
                  </span>
                </div>
              </div>
              <button
                onClick={() =>
                  setSelectedConnectionMember({
                    id: 'u-sofi',
                    name: 'Sofi',
                    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
                  })
                }
                className="w-9 h-9 rounded-full bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer"
                aria-label="Star Sofi"
              >
                <Star className="w-4 h-4 fill-current stroke-[1.5]" />
              </button>
            </div>

            {/* Row 2: Ana */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-black/10 dark:border-white/15 shadow-sm shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
                    alt="Ana"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <span className="font-bold text-sm text-[#171512] dark:text-white block">Ana</span>
                  <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                    9 {isEs ? 'noches juntos' : 'nights together'}
                  </span>
                </div>
              </div>
              <button
                onClick={() =>
                  setSelectedConnectionMember({
                    id: 'u-ana',
                    name: 'Ana',
                    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
                  })
                }
                className="w-9 h-9 rounded-full bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer"
                aria-label="Star Ana"
              >
                <Star className="w-4 h-4 fill-current stroke-[1.5]" />
              </button>
            </div>

            {/* Row 3: Cam */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-black/10 dark:border-white/15 shadow-sm shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Cam"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <span className="font-bold text-sm text-[#171512] dark:text-white block">Cam</span>
                  <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                    8 {isEs ? 'noches juntos' : 'nights together'}
                  </span>
                </div>
              </div>
              <button
                onClick={() =>
                  setSelectedConnectionMember({
                    id: 'u-cam',
                    name: 'Cam',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
                  })
                }
                className="w-9 h-9 rounded-full bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer"
                aria-label="Star Cam"
              >
                <Star className="w-4 h-4 fill-current stroke-[1.5]" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================== */}
      {/* SETTINGS BOTTOM SHEET / MODAL                                  */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-[10px]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-md bg-[#FFFDF8] dark:bg-[#1C1A16] rounded-t-[36px] sm:rounded-[36px] p-6 text-[#171512] dark:text-[#F5F1E8] shadow-2xl border border-white/85 dark:border-white/15 safe-bottom transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-extrabold text-lg text-[#171512] dark:text-white">
                  {isEs ? 'Configuración' : 'Settings'}
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Wallet Info */}
              {activeAddress && (
                <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <span className="text-[10px] font-bold text-[#8E887E] dark:text-[#A8A196] uppercase block">
                        Base Wallet
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#171512] dark:text-white">
                        {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#171512] dark:text-white cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Dark Mode Toggle - STRICTLY ACCESSIBLE ONLY HERE */}
              <div className="flex items-center justify-between py-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">
                      {isEs ? 'Modo oscuro' : 'Dark mode'}
                    </span>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                      {theme === 'dark' ? (isEs ? 'Activado' : 'Enabled') : (isEs ? 'Desactivado' : 'Disabled')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                    theme === 'dark' ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                  }`}
                  aria-label="Toggle dark mode"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm flex items-center justify-center"
                  >
                    {theme === 'dark' ? (
                      <Moon className="w-3 h-3 text-[#F0DC00]" />
                    ) : (
                      <Sun className="w-3 h-3 text-amber-500" />
                    )}
                  </motion.div>
                </button>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">
                      {isEs ? 'Notificaciones' : 'Notifications'}
                    </span>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                      {pushNotifications ? (isEs ? 'Alertas activas' : 'Active alerts') : (isEs ? 'Silenciadas' : 'Muted')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                    pushNotifications ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                  }`}
                  aria-label="Toggle notifications"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm"
                  />
                </button>
              </div>

              {/* Language Switch */}
              <div className="flex items-center justify-between py-3 border-b border-black/5 dark:border-white/10">
                <span className="text-xs font-bold text-[#171512] dark:text-white">
                  {isEs ? 'Idioma' : 'Language'}
                </span>
                <LanguageSwitch compact />
              </div>

              {/* Account ID / Data Info (Real product, zero demo mentions) */}
              <div className="flex items-center justify-between py-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">
                      {isEs ? 'ID de cuenta' : 'Account ID'}
                    </span>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                      {currentUser.id || 'usr_active'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-bold text-[#171512] dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Copiar' : 'Copy')}</span>
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  privyLogout();
                  setIsSettingsOpen(false);
                }}
                className="w-full mt-4 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isEs ? 'Cerrar sesión' : 'Sign out'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      {/* Shared Experience Mutual Chemistry Modal */}
      {selectedConnectionMember && (
        <SharedExperienceModal
          member={selectedConnectionMember}
          isOpen={Boolean(selectedConnectionMember)}
          onClose={() => setSelectedConnectionMember(null)}
        />
      )}
    </div>
  );
};
