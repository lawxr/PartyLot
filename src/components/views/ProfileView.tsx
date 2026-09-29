'use client';

import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Camera,
  MapPin,
  Plus,
  ChevronRight,
  Star,
  Globe,
  Users,
  Zap,
  ArrowRightLeft,
  Trophy,
  Calendar,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { Member, Party } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { EditProfileModal } from '@/components/ui/EditProfileModal';
import { SharedExperienceModal } from '@/components/ui/SharedExperienceModal';
import { ProfilePeopleModal } from '@/components/profile/ProfilePeopleModal';
import { ProfileAddNightModal } from '@/components/profile/ProfileAddNightModal';
import { ProfileSettingsModal } from '@/components/profile/ProfileSettingsModal';
import { CreateCrewModal } from '@/components/ui/CreateCrewModal';

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
    toggleStarUser,
    isUserStarred,
    attendedPartyIds,
    addAttendedNight,
    createParty,
    setActiveGame,
    setCurrentView,
    whosMostLikely,
    thisOrThat,
  } = usePartyStore();

  const { language } = useTranslation();
  const isEs = language === 'es';

  const [copied, setCopied] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSeeAllPeopleOpen, setIsSeeAllPeopleOpen] = useState(false);
  const [isAddNightOpen, setIsAddNightOpen] = useState(false);
  const [isCreateCrewOpen, setIsCreateCrewOpen] = useState(false);
  const [selectedConnectionMember, setSelectedConnectionMember] = useState<Member | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'nights' | 'crews' | 'games'>('nights');

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

  // Attended nights / events (real gatherings hosted, joined, or attended)
  const attendedPartiesList: Party[] = useMemo(() => {
    const ids = new Set(attendedPartyIds || []);
    return parties.filter(
      (p) =>
        ids.has(p.id) ||
        p.hostId === currentUser.id ||
        (p.members || []).some((m) => m.id === currentUser.id)
    );
  }, [parties, attendedPartyIds, currentUser.id]);

  const handleCopyAddress = async () => {
    const toCopy = activeAddress || currentUser.id || 'usr_active';
    await navigator.clipboard.writeText(toCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCustomNight = (title: string, date: string) => {
    const created = createParty({
      title: title || (isEs ? 'Noche de Fiesta' : 'Party Night'),
      date: date || (isEs ? 'Hoy' : 'Tonight'),
      time: '10:00 PM',
      location: currentUser.location || (isEs ? 'Medellín' : 'Local'),
      description: isEs ? 'Noche registrada en mi perfil.' : 'Night logged from my profile.',
      coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    });
    if (created?.id) {
      addAttendedNight(created.id);
    }
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

          {/* 3 Stats Columns (Real Metrics Only) */}
          <div className="md:col-span-5 lg:col-span-4 md:mt-6">
            <div className="grid grid-cols-3 divide-x divide-[#EFE8DD] dark:divide-white/10 text-center my-4 md:my-0 py-2 md:py-4 border-y md:border border-[#EFE8DD] dark:border-white/10 md:rounded-2xl md:bg-black/[0.02] md:dark:bg-white/[0.03]">
              <div>
                <span className="font-display font-black text-xl sm:text-2xl text-[#171512] dark:text-white block">
                  {attendedPartiesList.length || currentUser.gatheringsCount || 0}
                </span>
                <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                  {isEs ? 'noches' : 'nights'}
                </span>
              </div>
              <div>
                <span className="font-display font-black text-xl sm:text-2xl text-[#171512] dark:text-white block">
                  {crews.length}
                </span>
                <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                  crews
                </span>
              </div>
              <div>
                <span className="font-display font-black text-xl sm:text-2xl text-[#171512] dark:text-white block">
                  {currentUser.gamesCount || (whosMostLikely.some((q) => Object.keys(q.votes || {}).length > 0) ? 1 : 0)}
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
              { id: 'games', label: isEs ? 'Juegos' : 'Games' },
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
          <div>
            {attendedPartiesList.length > 0 ? (
              <div className="flex items-center gap-2.5 mb-6 overflow-x-auto no-scrollbar pb-1 md:grid md:grid-cols-4 lg:grid-cols-5 md:gap-3.5 md:overflow-visible">
                {attendedPartiesList.map((party) => (
                  <div
                    key={party.id}
                    onClick={() => selectParty(party.id)}
                    className="h-28 w-24 sm:h-32 sm:w-26 md:h-36 md:w-full rounded-2xl overflow-hidden shadow-xs shrink-0 border border-black/5 dark:border-white/10 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer relative group bg-[#EFEAE2] dark:bg-[#1F1C18]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={party.coverImage}
                      alt={party.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 md:p-2.5">
                      <span className="text-[11px] md:text-xs font-bold text-white leading-tight truncate">
                        {party.title}
                      </span>
                      <span className="text-[9px] md:text-[10px] text-[#F0DC00] font-semibold mt-0.5">
                        {party.date}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Dashed Add Night Squircle Button */}
                <button
                  onClick={() => setIsAddNightOpen(true)}
                  className="h-28 w-24 sm:h-32 sm:w-26 md:h-36 md:w-full rounded-2xl border-2 border-dashed border-[#D9D1C3] dark:border-white/20 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 flex flex-col items-center justify-center text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-all shrink-0 cursor-pointer active:scale-95 group"
                  aria-label={isEs ? 'Registrar noche asistida' : 'Log attended night'}
                  title={isEs ? 'Registrar evento asistido' : 'Log attended event'}
                >
                  <Plus className="w-5 h-5 stroke-[2.2] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] md:text-xs font-bold mt-1">
                    {isEs ? 'Añadir' : 'Add'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="p-7 rounded-[26px] bg-[#FFFDF8] dark:bg-[#1A1815] border border-black/5 dark:border-white/10 shadow-xs text-center flex flex-col items-center justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center text-[#B89600] mb-3">
                  <Calendar className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h4 className="font-display font-bold text-base text-[#171512] dark:text-white mb-1">
                  {isEs ? 'Sin noches registradas aún' : 'No nights logged yet'}
                </h4>
                <p className="text-xs text-[#8E887E] dark:text-[#A8A196] max-w-xs leading-relaxed mb-4">
                  {isEs
                    ? 'Las fiestas a las que asistas o crees se guardarán automáticamente en tu historial de noches.'
                    : 'Gatherings you attend or host will be saved here in your profile history.'}
                </p>
                <button
                  onClick={() => setIsAddNightOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F0DC00] text-[#171512] text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  {isEs ? 'Registrar primera noche' : 'Log first night'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CREWS CAROUSEL                                          */}
        {/* ============================================================== */}
        {activeProfileTab === 'crews' && (
          <div>
            {crews.length > 0 ? (
              <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar pb-1">
                {crews.map((crew) => (
                  <div
                    key={crew.id}
                    onClick={() => selectCrew(crew.id)}
                    className="w-40 rounded-2xl overflow-hidden p-2.5 bg-white/70 dark:bg-[#25221D] border border-black/5 dark:border-white/10 shadow-xs hover:scale-[1.02] active:scale-98 transition-all cursor-pointer shrink-0 group"
                  >
                    <div className="h-24 w-full rounded-xl overflow-hidden mb-2 relative bg-[#EFEAE2] dark:bg-[#1A1815]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={crew.coverImage}
                        alt={crew.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {crew.ownerId === currentUser.id && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-bold text-[#F0DC00] uppercase tracking-wider">
                          {isEs ? 'Líder' : 'Owner'}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-[#171512] dark:text-white truncate">{crew.name}</h4>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196] font-medium block mt-0.5">
                      {crew.membersCount} {isEs ? 'miembros' : 'members'}
                    </span>
                  </div>
                ))}

                {/* Add Crew Button */}
                <button
                  onClick={() => setIsCreateCrewOpen(true)}
                  className="w-40 h-[156px] rounded-2xl border-2 border-dashed border-[#D9D1C3] dark:border-white/20 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 flex flex-col items-center justify-center text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-all shrink-0 cursor-pointer active:scale-95 group"
                  aria-label={isEs ? 'Crear crew' : 'Create crew'}
                >
                  <Plus className="w-5 h-5 stroke-[2.2] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] md:text-xs font-bold mt-1">
                    {isEs ? 'Crear Crew' : 'Create Crew'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="p-7 rounded-[26px] bg-[#FFFDF8] dark:bg-[#1A1815] border border-black/5 dark:border-white/10 shadow-xs text-center flex flex-col items-center justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center text-[#B89600] mb-3">
                  <Users className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h4 className="font-display font-bold text-base text-[#171512] dark:text-white mb-1">
                  {isEs ? 'Sin crews aún' : 'No crews yet'}
                </h4>
                <p className="text-xs text-[#8E887E] dark:text-[#A8A196] max-w-xs leading-relaxed mb-4">
                  {isEs
                    ? 'Crea un grupo de confianza con tus amigos más cercanos para compartir fiestas, fondos y recuerdos.'
                    : 'Create a private crew with your close friends to share parties, pots, and memories.'}
                </p>
                <button
                  onClick={() => setIsCreateCrewOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F0DC00] text-[#171512] text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  {isEs ? 'Crear primer crew' : 'Create first crew'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: GAMES (MINIGAMES & REALTIME PARTY SESSIONS)              */}
        {/* ============================================================== */}
        {activeProfileTab === 'games' && (
          <div className="space-y-3 mb-6">
            {/* Game 1: Who's Most Likely */}
            <div className="p-4 rounded-[24px] bg-white/70 dark:bg-[#1E1B17] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-between gap-3.5 hover:border-black/15 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF5C0] dark:bg-[#F0DC00]/15 border border-[#F0DC00]/40 flex items-center justify-center text-[#B89600] shrink-0">
                  <Zap className="w-6 h-6 fill-[#F0DC00]" />
                </div>
                <div className="text-left">
                  <h4 className="font-display font-bold text-sm sm:text-base text-[#171512] dark:text-white leading-tight">
                    {isEs ? '¿Quién es más probable?' : "Who's Most Likely?"}
                  </h4>
                  <p className="text-xs text-[#8E887E] dark:text-[#A8A196] mt-0.5 line-clamp-1">
                    {isEs ? 'Vota por quién encaja en cada situación' : 'Vote on who fits each prompt best'}
                  </p>
                  <span className="text-[10px] font-semibold text-[#B89600] mt-1 inline-block">
                    {whosMostLikely.length} {isEs ? 'preguntas disponibles' : 'prompts available'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveGame('whos-most-likely');
                  setCurrentView('games');
                }}
                className="px-4 py-2 rounded-full bg-[#F0DC00] text-[#171512] text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
              >
                {isEs ? 'Jugar' : 'Play'}
              </button>
            </div>

            {/* Game 2: This or That */}
            <div className="p-4 rounded-[24px] bg-white/70 dark:bg-[#1E1B17] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-between gap-3.5 hover:border-black/15 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] dark:bg-[#836EF9]/15 border border-[#836EF9]/30 flex items-center justify-center text-[#674FF4] shrink-0">
                  <ArrowRightLeft className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="text-left">
                  <h4 className="font-display font-bold text-sm sm:text-base text-[#171512] dark:text-white leading-tight">
                    This or That
                  </h4>
                  <p className="text-xs text-[#8E887E] dark:text-[#A8A196] mt-0.5 line-clamp-1">
                    {isEs ? 'Desliza estilo cartas y compara votos' : 'Swipe card-style and compare votes'}
                  </p>
                  <span className="text-[10px] font-semibold text-[#674FF4] mt-1 inline-block">
                    {thisOrThat.length} {isEs ? 'tarjetas interactivas' : 'interactive cards'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveGame('this-or-that');
                  setCurrentView('games');
                }}
                className="px-4 py-2 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
              >
                {isEs ? 'Jugar' : 'Play'}
              </button>
            </div>

            {/* Game 3: Lore & Trivia */}
            <div className="p-4 rounded-[24px] bg-white/70 dark:bg-[#1E1B17] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-between gap-3.5 hover:border-black/15 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#D1FAE5] dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                  <Trophy className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="text-left">
                  <h4 className="font-display font-bold text-sm sm:text-base text-[#171512] dark:text-white leading-tight">
                    {isEs ? 'Trivia de la Crew' : 'Crew Trivia'}
                  </h4>
                  <p className="text-xs text-[#8E887E] dark:text-[#A8A196] mt-0.5 line-clamp-1">
                    {isEs ? 'Demuestra quién conoce más anécdotas' : 'Compete on crew memories and history'}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1 inline-block">
                    5 {isEs ? 'rondas competitivas' : 'competitive rounds'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveGame('crew-trivia');
                  setCurrentView('games');
                }}
                className="px-4 py-2 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
              >
                {isEs ? 'Jugar' : 'Play'}
              </button>
            </div>
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
                        {person.nightsTogether ?? 1} {isEs ? 'noches juntos' : 'nights together'}
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

      {/* Extracted Modals */}
      <ProfilePeopleModal
        isOpen={isSeeAllPeopleOpen}
        onClose={() => setIsSeeAllPeopleOpen(false)}
        peopleConnections={peopleConnections}
        onSelectMember={(member) => setSelectedConnectionMember(member)}
      />

      <ProfileAddNightModal
        isOpen={isAddNightOpen}
        onClose={() => setIsAddNightOpen(false)}
        onSubmit={handleAddCustomNight}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        activeAddress={activeAddress}
        copied={copied}
        onCopyAddress={handleCopyAddress}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      {/* Create Crew Modal */}
      <CreateCrewModal
        isOpen={isCreateCrewOpen}
        onClose={() => setIsCreateCrewOpen(false)}
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
