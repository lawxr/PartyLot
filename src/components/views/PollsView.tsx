'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassButton } from '@/components/ui/GlassButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const PollsView: React.FC = () => {
  const { parties, currentPartyId, polls, votePoll, createPoll, setCurrentView, goBack } = usePartyStore();
  const { t, language } = useTranslation();
  const isEs = language === 'es';
  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyPolls = polls.filter((p) => p.partyId === party?.id);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);

  const handleVote = (pollId: string, optionId: string) => {
    votePoll(pollId, optionId);
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.6 },
      colors: ['#F0DC00', '#60A5FA'],
    });
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!party?.id || !question.trim()) return;

    createPoll(
      party.id,
      question.trim(),
      options.filter((o) => o.trim().length > 0)
    );

    setQuestion('');
    setOptions(['', '', '']);
    setIsCreateOpen(false);
  };

  const updateOptionText = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  if (!party) {
    return (
      <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] flex flex-col items-center justify-center p-6 text-center transition-colors duration-200">
        <h2 className="font-display font-black text-2xl text-[#171512] dark:text-white mb-2">
          {isEs ? 'Sin fiesta seleccionada' : 'No Party Selected'}
        </h2>
        <p className="text-xs text-[#8E887E] dark:text-[#A8A196] max-w-xs mb-6 leading-relaxed">
          {isEs
            ? 'Selecciona una fiesta para crear o responder encuestas.'
            : 'Select a party to vote or create polls.'}
        </p>
        <button
          onClick={() => {
            if (goBack) goBack();
            else setCurrentView('home');
          }}
          className="accent-button px-6 py-3 rounded-full text-xs font-bold cursor-pointer"
        >
          {isEs ? 'Volver al Inicio' : 'Return Home'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-32 select-none transition-colors duration-200">
      <TopNav title={t.polls.title.toUpperCase()} />

      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto pt-2 w-full">
        {/* Responsive Header */}
        <div className="flex items-end justify-between mb-8 border-b border-[rgba(35,30,22,0.08)] pb-5">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#B89600]">
              {t.polls.subtitle}
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-[#171512] tracking-tight leading-none mt-1">
              {t.polls.title}
            </h2>
          </div>

          <GlassButton
            variant="accent"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus className="w-4 h-4 text-[#171512] stroke-[3]" />}
          >
            {t.polls.createPoll}
          </GlassButton>
        </div>

        {/* Poll Cards Multi-Column Grid on Desktop */}
        {partyPolls.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/[0.08] dark:border-white/10 shadow-sm max-w-md mx-auto">
            <p className="text-sm text-[#6F6A62] dark:text-[#A8A196]">{t.polls.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {partyPolls.map((poll) => (
              <div
                key={poll.id}
                className="p-5 sm:p-6 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/[0.08] dark:border-white/10 rounded-[24px] shadow-[0_4px_20px_rgba(40,30,20,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196]">
                      {t.polls.totalVotes(poll.totalVotes)}
                    </span>
                    <span className="text-[11px] text-[#8E887E] dark:text-[#A8A196]">{poll.createdAt}</span>
                  </div>

                  <h3 className="font-display font-black text-xl sm:text-2xl text-[#171512] dark:text-white tracking-tight mb-5">
                    {poll.question}
                  </h3>
                </div>

              {/* Poll Options with Animated Bars */}
              <div className="space-y-3">
                {poll.options.map((opt) => {
                  const percentage =
                    poll.totalVotes > 0
                      ? Math.round((opt.votes / poll.totalVotes) * 100)
                      : 0;
                  const isSelected = poll.userVoteId === opt.id;

                  return (
                    <motion.div
                      key={opt.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleVote(poll.id, opt.id)}
                      className={`relative p-3.5 sm:p-4 rounded-2xl overflow-hidden cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-[#F0DC00] bg-[#FFF5C0]/40 dark:bg-[#F0DC00]/20 shadow-xs'
                          : 'border-black/[0.08] dark:border-white/10 bg-[#F7F2E8] dark:bg-white/5 hover:border-black/[0.15] dark:hover:border-white/20'
                      }`}
                    >
                      {/* Fluid Background Fill */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className={`absolute inset-y-0 left-0 ${
                          isSelected ? 'bg-[#F0DC00]/30' : 'bg-black/[0.04] dark:bg-white/[0.04]'
                        }`}
                      />

                      {/* Content Overlay */}
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#F0DC00] text-[#171512] flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                          <span className="font-display font-bold text-sm sm:text-base text-[#171512] dark:text-white">
                            {opt.label}
                          </span>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#8E887E] dark:text-[#A8A196]">
                            {opt.votes}
                          </span>
                          <span
                            className={`font-display font-black text-sm sm:text-base ${
                              isSelected ? 'text-[#171512] dark:text-[#F0DC00]' : 'text-[#6F6A62] dark:text-[#A8A196]'
                            }`}
                          >
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      </main>

      {/* BottomSheet: Create Poll */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t.polls.newPollTitle}
      >
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196] mb-1.5">
              {t.polls.questionLabel}
            </label>
            <input
              type="text"
              required
              placeholder={t.polls.questionPlaceholder}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F2E8] dark:bg-white/5 text-[#171512] dark:text-white text-base font-bold outline-none border border-black/10 dark:border-white/15 focus:border-[#F0DC00] placeholder-[#999187] dark:placeholder-white/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196] mb-1.5">
              {t.polls.optionsLabel}
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`${isEs ? 'Opción' : 'Option'} ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updateOptionText(idx, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F7F2E8] dark:bg-white/5 text-[#171512] dark:text-white text-sm outline-none border border-black/10 dark:border-white/15 focus:border-[#F0DC00] placeholder-[#999187] dark:placeholder-white/40"
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              type="submit"
            >
              {t.polls.publish}
            </GlassButton>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
