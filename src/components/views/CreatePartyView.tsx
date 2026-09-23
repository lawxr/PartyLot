'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Copy, Share2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { SAMPLE_PARTY_COVERS } from '@/data/mockData';
import { Party } from '@/types';
import confetti from 'canvas-confetti';

export const CreatePartyView: React.FC = () => {
  const { createParty, selectParty, goBack } = usePartyStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [partyName, setPartyName] = useState('');
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
        title: partyName || 'SECRET BALCONY',
        date,
        time,
        location,
        description,
        coverImage: selectedCover,
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
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto safe-top safe-bottom select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full liquid-glass-button flex items-center justify-center text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Step Progress Pill */}
        {!createdParty && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-card text-xs font-semibold text-white/70">
            <span>Step {step} of 4</span>
          </div>
        )}

        <div className="w-10" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center py-4">
        <AnimatePresence mode="wait">
          {createdParty ? (
            /* Celebration Screen: YOUR PARTY IS LIVE */
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-[#E9FF32]/20 border border-[#E9FF32]/40 text-[#E9FF32] flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7" />
              </div>

              <span className="text-xs uppercase font-extrabold tracking-widest text-[#E9FF32]">
                CONGRATS
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight mt-1 mb-2">
                YOUR PARTY IS LIVE
              </h2>
              <p className="text-sm text-white/70 max-w-xs mb-6">
                Share this private code with your group. Only people with the code can enter.
              </p>

              {/* Giant Code Box */}
              <GlassPanel level={3} className="p-6 mb-6 w-full max-w-xs border border-white/20">
                <span className="text-[11px] uppercase font-bold text-white/50 tracking-wider">
                  PRIVATE ACCESS CODE
                </span>
                <div className="font-display font-black text-5xl tracking-widest text-[#E9FF32] my-2">
                  {createdParty.code}
                </div>
                <span className="text-xs text-white/60">
                  {createdParty.title} · {createdParty.date}
                </span>
              </GlassPanel>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3">
                <GlassButton
                  variant="accent"
                  size="lg"
                  fullWidth
                  onClick={handleCopyCode}
                  icon={copied ? <Check className="w-5 h-5 text-black" /> : <Copy className="w-5 h-5 text-black" />}
                >
                  {copied ? 'Code Copied!' : 'Copy code'}
                </GlassButton>

                <GlassButton
                  variant="glass"
                  size="lg"
                  fullWidth
                  onClick={handleShare}
                  icon={<Share2 className="w-5 h-5 text-white" />}
                >
                  Share invite
                </GlassButton>

                <button
                  onClick={() => selectParty(createdParty.id)}
                  className="mt-3 text-xs font-bold text-white/60 hover:text-white underline underline-offset-4"
                >
                  Go to Party Detail →
                </button>
              </div>
            </motion.div>
          ) : (
            /* Wizard Steps */
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-center"
            >
              {step === 1 && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#E9FF32]">
                    STEP 01
                  </span>
                  <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight mt-1 mb-6">
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
                      className="w-full px-5 py-4 rounded-2xl liquid-glass-card text-white placeholder-white/30 text-lg font-display font-bold outline-none border border-white/20 focus:border-[#E9FF32] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>Choose Atmosphere Cover</span>
                      <span className="text-[11px] text-[#E9FF32]">{SAMPLE_PARTY_COVERS.length} presets</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {SAMPLE_PARTY_COVERS.map((cover) => (
                        <div
                          key={cover.id}
                          onClick={() => setSelectedCover(cover.url)}
                          className={`relative h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-transform active:scale-95 ${
                            selectedCover === cover.url
                              ? 'border-[#E9FF32] scale-105 shadow-lg'
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
                    STEP 02
                  </span>
                  <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight mt-1 mb-6">
                    When?
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                        Date
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['TONIGHT', 'TOMORROW', 'FRIDAY'].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDate(d)}
                            className={`py-3.5 px-3 rounded-2xl text-xs font-bold transition-all ${
                              date === d
                                ? 'bg-[#E9FF32] text-black shadow-lg scale-[1.02]'
                                : 'liquid-glass-card text-white/80 hover:text-white'
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
                    STEP 03
                  </span>
                  <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight mt-1 mb-6">
                    Where?
                  </h2>

                  <div className="space-y-4">
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
                      <p className="mt-1.5 text-xs text-white/40">
                        Exact apartment or buzzer details are only visible to confirmed members.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                        Vibe & Notes
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white text-sm outline-none border border-white/20 focus:border-[#E9FF32] resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#E9FF32]">
                    STEP 04
                  </span>
                  <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight mt-1 mb-2">
                    Who&apos;s invited?
                  </h2>
                  <p className="text-sm text-white/70 mb-6">
                    We will generate a 4-character encrypted private code. No uninvited guests.
                  </p>

                  {/* Summary Card Preview */}
                  <GlassPanel level={2} className="p-4 mb-4 relative overflow-hidden">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/15">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedCover}
                          alt="Party Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-lg text-white">
                          {partyName || 'Untitled Gathering'}
                        </h4>
                        <p className="text-xs text-[#E9FF32] font-semibold">
                          {date} · {time}
                        </p>
                        <p className="text-xs text-white/50">{location}</p>
                      </div>
                    </div>
                  </GlassPanel>

                  <div className="p-4 rounded-2xl bg-[#E9FF32]/10 border border-[#E9FF32]/25 text-xs text-white/80 leading-relaxed">
                    ✨ Ready to launch. Tapping create will deploy your live private room.
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {!createdParty && (
        <div className="pt-4 flex items-center justify-between gap-3">
          {step > 1 && (
            <GlassButton
              variant="subtle"
              size="md"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
            >
              Back
            </GlassButton>
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
