'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Share2,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { Party } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import confetti from 'canvas-confetti';
import { uploadImageFile } from '@/services/storageService';

const SAMPLE_PARTY_COVERS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80' },
  { id: '2', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80' },
  { id: '3', url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80' },
  { id: '4', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80' },
  { id: '5', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80' },
  { id: '6', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80' },
];

export const CreatePartyView: React.FC = () => {
  const { createParty, selectParty, goBack, crews, currentCrewId } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [partyName, setPartyName] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState<string>(currentCrewId || '');
  const [selectedCover, setSelectedCover] = useState(SAMPLE_PARTY_COVERS[1].url);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState('TONIGHT');
  const [time, setTime] = useState('10:00 PM');
  const [location, setLocation] = useState('Medellín · Rooftop');
  const [description, setDescription] = useState('Sound system ready, BYOB, good vibes.');

  const [createdParty, setCreatedParty] = useState<Party | null>(null);
  const [copied, setCopied] = useState(false);

  // Fallback demo crews matching the requested design if user has none created yet
  const availableCrews =
    crews.length > 0
      ? crews
      : [
          { id: 'c-404', name: '404 House', membersCount: 12 },
          { id: 'c-uni', name: 'Uni Friends', membersCount: 8 },
          { id: 'c-hack', name: 'Hackathon Crew', membersCount: 6 },
        ];

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setCoverUploadError(null);
    try {
      const url = await uploadImageFile(file, 'party-covers');
      setSelectedCover(url);
    } catch (err) {
      console.error('Failed to upload party cover:', err);
      setCoverUploadError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else {
      const validCrewId = crews.some((c) => c.id === selectedCrewId) ? selectedCrewId : undefined;
      const newParty = createParty({
        title: partyName.trim() || (isEs ? 'Secret Balcony' : 'Secret Balcony'),
        date,
        time,
        location,
        description,
        coverImage: selectedCover,
        crewId: validCrewId,
      });

      setCreatedParty(newParty);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFE600', '#F0DC00', '#FFFFFF', '#FF3B30'],
      });
    }
  };

  const handleCopyCode = async () => {
    if (!createdParty) return;
    await navigator.clipboard.writeText(createdParty.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!createdParty) return;
    const text = `Join my party "${createdParty.title}" on Partylot!\nCode: ${createdParty.code}\nWhen: ${createdParty.date} @ ${createdParty.time}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: createdParty.title, text });
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#FFFDF8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] flex flex-col justify-between overflow-x-hidden transition-colors duration-200">
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-28 sm:pb-32 flex-1 flex flex-col">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-4 sm:mb-6 shrink-0 w-full">
          <button
            type="button"
            onClick={
              createdParty
                ? () => selectParty(createdParty.id)
                : step > 1
                ? () => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
                : goBack
            }
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1C1A16] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center text-[#171512] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-transform active:scale-95 cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Step Counter Pill */}
          {!createdParty && (
            <div className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1C1A16] border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-2 text-xs font-bold text-[#171512] dark:text-white shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600] shrink-0" />
              <span>{isEs ? `Paso ${step} de 4` : `Step ${step} of 4`}</span>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-start w-full">
          <AnimatePresence mode="wait">
            {createdParty ? (
              /* Celebration Screen: PARTY IS LIVE */
              <motion.div
                key="celebration"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex flex-col items-center text-center py-4 my-auto w-full"
              >
                <div className="w-16 h-16 rounded-full bg-[#FFE600]/30 border border-[#FFE600]/50 text-[#171512] dark:text-white flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[#E5A800] dark:text-[#FFE600]" />
                </div>

                <span className="text-xs font-black uppercase tracking-widest text-[#D49B00] dark:text-[#FFE600] mb-1">
                  {isEs ? '¡FIESTA CREADA!' : 'PARTY CREATED!'}
                </span>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-[#171512] dark:text-white tracking-tight mb-2">
                  {createdParty.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#706B66] dark:text-[#A8A196] max-w-sm mb-6 leading-relaxed">
                  {isEs
                    ? 'Comparte el código con tus invitados para que puedan unirse y aportar al bote.'
                    : 'Share the code with your guests so they can join and add to the pot.'}
                </p>

                {/* Code Box */}
                <div className="p-6 mb-6 w-full max-w-xs bg-white dark:bg-[#1C1A16] rounded-[28px] border border-black/5 dark:border-white/10 shadow-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-[#8E887E] dark:text-[#A8A196] tracking-wider block mb-1">
                    {isEs ? 'CÓDIGO DE ENTRADA' : 'INVITE CODE'}
                  </span>
                  <div className="font-display font-black text-4xl sm:text-5xl tracking-widest text-[#171512] dark:text-white my-1">
                    {createdParty.code}
                  </div>
                  <div className="text-xs text-[#8E887E] dark:text-[#A8A196] mt-1 font-medium">
                    {createdParty.date} · {createdParty.time}
                  </div>
                </div>

                {/* Buttons */}
                <div className="w-full max-w-xs space-y-2.5">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="w-full py-3.5 rounded-full bg-[#FFE600] hover:bg-[#F0DC00] text-[#161514] font-display font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? (isEs ? 'Código copiado' : 'Code copied') : (isEs ? 'Copiar código' : 'Copy code')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full py-3.5 rounded-full bg-white dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 text-[#171512] dark:text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isEs ? 'Compartir invitación' : 'Share invite'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectParty(createdParty.id)}
                    className="w-full py-3 text-xs font-bold text-[#706B66] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white cursor-pointer mt-2"
                  >
                    {isEs ? 'Ir a la fiesta ahora →' : 'Go to party now →'}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Multi-step Form */
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {/* STEP 1: Name, Crew, Cover (EXACT MOCKUP MATCH) */}
                {step === 1 && (
                  <div className="w-full">
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#D49B00] dark:text-[#FFE600] block mb-1">
                      {isEs ? 'PASO 1 DE 4' : 'STEP 1 OF 4'}
                    </span>
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-[#171512] dark:text-white tracking-tight leading-[1.15] mb-1.5">
                      {isEs ? '¿Cómo se llama esta noche?' : 'What is tonight called?'}
                    </h1>
                    <p className="text-xs sm:text-[13px] text-[#706B66] dark:text-[#A8A196] leading-relaxed mb-4 sm:mb-5">
                      {isEs
                        ? 'Crea la base de tu plan. Luego eliges fecha, invitados y detalles.'
                        : 'Create the base of your plan. Then choose date, guests, and details.'}
                    </p>

                    {/* FIELD 1: NOMBRE */}
                    <div className="mb-4 sm:mb-5">
                      <label className="block text-[11px] font-black text-[#171512] dark:text-white uppercase tracking-wider mb-1.5">
                        {isEs ? 'NOMBRE' : 'NAME'}
                      </label>
                      <input
                        type="text"
                        value={partyName}
                        onChange={(e) => setPartyName(e.target.value)}
                        placeholder="Ej. 404 House"
                        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#1C1A16] text-[#171512] dark:text-white placeholder-[#A8A196] text-sm sm:text-base font-semibold outline-none border border-black/10 dark:border-white/10 focus:border-[#FFE600] shadow-2xs transition-all"
                      />
                    </div>

                    {/* FIELD 2: CREW (OPCIONAL) */}
                    <div className="mb-4 sm:mb-5">
                      <label className="block text-[11px] font-black text-[#171512] dark:text-white uppercase tracking-wider mb-0.5">
                        {isEs ? 'CREW (OPCIONAL)' : 'CREW (OPTIONAL)'}
                      </label>
                      <p className="text-[11px] text-[#8E887E] dark:text-[#A8A196] mb-2">
                        {isEs ? 'Asócialo a un grupo si quieres.' : 'Link it to a group if you want.'}
                      </p>

                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                          type="button"
                          onClick={() => setSelectedCrewId('')}
                          className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            selectedCrewId === ''
                              ? 'bg-[#FFE600] text-[#171512] shadow-xs'
                              : 'bg-white dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 text-[#171512] dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          {isEs ? 'Sin crew' : 'No crew'}
                        </button>
                        {availableCrews.map((c) => {
                          const isSelected = selectedCrewId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedCrewId(c.id)}
                              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#FFE600] text-[#171512] shadow-xs'
                                  : 'bg-white dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 text-[#171512] dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                            >
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* FIELD 3: PORTADA */}
                    <div className="mb-2">
                      <label className="block text-[11px] font-black text-[#171512] dark:text-white uppercase tracking-wider mb-0.5">
                        {isEs ? 'PORTADA' : 'COVER'}
                      </label>
                      <p className="text-[11px] text-[#8E887E] dark:text-[#A8A196] mb-2">
                        {isEs ? 'Elige una imagen para tu fiesta.' : 'Choose an image for your party.'}
                      </p>

                      {/* Hidden file input */}
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleCoverUpload}
                      />

                      {coverUploadError && (
                        <div className="mb-2 text-xs text-rose-700 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                          {coverUploadError}
                        </div>
                      )}

                      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                        {/* Upload photo card */}
                        <div
                          onClick={() => coverInputRef.current?.click()}
                          className={`w-[76px] h-[112px] sm:w-[84px] sm:h-[124px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer text-center bg-white/40 dark:bg-white/5 ${
                            isUploadingCover
                              ? 'border-[#FFE600] animate-pulse'
                              : !SAMPLE_PARTY_COVERS.some((c) => c.url === selectedCover)
                              ? 'border-[#FFE600] bg-[#FFE600]/10'
                              : 'border-black/15 dark:border-white/15 hover:border-black/30'
                          }`}
                        >
                          {isUploadingCover ? (
                            <div className="w-4 h-4 border-2 border-[#171512] dark:border-white border-t-transparent rounded-full animate-spin" />
                          ) : !SAMPLE_PARTY_COVERS.some((c) => c.url === selectedCover) ? (
                            <div className="relative w-full h-full rounded-2xl overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={selectedCover} alt="Cover" className="w-full h-full object-cover" />
                              <div className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-[#FFE600] text-[#171512] flex items-center justify-center shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-[#171512] dark:text-white" />
                              <span className="text-[10.5px] font-bold text-[#171512] dark:text-white leading-tight">
                                {isEs ? 'Subir\nfoto' : 'Upload\nphoto'}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Preset photo cards */}
                        {SAMPLE_PARTY_COVERS.map((cover) => {
                          const isSelected = selectedCover === cover.url;
                          return (
                            <div
                              key={cover.id}
                              onClick={() => setSelectedCover(cover.url)}
                              className={`w-[76px] h-[112px] sm:w-[84px] sm:h-[124px] rounded-2xl overflow-hidden shrink-0 relative cursor-pointer transition-transform active:scale-95 ${
                                isSelected
                                  ? 'ring-3 ring-[#FFE600] ring-offset-2 ring-offset-[#FFFDF8] dark:ring-offset-[#12110E]'
                                  : 'border border-black/10 dark:border-white/10 opacity-85 hover:opacity-100'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cover.url}
                                alt="Party cover preset"
                                className="w-full h-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-[#FFE600] text-[#171512] flex items-center justify-center shadow-xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: DATE & TIME */}
                {step === 2 && (
                  <div className="w-full">
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#D49B00] dark:text-[#FFE600] block mb-1">
                      {isEs ? 'PASO 2 DE 4' : 'STEP 2 OF 4'}
                    </span>
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-[#171512] dark:text-white tracking-tight leading-[1.15] mb-1.5">
                      {isEs ? '¿Cuándo es el plan?' : 'When is the plan?'}
                    </h1>
                    <p className="text-xs sm:text-[13px] text-[#706B66] dark:text-[#A8A196] leading-relaxed mb-4 sm:mb-5">
                      {isEs
                        ? 'Define la fecha y la hora para que tu gente se prepare.'
                        : 'Set the date and time so your crew can get ready.'}
                    </p>

                    {/* FIELD: FECHA */}
                    <div className="mb-4 sm:mb-5">
                      <label className="block text-[11px] font-black text-[#171512] dark:text-white uppercase tracking-wider mb-2">
                        {isEs ? 'FECHA' : 'DATE'}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['TONIGHT', 'TOMORROW', 'FRIDAY'].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDate(d)}
                            className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center ${
                              date === d
                                ? 'bg-[#FFE600] text-[#171512] shadow-xs'
                                : 'bg-white dark:bg-[#1C1A16] text-[#706B66] dark:text-[#A8A196] border border-black/10 dark:border-white/10 hover:border-black/25'
                            }`}
                          >
                            {d === 'TONIGHT'
                              ? isEs
                                ? 'ESTA NOCHE'
                                : 'TONIGHT'
                              : d === 'TOMORROW'
                              ? isEs
                                ? 'MAÑANA'
                                : 'TOMORROW'
                              : isEs
                              ? 'VIERNES'
                              : 'FRIDAY'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FIELD: HORA */}
                    <div className="mb-4 sm:mb-5">
                      <label className="block text-[11px] font-black text-[#171512] dark:text-white uppercase tracking-wider mb-2">
                        {isEs ? 'HORA' : 'TIME'}
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-[#8E887E] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          placeholder="Ej. 10:00 PM"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-[#1C1A16] text-[#171512] dark:text-white font-mono text-sm sm:text-base font-semibold outline-none border border-black/10 dark:border-white/10 focus:border-[#FFE600] shadow-2xs transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: LOCATION & DETAILS */}
                {step === 3 && (
                  <div className="w-full">
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#D49B00] dark:text-[#FFE600] block mb-1">
                      {isEs ? 'PASO 3 DE 4' : 'STEP 3 OF 4'}
                    </span>
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-[#171512] dark:text-white tracking-tight leading-[1.15] mb-1.5">
                      {isEs ? '¿Dónde es el punto?' : 'Where is the spot?'}
                    </h1>
                    <p className="text-xs sm:text-[13px] text-[#706B66] dark:text-[#A8A196] leading-relaxed mb-4 sm:mb-5">
                      {isEs
                        ? 'Ubicación y detalles clave para los invitados.'
                        : 'Location and key notes for your guests.'}
                    </p>

                    {/* FIELD: UBICACIÓN */}
                    <div className="mb-4 sm:mb-5">
                      <label className="block text-[11px] font-black text-[#171512] dark:text-white uppercase tracking-wider mb-2">
                        {isEs ? 'UBICACIÓN' : 'LOCATION'}
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-[#8E887E] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Ej. Medellín · Rooftop"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-[#1C1A16] text-[#171512] dark:text-white text-sm sm:text-base font-semibold outline-none border border-black/10 dark:border-white/10 focus:border-[#FFE600] shadow-2xs transition-all"
                        />
                      </div>
                      <p className="text-[11px] text-[#8E887E] dark:text-[#A8A196] mt-1.5">
                        {isEs
                          ? 'La dirección exacta está protegida y solo se revela a miembros confirmados.'
                          : 'Exact address is protected and only revealed to confirmed members.'}
                      </p>
                    </div>

                    {/* FIELD: DESCRIPCIÓN */}
                    <div className="mb-4 sm:mb-5">
                      <label className="block text-[11px] font-black text-[#171512] dark:text-white uppercase tracking-wider mb-2">
                        {isEs ? 'NOTAS / DESCRIPCIÓN' : 'NOTES / DESCRIPTION'}
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder={isEs ? 'Traigan sus bebidas, sonido listo, buena vibra.' : 'BYOB, sound ready, good vibes.'}
                        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#1C1A16] text-[#171512] dark:text-white text-sm font-medium outline-none border border-black/10 dark:border-white/10 focus:border-[#FFE600] resize-none shadow-2xs transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & LAUNCH */}
                {step === 4 && (
                  <div className="w-full">
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#D49B00] dark:text-[#FFE600] block mb-1">
                      {isEs ? 'PASO 4 DE 4' : 'STEP 4 OF 4'}
                    </span>
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-[#171512] dark:text-white tracking-tight leading-[1.15] mb-1.5">
                      {isEs ? 'Todo listo para esta noche' : 'All set for tonight'}
                    </h1>
                    <p className="text-xs sm:text-[13px] text-[#706B66] dark:text-[#A8A196] leading-relaxed mb-4 sm:mb-5">
                      {isEs
                        ? 'Revisa el resumen antes de abrir la fiesta.'
                        : 'Review the summary before opening your party.'}
                    </p>

                    {/* Summary Card */}
                    <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 shadow-md mb-4 overflow-hidden">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-24 rounded-2xl overflow-hidden shrink-0 border border-black/10 dark:border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedCover}
                            alt="Party Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display font-black text-lg text-[#171512] dark:text-white truncate">
                            {partyName.trim() || (isEs ? 'Secret Balcony' : 'Secret Balcony')}
                          </h3>
                          <p className="text-xs text-[#D49B00] dark:text-[#FFE600] font-bold mt-0.5">
                            {date} · {time}
                          </p>
                          <p className="text-xs text-[#706B66] dark:text-[#A8A196] truncate mt-1">
                            {location}
                          </p>
                          {selectedCrewId && (
                            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-[#FFE600]/20 text-[#171512] dark:text-white font-bold text-[10px]">
                              {crews.find((c) => c.id === selectedCrewId)?.name || 'Crew'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FFE600]/15 border border-[#FFE600]/30 text-xs text-[#171512] dark:text-white leading-relaxed flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-[#D49B00] dark:text-[#FFE600] shrink-0" />
                      <span>
                        {isEs
                          ? 'Tu tesorería y código de acceso se crearán inmediatamente al continuar.'
                          : 'Your treasury and access code will be generated immediately upon continuing.'}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Fixed Full-Width Bottom Bar without Horizontal Overflow */}
      {!createdParty && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3.5 safe-bottom bg-[#FFFDF8]/95 dark:bg-[#12110E]/95 backdrop-blur-md border-t border-black/5 dark:border-white/10">
          <div className="max-w-lg mx-auto w-full">
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 sm:py-4 rounded-full bg-[#FFE600] hover:bg-[#F0DC00] text-[#161514] font-display font-black text-sm sm:text-base shadow-[0_4px_18px_rgba(240,220,0,0.38)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {step === 4
                  ? isEs
                    ? 'Lanzar fiesta'
                    : 'Launch party'
                  : isEs
                  ? 'Continuar'
                  : 'Continue'}
              </span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};
