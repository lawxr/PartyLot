'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import confetti from 'canvas-confetti';

export const PollsView: React.FC = () => {
  const { parties, currentPartyId, polls, votePoll, createPoll } = usePartyStore();
  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyPolls = polls.filter((p) => p.partyId === party.id);

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
    if (!question.trim()) return;

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

  return (
    <div className="min-h-screen bg-[#15140f] text-white pb-32 select-none">
      <TopNav title="GROUP POLLS" />

      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto pt-2 w-full">
        {/* Responsive Header */}
        <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-5">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F0DC00]">
              REAL-TIME DECISIONS
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-none mt-1">
              CREW POLLS
            </h2>
          </div>

          <GlassButton
            variant="accent"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
          >
            Create Poll
          </GlassButton>
        </div>

        {/* Poll Cards Multi-Column Grid on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {partyPolls.map((poll) => (
            <GlassPanel
              key={poll.id}
              level={2}
              className="p-5 sm:p-6 border border-white/15 hover:border-white/25 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    {poll.totalVotes} TOTAL VOTES
                  </span>
                  <span className="text-[11px] text-white/40">{poll.createdAt}</span>
                </div>

                <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight mb-5">
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
                          ? 'border-[#F0DC00] shadow-[0_0_15px_rgba(240, 220, 0,0.2)]'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      {/* Fluid Background Fill */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className={`absolute inset-y-0 left-0 ${
                          isSelected ? 'bg-[#F0DC00]/25' : 'bg-white/10'
                        }`}
                      />

                      {/* Content Overlay */}
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#F0DC00] text-black flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                          <span className="font-display font-bold text-sm sm:text-base text-white">
                            {opt.label}
                          </span>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <span className="text-xs font-semibold text-white/50">
                            {opt.votes}
                          </span>
                          <span
                            className={`font-display font-black text-sm sm:text-base ${
                              isSelected ? 'text-[#F0DC00]' : 'text-white/80'
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
            </GlassPanel>
          ))}
        </div>
      </main>

      {/* BottomSheet: Create Poll */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Group Poll"
      >
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Question
            </label>
            <input
              type="text"
              required
              placeholder="e.g. What should we play next?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white text-base font-bold outline-none border border-white/20 focus:border-[#F0DC00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Options
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updateOptionText(idx, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl liquid-glass-card text-white text-sm outline-none border border-white/10 focus:border-[#F0DC00]"
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
              Post Poll
            </GlassButton>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
