'use client';

import React, { useState } from 'react';
import { Plus, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { CreateCrewModal } from '@/components/ui/CreateCrewModal';
import { PressableCard } from '@/components/ui/PressableCard';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const CrewsView: React.FC = () => {
  const { crews, setCurrentView, selectCrew, parties } = usePartyStore();
  const { t, language } = useTranslation();
  const isEs = language === 'es';
  const [isCreateCrewOpen, setIsCreateCrewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary text-primary pb-32 pt-4 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto safe-top select-none w-full transition-colors duration-200">
      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-6 sm:mb-8 border-b border-divider pb-5">
        <div>
          <span className="text-xs uppercase tracking-wider text-secondary font-semibold block mb-0.5">
            {t.crews.subtitle}
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-primary tracking-tight">
            {t.crews.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton
            variant="glass"
            size="md"
            onClick={() => setIsCreateCrewOpen(true)}
            icon={<UserPlus className="w-4 h-4 text-primary" />}
          >
            {t.crews.createCrew}
          </GlassButton>

          <GlassButton
            variant="accent"
            size="md"
            onClick={() => setCurrentView('create-party')}
            icon={<Plus className="w-4 h-4 text-on-party-yellow stroke-[3]" />}
          >
            {t.crews.newGathering}
          </GlassButton>
        </div>
      </header>

      {/* Grid of Crews (Responsive 1-col on mobile, 2-col on tablet, 3-col on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {crews.map((crew) => {
          const activePartiesCount = parties.filter((p) => p.crewId === crew.id).length;
          return (
            <PressableCard
              key={crew.id}
              onClick={() => selectCrew(crew.id)}
              aria-label={crew.name}
              className="flex flex-col justify-between h-[340px] rounded-[24px] bg-surface border border-divider shadow-xs overflow-hidden group hover:shadow-md transition-all"
            >
              {/* Top Photo 60% */}
              <div className="relative h-[180px] w-full overflow-hidden bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={crew.coverImage}
                  alt={crew.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-md text-[11px] font-mono font-bold text-primary shadow-xs">
                    {crew.membersCount} {isEs ? 'MIEMBROS' : 'MEMBERS'}
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
                  <h3 className="font-display font-extrabold text-xl text-primary mb-1 group-hover:text-party-yellow-dark dark:group-hover:text-party-yellow transition-colors">
                    {crew.name}
                  </h3>
                  <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                    {crew.description || (isEs ? 'Círculo íntimo para sesiones privadas y encuentros con amigos.' : 'Private inner circle for secret rooftop sessions and gatherings.')}
                  </p>
                </div>

                <div className="pt-3 border-t border-divider flex items-center justify-between">
                  <span className="text-[11px] font-medium text-secondary">
                    {activePartiesCount} {isEs ? (activePartiesCount === 1 ? 'fiesta activa' : 'fiestas activas') : (activePartiesCount === 1 ? 'active gathering' : 'active gatherings')}
                  </span>
                  <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {isEs ? 'Entrar al Crew' : 'Enter Crew'} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </PressableCard>
          );
        })}
      </div>

      {/* Security Badge Banner */}
      <div className="p-5 rounded-3xl bg-surface border border-divider shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-party-yellow/20 border border-party-yellow/40 flex items-center justify-center shrink-0 text-on-party-yellow dark:text-party-yellow">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-primary">
              {isEs ? 'Círculos Privados' : 'Private Circles'}
            </h4>
            <p className="text-xs text-secondary">
              {isEs
                ? 'La membresía de tu crew es privada y verificada. Sin filtraciones públicas ni invitados desconocidos.'
                : 'Your crew membership is private and verified. No public leaks, zero uninvited guests.'}
            </p>
          </div>
        </div>

        <GlassButton
          variant="glass"
          size="sm"
          onClick={() => setCurrentView('join-party')}
          icon={<Plus className="w-4 h-4 text-primary" />}
        >
          {isEs ? 'Unirse con código' : 'Join with Code'}
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
