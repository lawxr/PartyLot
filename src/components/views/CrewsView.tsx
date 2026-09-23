'use client';

import React, { useState } from 'react';
import { Plus, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { CreateCrewModal } from '@/components/ui/CreateCrewModal';

export const CrewsView: React.FC = () => {
  const { crews, setCurrentView, selectCrew, parties } = usePartyStore();
  const [isCreateCrewOpen, setIsCreateCrewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#15140f] text-white pb-32 pt-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto safe-top select-none w-full">
      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-6 sm:mb-8 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-wider text-white/50 font-semibold block mb-0.5">
            PRIVATE TRUST NETWORKS
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            Your Crews
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton
            variant="glass"
            size="md"
            onClick={() => setIsCreateCrewOpen(true)}
            icon={<UserPlus className="w-4 h-4 text-[#F0DC00]" />}
          >
            Create Crew
          </GlassButton>

          <GlassButton
            variant="accent"
            size="md"
            onClick={() => setCurrentView('create-party')}
            icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
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
            <GlassPanel
              key={crew.id}
              level={2}
              onClick={() => selectCrew(crew.id)}
              className="p-5 flex flex-col justify-between h-64 relative overflow-hidden border border-white/15 hover:border-white/30 transition-all cursor-pointer group"
            >
            {/* Background Cover Thumbnail with Fade */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={crew.coverImage}
              alt={crew.name}
              className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-105 group-hover:opacity-35 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full liquid-glass-nav text-[10px] font-mono font-bold text-[#F0DC00]">
                {crew.membersCount} MEMBERS
              </span>
              <span className="text-[11px] text-white/50">{crew.lastActivity}</span>
            </div>

            <div className="relative z-10">
              <h3 className="font-display font-black text-2xl text-white mb-1 group-hover:text-[#F0DC00] transition-colors">
                {crew.name}
              </h3>
              <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                {crew.description || 'Private inner circle for secret rooftop sessions and festival adventures.'}
              </p>

              <div className="pt-3 mt-3 border-t border-white/15 flex items-center justify-between">
                <span className="text-[11px] font-mono text-white/70">
                  {activePartiesCount} active {activePartiesCount === 1 ? 'gathering' : 'gatherings'}
                </span>
                <span className="text-xs font-bold text-[#F0DC00] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Enter Crew <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </GlassPanel>
          );
        })}
      </div>

      {/* Metropolis Security Badge Banner */}
      <div className="p-5 rounded-3xl liquid-glass-card border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-[#F0DC00]/20 border border-[#F0DC00] flex items-center justify-center shrink-0 text-[#F0DC00]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-white">
              Sovereign Private Circles
            </h4>
            <p className="text-xs text-white/60">
              Your crew membership is backed by cryptographic EIP-712 permits. No public leaks, zero uninvited guests.
            </p>
          </div>
        </div>

        <GlassButton
          variant="glass"
          size="sm"
          onClick={() => setCurrentView('join-party')}
          icon={<Plus className="w-4 h-4 text-white" />}
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
