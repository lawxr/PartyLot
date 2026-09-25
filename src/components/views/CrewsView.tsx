'use client';

import React, { useState } from 'react';
import { Plus, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { CreateCrewModal } from '@/components/ui/CreateCrewModal';

export const CrewsView: React.FC = () => {
  const { crews, setCurrentView, selectCrew, parties } = usePartyStore();
  const [isCreateCrewOpen, setIsCreateCrewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-32 pt-4 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto safe-top select-none w-full transition-colors duration-200">
      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-6 sm:mb-8 border-b border-[rgba(35,30,22,0.08)] dark:border-white/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196] font-semibold block mb-0.5">
            PRIVATE TRUST NETWORKS
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#171512] dark:text-white tracking-tight">
            Your Crews
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton
            variant="glass"
            size="md"
            onClick={() => setIsCreateCrewOpen(true)}
            icon={<UserPlus className="w-4 h-4 text-[#171512] dark:text-white" />}
          >
            Create Crew
          </GlassButton>

          <GlassButton
            variant="accent"
            size="md"
            onClick={() => setCurrentView('create-party')}
            icon={<Plus className="w-4 h-4 text-[#171512] stroke-[3]" />}
          >
            New Gathering
          </GlassButton>
        </div>
      </header>

      {/* Grid of Crews (Responsive 1-col on mobile, 2-col on tablet, 3-col on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {crews.map((crew) => {
          const activePartiesCount = parties.filter((p) => p.crewId === crew.id).length;
          return (
            <div
              key={crew.id}
              onClick={() => selectCrew(crew.id)}
              className="flex flex-col justify-between h-[340px] rounded-[24px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[rgba(35,30,22,0.08)] dark:border-white/10 shadow-[0_4px_24px_rgba(40,30,20,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer group hover:shadow-[0_12px_36px_rgba(40,30,20,0.08)] transition-all"
            >
              {/* Top Photo 60% */}
              <div className="relative h-[180px] w-full overflow-hidden bg-[#F1EADF] dark:bg-[#25221D]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={crew.coverImage}
                  alt={crew.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-[#171512] dark:text-white shadow-sm">
                    {crew.membersCount} MEMBERS
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="text-[11px] font-medium text-white/90 drop-shadow">
                    {crew.lastActivity}
                  </span>
                </div>
              </div>

              {/* Bottom Surface 40% */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-[#171512] dark:text-white mb-1 group-hover:text-[#F0DC00] transition-colors">
                    {crew.name}
                  </h3>
                  <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] line-clamp-2 leading-relaxed">
                    {crew.description || 'Private inner circle for secret rooftop sessions and gatherings.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[rgba(35,30,22,0.06)] dark:border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#8E887E] dark:text-[#A8A196]">
                    {activePartiesCount} active {activePartiesCount === 1 ? 'gathering' : 'gatherings'}
                  </span>
                  <span className="text-xs font-bold text-[#171512] dark:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Enter Crew <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Metropolis Security Badge Banner */}
      <div className="p-5 rounded-3xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[rgba(35,30,22,0.08)] dark:border-white/10 shadow-[0_4px_20px_rgba(40,30,20,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF5C0] dark:bg-[#2C2718] border border-[#F0DC00]/60 dark:border-[#F0DC00]/30 flex items-center justify-center shrink-0 text-[#B89600] dark:text-[#F0DC00]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-[#171512] dark:text-white">
              Sovereign Private Circles
            </h4>
            <p className="text-xs text-[#6F6A62] dark:text-[#A8A196]">
              Your crew membership is backed by cryptographic EIP-712 permits. No public leaks, zero uninvited guests.
            </p>
          </div>
        </div>

        <GlassButton
          variant="glass"
          size="sm"
          onClick={() => setCurrentView('join-party')}
          icon={<Plus className="w-4 h-4 text-[#171512]" />}
        >
          Join with Code
        </GlassButton>
      </div>

      {/* Modal to create a new Crew */}
      <CreateCrewModal
        isOpen={isCreateCrewOpen}
        onClose={() => setIsCreateCrewOpen(false)}
      />
    </div>
  );
};
