'use client';

import React, { useState } from 'react';
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
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { SAMPLE_PARTY_COVERS } from '@/data/mockData';
import { Party } from '@/types';
import confetti from 'canvas-confetti';

export const CreatePartyView: React.FC = () => {
  const { createParty, selectParty, goBack, currentUser, crews, currentCrewId } = usePartyStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [partyName, setPartyName] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState<string>(currentCrewId || 'c-404');
  const [selectedCover, setSelectedCover] = useState(SAMPLE_PARTY_COVERS[0].url);
  const [date, setDate] = useState('TONIGHT');
  const [time, setTime] = useState('10:00 PM');
  const [location, setLocation] = useState('Medellín · Rooftop');
  const [description, setDescription] = useState('Sound system ready, BYOB, good vibes.');

  const [createdParty, setCreatedParty] = useState<Party | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else {
      // Step 4 finishes creation
      const newParty = createParty({
        title: partyName.trim() || 'SECRET BALCONY',
        date,
        time,
        location,
        description,
        coverImage: selectedCover,
        crewId: selectedCrewId || undefined,
      });

      setCreatedParty(newParty);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E9FF32', '#FFFFFF', '#FF3B30'],
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
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between p-4 sm:p-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto safe-top safe-bottom select-none w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 w-full shrink-0">
        <button
          onClick={goBack}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-button flex items-center justify-center text-white/80 hover:text-white transition-transform active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Step Progress Pill */}
        {!createdParty && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-card text-xs font-semibold text-white/80 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-[#E9FF32] animate-pulse" />
            <span>Step {step} of 4</span>
          </div>
        )}

        <div className="w-10 sm:w-11" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center py-2 w-full">
        <AnimatePresence mode="wait">
          {createdParty ? (
            /* Celebration Screen: YOUR PARTY IS LIVE (Fully Responsive) */
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4"
            >
              {/* Left Column: Resulting Party Card Preview */}
              <div className="lg:col-span-5 hidden lg:flex flex-col items-center">
                <div className="w-full h-[460px] rounded-[32px] relative overflow-hidden border border-white/20 shadow-2xl group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={createdParty.coverImage}
                    alt={createdParty.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <span className="px-3 py-1 rounded-full liquid-glass-nav text-xs font-bold text-[#E9FF32]">
                      {createdParty.date}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/60 text-xs font-mono text-white/90">
                      CODE {createdParty.code}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <h4 className="font-display font-black text-3xl text-white tracking-tight mb-1">
                      {createdParty.title}
                    </h4>
                    <p className="text-xs text-white/70">{createdParty.location}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Celebration Actions & Code */}
              <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="w-14 h-14 rounded-full bg-[#E9FF32]/20 border border-[#E9FF32]/40 text-[#E9FF32] flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7" />
                </div>

                <span className="text-xs uppercase font-extrabold tracking-widest text-[#E9FF32]">
                  CONGRATS · LIVE ONCHAIN
                </span>
                <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1 mb-2">
                  YOUR PARTY IS LIVE
                </h2>
                <p className="text-sm text-white/70 max-w-md mb-6 leading-relaxed">
                  Share this private code with your group. The smart contract validates attendance using zero-friction EIP-712 permits.
                </p>

                {/* Giant Code Box */}
                <GlassPanel level={3} className="p-6 mb-6 w-full max-w-md border border-white/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase font-bold text-white/50 tracking-wider">
                      PRIVATE ACCESS CODE
                    </span>
                    <span className="text-[11px] font-mono text-[#E9FF32] font-semibold">4-DIGIT PERMIT</span>
                  </div>
                  <div className="font-display font-black text-5xl sm:text-6xl tracking-widest text-[#E9FF32] my-2 text-center">
                    {createdParty.code}
                  </div>
                  <div className="text-xs text-white/60 text-center">
                    {createdParty.title} · {createdParty.date} @ {createdParty.time}
                  </div>
                </GlassPanel>

                {/* Action Buttons */}
                <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
                  <GlassButton
                    variant="accent"
                    size="lg"
                    fullWidth
                    onClick={handleCopyCode}
                    icon={copied ? <Check className="w-5 h-5 text-black" /> : <Copy className="w-5 h-5 text-black" />}
                  >
                    {copied ? 'Code Copied!' : 'Copy Code'}
                  </GlassButton>

                  <GlassButton
                    variant="glass"
                    size="lg"
                    fullWidth
                    onClick={handleShare}
                    icon={<Share2 className="w-5 h-5 text-white" />}
                  >
                    Share Invite
                  </GlassButton>
                </div>

                <button
                  onClick={() => selectParty(createdParty.id)}
                  className="mt-5 text-sm font-bold text-[#E9FF32] hover:underline underline-offset-4 cursor-pointer"
                >
                  Enter Party Room →
                </button>
              </div>
            </motion.div>
          ) : (
            /* Wizard Steps with Desktop Live Preview (Responsive Grid) */
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Live Updating Card Preview (Desktop Only) */}
              <div className="lg:col-span-5 hidden lg:block">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                  <Eye className="w-4 h-4 text-[#E9FF32]" />
                  <span>Live Feed Preview</span>
                </div>

                <div className="w-full h-[460px] rounded-[32px] relative overflow-hidden border border-white/20 shadow-2xl group transition-all">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedCover}
                    alt="Preview cover"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />

                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-nav text-xs font-bold text-[#E9FF32]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E9FF32] animate-pulse" />
                      {date}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono tracking-wider text-white/90 border border-white/10">
                      CODE ????
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <h4 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-none mb-2 drop-shadow-lg">
                      {partyName.trim() || 'UNTITLED GATHERING'}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-white/80 font-medium mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#E9FF32]" />
                        {time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="w-3.5 h-3.5 text-[#E9FF32]" />
                        {location.split('·')[0]}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-white/15 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={currentUser.avatar} alt="host" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs text-white/60">Hosted by you</span>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#E9FF32]">
                        Enter →
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Step Wizard Inputs */}
              <div className="lg:col-span-7 w-full max-w-xl mx-auto lg:max-w-none">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {step === 1 && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#E9FF32]">
                        STEP 01 OF 04
                      </span>
                      <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1 mb-6">
                        What&apos;s the plan?
                      </h2>

                      <div className="mb-6">
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                          Party Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 404 HOUSE, Penthouse DJ Set..."
                          value={partyName}
                          onChange={(e) => setPartyName(e.target.value)}
                          autoFocus
                          className="w-full px-5 py-4 rounded-2xl liquid-glass-card text-white placeholder-white/30 text-lg sm:text-xl font-display font-bold outline-none border border-white/20 focus:border-[#E9FF32] transition-colors"
                        />
                      </div>

                      {/* Crew Selector */}
                      <div className="mb-6">
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Host for which Crew?</span>
                          <span className="text-[11px] text-[#E9FF32] font-mono">Durable Social Circle</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {crews.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedCrewId(c.id)}
                              className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                                selectedCrewId === c.id
                                  ? 'bg-[#E9FF32]/20 border-[#E9FF32] text-white shadow-sm shadow-[#E9FF32]/20'
                                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                              }`}
                            >
                              <span className="block truncate">{c.name}</span>
                              <span className="text-[10px] text-white/40 font-mono block">{c.membersCount} members</span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setSelectedCrewId('')}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                              selectedCrewId === ''
                                ? 'bg-[#E9FF32]/20 border-[#E9FF32] text-white shadow-sm shadow-[#E9FF32]/20'
                                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                            }`}
                          >
                            <span className="block truncate">Standalone</span>
                            <span className="text-[10px] text-white/40 font-mono block">No crew</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                          <span>Choose Atmosphere Cover</span>
                          <span className="text-[11px] text-[#E9FF32] font-mono">{SAMPLE_PARTY_COVERS.length} presets</span>
                        </label>
                        <div className="grid grid-cols-5 gap-2 sm:gap-3">
                          {SAMPLE_PARTY_COVERS.map((cover) => (
                            <div
                              key={cover.id}
                              onClick={() => setSelectedCover(cover.url)}
                              className={`relative h-20 sm:h-24 rounded-2xl overflow-hidden cursor-pointer border-2 transition-transform active:scale-95 ${
                                selectedCover === cover.url
                                  ? 'border-[#E9FF32] scale-105 shadow-[0_0_15px_rgba(233,255,50,0.3)]'
                                  : 'border-white/10 opacity-70 hover:opacity-100'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cover.url}
                                alt={cover.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#E9FF32]">
                        STEP 02 OF 04
                      </span>
                      <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1 mb-6">
                        When is it?
                      </h2>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                            Date Preset
                          </label>
                          <div className="grid grid-cols-3 gap-2.5">
                            {['TONIGHT', 'TOMORROW', 'FRIDAY'].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDate(d)}
                                className={`py-4 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                                  date === d
                                    ? 'bg-[#E9FF32] text-black shadow-lg scale-[1.02]'
                                    : 'liquid-glass-card text-white/80 hover:text-white border border-white/10'
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                            Starting Time
                          </label>
                          <input
                            type="text"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            placeholder="e.g. 10:00 PM"
                            className="w-full px-5 py-4 rounded-2xl liquid-glass-card text-white font-mono text-base outline-none border border-white/20 focus:border-[#E9FF32]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#E9FF32]">
                        STEP 03 OF 04
                      </span>
                      <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1 mb-6">
                        Where is it?
                      </h2>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                            Location / Secret Address
                          </label>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. El Poblado · Secret Rooftop"
                            className="w-full px-5 py-4 rounded-2xl liquid-glass-card text-white font-medium text-base outline-none border border-white/20 focus:border-[#E9FF32]"
                          />
                          <p className="mt-2 text-xs text-white/50">
                            Exact address is encrypted offchain and only revealed to confirmed members.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                            Vibe & Instructions
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Tell the group what to bring, dress code, buzzer instructions..."
                            className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white text-sm outline-none border border-white/20 focus:border-[#E9FF32] resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#E9FF32]">
                        STEP 04 OF 04
                      </span>
                      <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1 mb-2">
                        Ready to launch?
                      </h2>
                      <p className="text-sm text-white/70 mb-6">
                        A unique 4-character encrypted private code will be minted for your inner circle.
                      </p>

                      {/* Summary Card Preview */}
                      <GlassPanel level={2} className="p-5 mb-5 border border-white/20 relative overflow-hidden">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedCover}
                              alt="Party Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-display font-black text-xl text-white">
                              {partyName.trim() || 'Untitled Gathering'}
                            </h4>
                            <p className="text-xs text-[#E9FF32] font-semibold mt-0.5">
                              {date} · {time}
                            </p>
                            <p className="text-xs text-white/60">{location}</p>
                          </div>
                        </div>
                      </GlassPanel>

                      <div className="p-4 rounded-2xl bg-[#E9FF32]/10 border border-[#E9FF32]/25 text-xs text-white/80 leading-relaxed flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-[#E9FF32] shrink-0" />
                        <span>Ready to launch. Your smart contract treasury will be automatically initialized.</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {!createdParty && (
        <div className="pt-6 flex items-center justify-between gap-3 w-full shrink-0 border-t border-white/10 mt-4">
          {step > 1 ? (
            <GlassButton
              variant="subtle"
              size="md"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
            >
              Back
            </GlassButton>
          ) : (
            <div />
          )}

          <div className="flex-1" />

          <GlassButton
            variant="accent"
            size="lg"
            onClick={handleNext}
            icon={step === 4 ? <Sparkles className="w-4 h-4 text-black" /> : <ArrowRight className="w-4 h-4 text-black" />}
          >
            {step === 4 ? 'Create Party' : 'Continue'}
          </GlassButton>
        </div>
      )}
    </div>
  );
};
