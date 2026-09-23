'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, RefreshCw } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassPanel } from '@/components/ui/GlassPanel';
import confetti from 'canvas-confetti';

export const WhosMostLikely: React.FC = () => {
  const { parties, currentPartyId, whosMostLikely, voteWhosMostLikely } = usePartyStore();

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const [questionIndex, setQuestionIndex] = useState(0);
  const [votedMemberId, setVotedMemberId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const currentQ = whosMostLikely[questionIndex % whosMostLikely.length];

  // Calculate highest voted member
  const sortedVotes = Object.entries(currentQ.votes).sort((a, b) => b[1] - a[1]);
  const winnerMemberId = sortedVotes.length > 0 ? sortedVotes[0][0] : null;
  const winnerMember = party.members.find((m) => m.id === winnerMemberId);
  const totalVotes = Object.values(currentQ.votes).reduce((sum, v) => sum + v, 0);

  const handleVote = (memberId: string) => {
    if (votedMemberId) return;
    setVotedMemberId(memberId);
    voteWhosMostLikely(currentQ.id, memberId);

    setTimeout(() => {
      setShowResults(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#E9FF32', '#FFFFFF', '#A855F7'],
      });
    }, 600);
  };

  const handleNextQuestion = () => {
    setVotedMemberId(null);
    setShowResults(false);
    setQuestionIndex((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Question Card */}
      <GlassPanel level={3} className="p-6 mb-6 text-center w-full border border-white/20">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E9FF32]">
          WHO&apos;S MOST LIKELY
        </span>
        <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-2 mb-1 leading-snug">
          &ldquo;{currentQ.question}&rdquo;
        </h3>
        <p className="text-xs text-white/50 mt-2">
          {showResults ? 'Results are locked' : 'Tap an avatar to cast your anonymous vote'}
        </p>
      </GlassPanel>

      {/* Member Avatar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-6">
        {party.members.map((member) => {
          const votesCount = currentQ.votes[member.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
          const isSelected = votedMemberId === member.id;
          const isWinner = winnerMemberId === member.id && showResults;

          return (
            <motion.div
              key={member.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleVote(member.id)}
              className={`p-3.5 rounded-2xl liquid-glass-card flex flex-col items-center cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#E9FF32] bg-[#E9FF32]/10 shadow-[0_0_20px_rgba(233,255,50,0.25)]'
                  : 'hover:border-white/30'
              }`}
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
                {isWinner && (
                  <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#E9FF32] text-black flex items-center justify-center shadow-lg">
                    <Crown className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
              </div>

              <span className="font-display font-bold text-sm text-white truncate max-w-full">
                {member.name}
              </span>

              {/* Animated Progress Bar & Percentage */}
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full mt-2"
                >
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full rounded-full ${isWinner ? 'bg-[#E9FF32]' : 'bg-white/60'}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-white/70">
                    <span>{votesCount} votes</span>
                    <span className={isWinner ? 'text-[#E9FF32]' : ''}>{percentage}%</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Winner Spotlight Banner */}
      <AnimatePresence>
        {showResults && winnerMember && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-4 rounded-2xl bg-[#E9FF32]/10 border border-[#E9FF32]/30 flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E9FF32]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={winnerMember.avatar}
                  alt={winnerMember.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#E9FF32] tracking-wider">
                  CREW CONSENSUS
                </span>
                <p className="font-display font-extrabold text-sm text-white">
                  {winnerMember.name} takes the crown! 👑
                </p>
              </div>
            </div>

            <GlassButton
              variant="accent"
              size="sm"
              onClick={handleNextQuestion}
              icon={<RefreshCw className="w-3.5 h-3.5 text-black" />}
            >
              Next
            </GlassButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
