'use client';

import React, { useState, useRef, useMemo } from 'react';
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
  Moon,
  Sun,
  Bell,
  Search,
  Lock,
  Globe,
  Calendar,
  Eye,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { usePrivySync } from '@/hooks/usePrivySync';
import { Member, Party } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { EditProfileModal } from '@/components/ui/EditProfileModal';
import { SharedExperienceModal } from '@/components/ui/SharedExperienceModal';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TwitterIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    parties,
    crews,
    selectCrew,
    selectParty,
    updateUser,
    theme,
    toggleTheme,
    toggleStarUser,
    isUserStarred,
    attendedPartyIds,
    addAttendedNight,
  } = usePartyStore();

  const { logout: privyLogout } = usePrivySync();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const [copied, setCopied] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSeeAllPeopleOpen, setIsSeeAllPeopleOpen] = useState(false);
  const [isAddNightOpen, setIsAddNightOpen] = useState(false);
  const [selectedConnectionMember, setSelectedConnectionMember] = useState<Member | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'nights' | 'crews' | 'photos'>('nights');
  const [peopleSearch, setPeopleSearch] = useState('');

  // Add Night Form State
  const [newNightTitle, setNewNightTitle] = useState('');
  const [newNightDate, setNewNightDate] = useState('');

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const activeAddress = currentUser.walletAddress;

  // Real social network connections list
  const peopleConnections: Member[] = useMemo(() => {
    const list: Member[] = [];
    const seen = new Set<string>();

    parties.forEach((p) => {
      (p.members || []).forEach((m) => {
        if (m.id !== currentUser.id && !seen.has(m.id)) {
          seen.add(m.id);
          list.push(m);
        }
      });
    });

    return list;
  }, [currentUser.id, parties]);

  const filteredPeople = useMemo(() => {
    if (!peopleSearch.trim()) return peopleConnections;
    const q = peopleSearch.toLowerCase();
    return peopleConnections.filter(
      (p) => p.name.toLowerCase().includes(q) || p.handle?.toLowerCase().includes(q)
    );
  }, [peopleConnections, peopleSearch]);

  // Attended nights / events
  const attendedPartiesList: Party[] = useMemo(() => {
    const ids = attendedPartyIds || [];
    const found = parties.filter((p) => ids.includes(p.id));
    return found;
  }, [parties, attendedPartyIds]);

  const handleCopyAddress = async () => {
    const toCopy = activeAddress || currentUser.id || 'usr_active';
    await navigator.clipboard.writeText(toCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCustomNight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNightTitle.trim()) return;
    const fakeId = `p-user-${Date.now()}`;
    addAttendedNight(fakeId);
    setNewNightTitle('');
    setNewNightDate('');
    setIsAddNightOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-32 select-none relative overflow-x-hidden transition-colors duration-200">
      {/* Hidden Banner File Input */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const { uploadImageFile } = await import('@/services/storageService');
            const uploadedUrl = await uploadImageFile(file, 'banners');
            await updateUser({ coverImage: uploadedUrl });
          } catch (err) {
            console.error('Failed to upload cover banner:', err);
          }
        }}
      />

      {/* ============================================================== */}
      {/* TOP COVER BANNER */}
      <div className="relative h-64 sm:h-72 md:h-80 w-full md:max-w-3xl lg:max-w-5xl md:mx-auto md:rounded-b-[36px] md:mt-2 md:shadow-lg overflow-hidden">
        {currentUser.coverImage?.startsWith('linear-gradient') ? (
          <div
            style={{ background: currentUser.coverImage }}
            className="absolute inset-0 w-full h-full cursor-pointer"
            onClick={() => bannerInputRef.current?.click()}
            title={isEs ? 'Haz clic para cambiar la portada' : 'Click to change cover'}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUser.coverImage || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80'}
            alt="Profile Cover"
            className="absolute inset-0 w-full h-full object-cover object-top cursor-pointer"
            onClick={() => bannerInputRef.current?.click()}
            title={isEs ? 'Haz clic para cambiar la portada' : 'Click to change cover'}
            loading="eager"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

        {/* Clean Floating Settings Button (Top-Right Only, Exactly Like Reference) */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-[#171512] dark:text-white border border-white/80 dark:border-white/20 shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-4.5 h-4.5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN PROFILE CARD SURFACE                                      */}
      {/* ============================================================== */}
      <div className="relative -mt-8 md:-mt-12 z-20 rounded-t-[34px] md:rounded-[36px] bg-[#FFFDF8] dark:bg-[#1C1A16] border-t md:border border-black/5 dark:border-white/10 px-5 sm:px-6 md:px-10 pt-0 pb-12 shadow-[0_-12px_40px_rgba(65,48,25,0.06)] dark:shadow-[0_-12px_40px_rgba(0,0,0,0.5)] max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto w-full transition-colors duration-200">
        {/* Profile Identity & Stats Header */}
        <div className="md:grid md:grid-cols-12 md:gap-8 md:items-start mb-6">
          <div className="md:col-span-7 lg:col-span-8">
            {/* Circular Avatar Overlapping Cover & Card */}
            <div className="relative -mt-12 mb-2 inline-block">
              <div className="w-24 h-24 sm:w-26 sm:h-26 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white dark:border-[#1C1A16] shadow-md bg-black/10">
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
                className="absolute bottom-0 right-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white dark:bg-[#2C2822] text-[#171512] dark:text-white flex items-center justify-center border border-black/10 dark:border-white/15 shadow-sm active:scale-90 transition-transform cursor-pointer hover:bg-slate-50 dark:hover:bg-[#38332B]"
                aria-label="Change photo"
                title={isEs ? 'Cambiar foto de perfil' : 'Change profile photo'}
              >
                <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Name and Handle */}
            <div className="mb-3">
              <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[#171512] dark:text-white tracking-tight leading-tight">
                {currentUser.name || 'Law'}
              </h2>
              <span className="text-xs sm:text-sm font-semibold text-[#8E887E] dark:text-[#A8A196] block mt-0.5">
                {currentUser.handle?.startsWith('@') ? currentUser.handle : `@${currentUser.handle || 'lawx'}`}
              </span>
            </div>

            {/* Bio & Location */}
            <div className="mb-3">
              <p className="text-xs sm:text-sm text-[#504437] dark:text-[#D1C9BE] font-medium mb-1.5 leading-relaxed">
                {currentUser.bio || 'Good food, better people.'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#8E887E] dark:text-[#A8A196] font-medium">
                <MapPin className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
                <span>{currentUser.location || 'Medellin, Colombia'}</span>
              </div>

              {/* Social Links if present */}
              {(currentUser.website || currentUser.instagram || currentUser.twitter) && (
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  {currentUser.website && (
                    <a
                      href={currentUser.website.startsWith('http') ? currentUser.website : `https://${currentUser.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-semibold text-[#171512] dark:text-white hover:bg-black/10 transition-colors"
                    >
                      <Globe className="w-3 h-3 text-[#F0DC00]" />
                      <span>{currentUser.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {currentUser.instagram && (
                    <a
                      href={`https://instagram.com/${currentUser.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-semibold text-[#171512] dark:text-white hover:bg-black/10 transition-colors"
                    >
                      <InstagramIcon className="w-3 h-3 text-pink-500" />
                      <span>@{currentUser.instagram.replace(/^@/, '')}</span>
                    </a>
                  )}
                  {currentUser.twitter && (
                    <a
                      href={`https://twitter.com/${currentUser.twitter.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-semibold text-[#171512] dark:text-white hover:bg-black/10 transition-colors"
                    >
                      <TwitterIcon className="w-3 h-3 text-sky-400" />
                      <span>@{currentUser.twitter.replace(/^@/, '')}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3 Stats Columns */}
          <div className="md:col-span-5 lg:col-span-4 md:mt-6">
            <div className="grid grid-cols-3 divide-x divide-[#EFE8DD] dark:divide-white/10 text-center my-4 md:my-0 py-2 md:py-4 border-y md:border border-[#EFE8DD] dark:border-white/10 md:rounded-2xl md:bg-black/[0.02] md:dark:bg-white/[0.03]">
              <div>
                <span className="font-display font-black text-xl sm:text-2xl text-[#171512] dark:text-white block">
                  {currentUser.gatheringsCount || 24}
                </span>
                <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                  {isEs ? 'noches' : 'nights'}
                </span>
              </div>
              <div>
                <span className="font-display font-black text-xl sm:text-2xl text-[#171512] dark:text-white block">
                  {crews.length || 8}
                </span>
                <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                  crews
                </span>
              </div>
              <div>
                <span className="font-display font-black text-xl sm:text-2xl text-[#171512] dark:text-white block">
                  {currentUser.gamesCount || 142}
                </span>
                <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                  {isEs ? 'juegos' : 'games'}
                </span>
              </div>
            </div>
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

        {/* ============================================================== */}
        {/* TAB 1: NIGHTS (EVENTS ATTENDED)                                */}
        {/* ============================================================== */}
        {activeProfileTab === 'nights' && (
          <div className="flex items-center gap-2.5 mb-6 overflow-x-auto no-scrollbar pb-1 md:grid md:grid-cols-4 lg:grid-cols-5 md:gap-3.5 md:overflow-visible">
            {attendedPartiesList.map((party) => (
              <div
                key={party.id}
                onClick={() => selectParty(party.id)}
                className="h-26 w-22 sm:h-28 sm:w-24 md:h-36 md:w-full rounded-2xl overflow-hidden shadow-sm shrink-0 border border-black/5 dark:border-white/10 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer relative group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={party.coverImage}
                  alt={party.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5 md:p-2.5">
                  <span className="text-[10px] md:text-xs font-bold text-white leading-tight truncate">
                    {party.title}
                  </span>
                  <span className="text-[8px] md:text-[10px] text-[#F0DC00] font-medium">
                    {party.date}
                  </span>
                </div>
              </div>
            ))}

            {/* Dashed Add Night Squircle Button */}
            <button
              onClick={() => setIsAddNightOpen(true)}
              className="h-26 w-22 sm:h-28 sm:w-24 md:h-36 md:w-full rounded-2xl border-2 border-dashed border-[#D9D1C3] dark:border-white/20 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 flex flex-col items-center justify-center text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-all shrink-0 cursor-pointer active:scale-95 group"
              aria-label={isEs ? 'Registrar noche asistida' : 'Log attended night'}
              title={isEs ? 'Registrar evento asistido' : 'Log attended event'}
            >
              <Plus className="w-5 h-5 stroke-[2.2] group-hover:scale-110 transition-transform" />
              <span className="text-[9px] md:text-xs font-bold mt-1">
                {isEs ? 'Añadir' : 'Add'}
              </span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CREWS CAROUSEL                                          */}
        {/* ============================================================== */}
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

        {/* ============================================================== */}
        {/* TAB 3: PHOTOS GALLERY GRID                                     */}
        {/* ============================================================== */}
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

        {/* ============================================================== */}
        {/* "YOUR PEOPLE" SOCIAL FOLLOW SECTION                             */}
        {/* ============================================================== */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-extrabold text-base text-[#171512] dark:text-white tracking-tight">
              {isEs ? 'Tu gente' : 'Your people'}
            </h3>
            <button
              onClick={() => setIsSeeAllPeopleOpen(true)}
              className="text-xs font-semibold text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isEs ? 'Ver todo' : 'See all'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
            {peopleConnections.slice(0, 3).map((person) => {
              const starred = isUserStarred(person.id);

              return (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-2 md:p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] md:border md:border-black/5 md:dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div
                    onClick={() => setSelectedConnectionMember(person)}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-black/10 dark:border-white/15 shadow-sm shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#171512] dark:text-white block">
                        {person.name}
                      </span>
                      <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                        {person.nightsTogether || 8} {isEs ? 'noches juntos' : 'nights together'}
                      </span>
                    </div>
                  </div>

                  {/* REAL FOLLOW / STAR TOGGLE */}
                  <motion.button
                    onClick={() => toggleStarUser(person.id)}
                    whileTap={{ scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors duration-200 ${
                      starred
                        ? 'bg-[#F0DC00] text-[#171512]'
                        : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#8E887E] dark:text-[#A8A196]'
                    }`}
                    aria-label={`Follow ${person.name}`}
                    title={starred ? (isEs ? 'Siguiendo (estrella)' : 'Following (starred)') : (isEs ? 'Seguir (dar estrella)' : 'Follow (star)')}
                  >
                    <Star
                      className={`w-4 h-4 transition-transform ${
                        starred ? 'fill-current stroke-[1.5] scale-105' : 'stroke-[2]'
                      }`}
                    />
                  </motion.button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ============================================================== */}
      {/* SEE ALL PEOPLE / CONNECTIONS MODAL                             */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isSeeAllPeopleOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSeeAllPeopleOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-[10px]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-md bg-[#FFFDF8] dark:bg-[#1C1A16] rounded-t-[36px] sm:rounded-[36px] p-6 text-[#171512] dark:text-[#F5F1E8] shadow-2xl border border-white/85 dark:border-white/15 safe-bottom max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-[#171512] dark:text-white">
                    {isEs ? 'Tu gente y amigos' : 'Your people & connections'}
                  </h3>
                  <span className="text-xs text-[#8E887E] dark:text-[#A8A196]">
                    {peopleConnections.length} {isEs ? 'contactos en la fiesta' : 'party connections'}
                  </span>
                </div>
                <button
                  onClick={() => setIsSeeAllPeopleOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white hover:bg-black/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex items-center mb-4 shrink-0">
                <Search className="absolute left-3.5 w-4 h-4 text-[#8E887E] dark:text-white/40" />
                <input
                  type="text"
                  placeholder={isEs ? 'Buscar amigos...' : 'Search friends...'}
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-xs focus:border-[#F0DC00] outline-none transition-colors"
                />
              </div>

              {/* People List */}
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {filteredPeople.map((person) => {
                  const starred = isUserStarred(person.id);

                  return (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <div
                        onClick={() => {
                          setIsSeeAllPeopleOpen(false);
                          setSelectedConnectionMember(person);
                        }}
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <div className="w-11 h-11 rounded-full overflow-hidden border border-black/10 dark:border-white/15 shadow-sm shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={person.avatar}
                            alt={person.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[#171512] dark:text-white block">
                            {person.name}
                          </span>
                          <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                            {person.nightsTogether || 5} {isEs ? 'noches juntos' : 'nights together'}
                          </span>
                        </div>
                      </div>

                      <motion.button
                        onClick={() => toggleStarUser(person.id)}
                        whileTap={{ scale: 0.85 }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors duration-200 ${
                          starred
                            ? 'bg-[#F0DC00] text-[#171512]'
                            : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#8E887E] dark:text-[#A8A196]'
                        }`}
                        aria-label={`Follow ${person.name}`}
                      >
                        <Star className={`w-4 h-4 ${starred ? 'fill-current stroke-[1.5]' : 'stroke-[2]'}`} />
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* ADD ATTENDED NIGHT MODAL                                       */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isAddNightOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddNightOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-[10px]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-md bg-[#FFFDF8] dark:bg-[#1C1A16] rounded-t-[36px] sm:rounded-[36px] p-6 text-[#171512] dark:text-[#F5F1E8] shadow-2xl border border-white/85 dark:border-white/15 safe-bottom"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-extrabold text-lg text-[#171512] dark:text-white">
                  {isEs ? 'Registrar noche asistida' : 'Log Attended Night'}
                </h3>
                <button
                  onClick={() => setIsAddNightOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white hover:bg-black/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCustomNight} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider text-[#8E887E] dark:text-[#A8A196] mb-1">
                    {isEs ? 'Nombre de la fiesta / evento' : 'Party / Event Name'}
                  </label>
                  <input
                    type="text"
                    value={newNightTitle}
                    onChange={(e) => setNewNightTitle(e.target.value)}
                    placeholder={isEs ? 'Ej: Rooftop Golden Hour' : 'e.g. Rooftop Golden Hour'}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-sm focus:border-[#F0DC00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold tracking-wider text-[#8E887E] dark:text-[#A8A196] mb-1">
                    {isEs ? 'Fecha' : 'Date'}
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3.5 w-4 h-4 text-[#8E887E]" />
                    <input
                      type="text"
                      value={newNightDate}
                      onChange={(e) => setNewNightDate(e.target.value)}
                      placeholder={isEs ? 'Ej: 24 Sep' : 'e.g. Sep 24'}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-sm focus:border-[#F0DC00] outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddNightOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-black/5 dark:bg-white/10 text-xs font-bold text-[#706B66] dark:text-white/80 cursor-pointer"
                  >
                    {isEs ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-[#F0DC00] text-[#171512] text-xs font-bold hover:brightness-105 cursor-pointer shadow-sm"
                  >
                    {isEs ? 'Registrar noche' : 'Save Night'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* SOCIAL NETWORK SETTINGS & PRIVACY MODAL                        */}
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
              className="relative z-10 w-full max-w-md bg-[#FFFDF8] dark:bg-[#1C1A16] rounded-t-[36px] sm:rounded-[36px] p-6 text-[#171512] dark:text-[#F5F1E8] shadow-2xl border border-white/85 dark:border-white/15 safe-bottom transition-colors duration-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-extrabold text-lg text-[#171512] dark:text-white">
                  {isEs ? 'Configuración y Privacidad' : 'Settings & Privacy'}
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer"
                  aria-label="Cerrar ajustes"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Direct Edit Profile Button */}
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsEditProfileOpen(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#F0DC00]/15 border border-[#F0DC00]/40 text-[#171512] dark:text-[#F0DC00] font-bold text-xs flex items-center justify-between mb-4 cursor-pointer hover:bg-[#F0DC00]/25 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#F0DC00]" />
                  <span>{isEs ? 'Editar perfil completo' : 'Edit Full Profile'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#F0DC00]" />
              </button>

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

              {/* ========================================================== */}
              {/* SOCIAL & PRIVACY SETTINGS (STANDARD SOCIAL CONTROLS)      */}
              {/* ========================================================== */}
              <div className="pt-2 pb-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E887E] dark:text-[#A8A196] block mb-2">
                  {isEs ? 'Privacidad y Red Social' : 'Privacy & Social'}
                </span>

                {/* Private Profile Toggle */}
                <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#171512] dark:text-white block">
                        {isEs ? 'Perfil privado' : 'Private profile'}
                      </span>
                      <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                        {currentUser.isPrivate
                          ? (isEs ? 'Solo conexiones aprobadas' : 'Approved connections only')
                          : (isEs ? 'Visible para todos' : 'Visible to everyone')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => updateUser({ isPrivate: !currentUser.isPrivate })}
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                      currentUser.isPrivate ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                    }`}
                    aria-label="Toggle private profile"
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm"
                    />
                  </button>
                </div>

                {/* Show Attended Nights Toggle */}
                <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#171512] dark:text-white block">
                        {isEs ? 'Mostrar noches asistidas' : 'Show attended nights'}
                      </span>
                      <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                        {currentUser.showNights !== false
                          ? (isEs ? 'Visible en tu perfil' : 'Visible on your profile')
                          : (isEs ? 'Oculto' : 'Hidden')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => updateUser({ showNights: currentUser.showNights === false ? true : false })}
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                      currentUser.showNights !== false ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                    }`}
                    aria-label="Toggle show nights"
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm"
                    />
                  </button>
                </div>

                {/* Allow Follows / Stars Toggle */}
                <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                      <Star className="w-4 h-4 fill-current stroke-[1.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#171512] dark:text-white block">
                        {isEs ? 'Permitir que te sigan (estrella)' : 'Allow follows (stars)'}
                      </span>
                      <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                        {currentUser.allowFollows !== false
                          ? (isEs ? 'Cualquiera puede seguirte' : 'Anyone can star/follow you')
                          : (isEs ? 'Seguimientos deshabilitados' : 'Follows disabled')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => updateUser({ allowFollows: currentUser.allowFollows === false ? true : false })}
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                      currentUser.allowFollows !== false ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                    }`}
                    aria-label="Toggle allow follows"
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm"
                    />
                  </button>
                </div>
              </div>

              {/* ========================================================== */}
              {/* NOTIFICATION PREFERENCES                                   */}
              {/* ========================================================== */}
              <div className="pt-2 pb-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E887E] dark:text-[#A8A196] block mb-2">
                  {isEs ? 'Notificaciones' : 'Notifications'}
                </span>

                <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#171512] dark:text-white block">
                        {isEs ? 'Invitaciones a fiestas' : 'Party invitations'}
                      </span>
                      <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                        {currentUser.notifyInvites !== false
                          ? (isEs ? 'Alertas activas' : 'Active alerts')
                          : (isEs ? 'Silenciadas' : 'Muted')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => updateUser({ notifyInvites: currentUser.notifyInvites === false ? true : false })}
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                      currentUser.notifyInvites !== false ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                    }`}
                    aria-label="Toggle invite notifications"
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm"
                    />
                  </button>
                </div>
              </div>

              {/* ========================================================== */}
              {/* APP PREFERENCES                                           */}
              {/* ========================================================== */}
              <div className="pt-2 pb-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E887E] dark:text-[#A8A196] block mb-2">
                  {isEs ? 'Aplicación' : 'App Preferences'}
                </span>

                {/* Dark Mode Toggle - STRICTLY ACCESSIBLE ONLY HERE */}
                <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                      {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#171512] dark:text-white block">
                        {isEs ? 'Modo oscuro' : 'Dark mode'}
                      </span>
                      <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                        {theme === 'dark' ? (isEs ? 'Activado' : 'Enabled') : (isEs ? 'Desactivado (modo claro)' : 'Disabled (light mode)')}
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

                {/* Language Switch */}
                <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#171512] dark:text-white block">
                        {isEs ? 'Idioma' : 'Language'}
                      </span>
                      <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                        {language === 'es' ? 'Español' : 'English'}
                      </span>
                    </div>
                  </div>
                  <LanguageSwitch compact />
                </div>

                {/* Account ID */}
                <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
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
