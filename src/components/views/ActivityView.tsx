'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import {
  Sparkles,
  DollarSign,
  Vote,
  Gamepad2,
  UserPlus,
  Receipt,
  Coins,
  BarChart3,
  Calendar,
  MapPin,
  ArrowRight,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getCoverUrl, getAvatarUrl } from '@/lib/imageOptimization';
import { MonadLogo } from '@/components/ui/TokenLogo';
import {
  fetchEnvioActivities,
} from '@/lib/web3/envio';
import { subscribeToMonadHyperIndex } from '@/lib/web3/hyperindex';
import { ActivityItem } from '@/types';

/**
 * Tonight View
 *
 * Minimalist Airbnb-inspired command center with Partylot warm aesthetics:
 * - Active Gathering Hero Card
 * - Direct Actions Grid (Play, Split, Pot, Poll)
 * - Night Timeline & Live Activity Feed
 */
export const ActivityView: React.FC = () => {
  const {
    activities,
    parties,
    currentPartyId,
    selectParty,
    crews,
    setCurrentView,
  } = usePartyStore();
  const { t, language } = useTranslation();
  const isEs = language === 'es';
  const [filterType, setFilterType] = useState<string>('all');
  const [envioActivities, setEnvioActivities] = useState<ActivityItem[]>([]);
  const [realtimeActivities, setRealtimeActivities] = useState<ActivityItem[]>([]);

  const activeParty =
    parties.find((p) => p.id === currentPartyId) || parties[0] || null;
  const associatedCrew = crews.find((c) => c.id === activeParty?.crewId);

  // Fetch Envio indexed activities and subscribe to sub-second events
  useEffect(() => {
    let isMounted = true;

    fetchEnvioActivities(activeParty?.id).then((items) => {
      if (!isMounted || !items || items.length === 0) return;
      const mapped: ActivityItem[] = items.map((item) => {
        let mappedType: ActivityItem['type'] = 'pot';
        if (item.type === 'MEMBER_JOINED' || item.type === 'PARTY_CREATED') mappedType = 'join';
        else if (item.type === 'DEBT_SETTLED' || item.type === 'REIMBURSEMENT') mappedType = 'expense';
        else if (item.type === 'DEPOSIT' || item.type === 'REWARD' || item.type === 'ROLLOVER') mappedType = 'pot';
        else if (item.type === 'GATHERING' || item.type === 'TIE_UPDATED') mappedType = 'join';

        return {
          id: item.id,
          partyId: item.partyId || activeParty?.id || '',
          text: `${item.title} — ${item.subtitle}`,
          time: item.blockTimestamp
            ? new Date(item.blockTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
          avatar: '',
          type: mappedType,
          txHash: item.transactionHash,
          blockNumber: item.blockNumber,
          isEnvioIndexed: true,
        };
      });
      setEnvioActivities(mapped);
    });

    // Sub-second Monad Event Pipeline
    const unwatch = subscribeToMonadHyperIndex((ev) => {
      if (!isMounted) return;
      const newAct: ActivityItem = {
        id: ev.id,
        partyId: activeParty?.id || '',
        text: ev.title,
        time: 'Just now',
        avatar: '',
        type: ev.type === 'deposit' || ev.type === 'reward' ? 'pot' : 'join',
        txHash: ev.txHash,
        blockNumber: ev.blockNumber,
        isEnvioIndexed: true,
      };
      setRealtimeActivities((prev) => [newAct, ...prev.filter((p) => p.id !== newAct.id)]);
    });

    return () => {
      isMounted = false;
      unwatch();
    };
  }, [activeParty?.id]);

  const allActivities = useMemo(() => {
    const combined = [...realtimeActivities, ...envioActivities, ...activities];
    const seen = new Set<string>();
    return combined.filter((a) => {
      const key = a.txHash || a.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [realtimeActivities, envioActivities, activities]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'join':
        return <UserPlus className="w-3.5 h-3.5 text-[#B89600] dark:text-[#F0DC00]" />;
      case 'pot':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-500" />;
      case 'poll':
        return <Vote className="w-3.5 h-3.5 text-blue-500" />;
      case 'game':
        return <Gamepad2 className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const filtered =
    filterType === 'all'
      ? allActivities
      : filterType === 'onchain'
      ? allActivities.filter((a) => a.isEnvioIndexed || Boolean(a.txHash))
      : allActivities.filter((a) => a.type === filterType);

  const filters = [
    { id: 'all', label: isEs ? 'Todo' : 'All' },
    { id: 'onchain', label: 'Envio Onchain' },
    { id: 'join', label: isEs ? 'Asistencias' : 'RSVPs' },
    { id: 'pot', label: isEs ? 'Pozo' : 'Pot' },
    { id: 'game', label: isEs ? 'Juegos' : 'Games' },
    { id: 'poll', label: isEs ? 'Votaciones' : 'Polls' },
  ];

  const quickActions = [
    {
      id: 'games',
      label: isEs ? 'Juegos' : 'Games',
      desc: isEs ? 'Dilemas y trivia' : 'Dilemmas & trivia',
      icon: Gamepad2,
      action: () => {
        if (activeParty) selectParty(activeParty.id);
        setCurrentView('games');
      },
    },
    {
      id: 'split',
      label: 'Split',
      desc: isEs ? 'Dividir gastos' : 'Split expenses',
      icon: Receipt,
      action: () => {
        if (activeParty) selectParty(activeParty.id);
        setCurrentView('split');
      },
    },
    {
      id: 'pot',
      label: isEs ? 'Pozo' : 'Party Pot',
      desc: isEs ? 'Fondo común' : 'Group treasury',
      icon: Coins,
      action: () => {
        if (activeParty) selectParty(activeParty.id);
        setCurrentView('party-pot');
      },
    },
    {
      id: 'polls',
      label: isEs ? 'Votar' : 'Polls',
      desc: isEs ? 'Decisiones grupales' : 'Group voting',
      icon: BarChart3,
      action: () => {
        if (activeParty) selectParty(activeParty.id);
        setCurrentView('polls');
      },
    },
  ];

  const timelineSteps = [
    {
      title: isEs ? 'Check-in y llegada' : 'Check-in & arrival',
      desc: isEs ? 'Confirmación de asistencia' : 'Guest arrivals confirmed',
      done: true,
    },
    {
      title: isEs ? 'Fondo común' : 'Party Pot funding',
      desc: isEs ? 'Aportes abiertos al pozo' : 'Treasury open for drinks',
      current: true,
    },
    {
      title: isEs ? 'Ronda de juegos' : 'Game tournament',
      desc: isEs ? 'This or That y Trivia' : 'This or That & Trivia',
    },
    {
      title: isEs ? 'Liquidación y recap' : 'Settlement & recap',
      desc: isEs ? 'Cuentas claras y dossier' : 'Settle balances & memories',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-32 pt-2 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto safe-top select-none w-full transition-colors duration-200">
      {/* Minimalist Editorial Header */}
      <header className="flex items-baseline justify-between pt-2 pb-5 border-b border-black/5 dark:border-white/10 mb-6">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white tracking-tight">
            {isEs ? 'Esta noche' : 'Tonight'}
          </h1>
          <p className="text-xs sm:text-sm text-[#8E887E] dark:text-[#A8A196] font-medium mt-1">
            {activeParty
              ? (isEs ? `Reunión activa con ${associatedCrew?.name || 'tu grupo'}` : `Active gathering with ${associatedCrew?.name || 'your crew'}`)
              : (isEs ? 'Sin planes activos todavía' : 'No active gatherings planned')}
          </p>
        </div>

        {activeParty && (
          <span className="text-[11px] font-bold text-[#8E887E] dark:text-[#A8A196] px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10">
            {activeParty.date || (isEs ? 'Hoy' : 'Today')}
          </span>
        )}
      </header>

      {/* ============================================================== */}
      {/* 1. ACTIVE PARTY HERO CARD (Airbnb Experience Style)            */}
      {/* ============================================================== */}
      <section className="mb-7">
        {activeParty ? (
          <div
            onClick={() => selectParty(activeParty.id)}
            className="group relative overflow-hidden rounded-[26px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-[0_4px_24px_rgba(40,30,20,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all"
          >
            {/* Visual Photo Header */}
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-black/5 dark:bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getCoverUrl(activeParty.coverImage)}
                alt={activeParty.title}
                className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

              {/* Minimal Top Badges */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                {associatedCrew ? (
                  <span className="px-2.5 py-1 rounded-full bg-black/40 text-white/90 text-[11px] font-semibold backdrop-blur-md border border-white/15">
                    {associatedCrew.name}
                  </span>
                ) : <div />}

                {activeParty.potBalance > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 text-white text-[11px] font-mono font-bold backdrop-blur-md border border-white/15">
                    <MonadLogo size="xs" />
                    <span>{activeParty.potBalance.toFixed(2)} MON</span>
                  </div>
                )}
              </div>

              {/* Title & Core Location on Backdrop */}
              <div className="absolute bottom-3.5 left-4 right-4 z-10 text-white">
                <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                  {activeParty.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/80 font-medium mt-1 truncate">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#F0DC00]" />
                    {activeParty.date} {activeParty.time ? `· ${activeParty.time}` : ''}
                  </span>
                  {activeParty.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-[#F0DC00]" />
                        {activeParty.location.split('·')[0].trim()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Bar: Facepile & Simple Action */}
            <div className="p-3.5 sm:p-4.5 flex items-center justify-between gap-3 bg-[#FFFDF8] dark:bg-[#1C1A16]">
              {/* Member Facepile */}
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {activeParty.members.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="inline-block w-7 h-7 rounded-full ring-2 ring-[#FFFDF8] dark:ring-[#1C1A16] overflow-hidden bg-black/10 shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getAvatarUrl(m.avatar)}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-xs font-semibold text-[#6F6A62] dark:text-[#A8A196]">
                  {activeParty.members.length} {isEs ? 'asistentes' : 'guests'}
                </span>
              </div>

              {/* View gathering link */}
              <div className="inline-flex items-center gap-1 text-xs font-bold text-[#171512] dark:text-white group-hover:text-[#B89600] dark:group-hover:text-[#F0DC00] transition-colors">
                <span>{isEs ? 'Ver fiesta' : 'View party'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-7 rounded-[26px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 text-center shadow-xs">
            <h3 className="font-display font-bold text-base text-[#171512] dark:text-white mb-1">
              {isEs ? 'No hay fiesta activa esta noche' : 'No active gatherings tonight'}
            </h3>
            <p className="text-xs text-[#8E887E] dark:text-[#A8A196] max-w-xs mx-auto mb-4">
              {isEs
                ? 'Comienza una reunión con tu grupo o únete con un código de invitación.'
                : 'Start a gathering with your crew or join with an invite code.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentView('create-party')}
                className="px-4 py-2 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isEs ? 'Crear Fiesta' : 'Create Party'}</span>
              </button>
              <button
                onClick={() => setCurrentView('join-party')}
                className="px-4 py-2 rounded-full border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 text-[#171512] dark:text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                <span>{isEs ? 'Unirse con Código' : 'Join with Code'}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 2. QUICK ACTIONS (Minimalist Airbnb Amenities Style)           */}
      {/* ============================================================== */}
      <section className="mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={action.action}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 shadow-xs active:scale-97 transition-all cursor-pointer flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0 text-[#171512] dark:text-white">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-xs sm:text-sm text-[#171512] dark:text-white leading-tight truncate">
                    {action.label}
                  </h3>
                  <p className="text-[11px] text-[#8E887E] dark:text-[#A8A196] truncate mt-0.5">
                    {action.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. TWO-COLUMN: ACTIVITY & TIMELINE                             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Activity Feed (7 cols on desktop) */}
        <section className="md:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 mb-1 px-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196]">
              {isEs ? 'Actividad del grupo' : 'Crew activity'}
            </span>

            {/* Quiet Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                    filterType === f.id
                      ? 'bg-[#171512] dark:bg-white text-white dark:text-[#171512]'
                      : 'text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((act) => {
                const party = parties.find((p) => p.id === act.partyId);

                return (
                  <div
                    key={act.id}
                    onClick={() => act.partyId && selectParty(act.partyId)}
                    className="p-3 sm:p-3.5 flex items-center gap-3 bg-[#FFFDF8] dark:bg-[#1C1A16] hover:bg-[#FDFBF7] dark:hover:bg-[#25221D] transition-colors cursor-pointer border border-black/6 dark:border-white/8 rounded-2xl shadow-xs"
                  >
                    <div className="relative shrink-0 w-8 h-8">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-black/10 dark:border-white/10 flex items-center justify-center bg-black/5 dark:bg-white/5">
                        {act.avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={act.avatar}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full text-[#171512] dark:text-white flex items-center justify-center font-display font-black text-xs">
                            A
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FFFDF8] dark:bg-[#1C1A16] flex items-center justify-center border border-black/10 dark:border-white/15">
                        {getIcon(act.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#171512] dark:text-[#F5F1E8] leading-snug truncate">
                        {act.text}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                        {party && (
                          <span className="font-semibold truncate max-w-[120px]">
                            {party.title}
                          </span>
                        )}
                        <span>{act.time}</span>
                        {act.txHash && (
                          <a
                            href={`https://testnet.monadexplorer.com/tx/${act.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded transition-colors"
                            title="Verified on Monad via Envio HyperIndex"
                          >
                            <span>Envio</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/6 dark:border-white/8 text-center text-xs text-[#8E887E] dark:text-[#A8A196]">
              {t.activityView.empty}
            </div>
          )}
        </section>

        {/* Right Column: Night Timeline (5 cols on desktop) */}
        <section className="md:col-span-5 flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196] mb-1 px-0.5">
            {isEs ? 'Cronograma' : 'Timeline'}
          </span>

          <div className="p-4 sm:p-5 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 rounded-2xl shadow-xs">
            <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-black/10 dark:before:bg-white/10">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-mono font-bold ${
                      step.done
                        ? 'bg-[#171512] dark:bg-white text-white dark:text-[#171512]'
                        : step.current
                        ? 'bg-[#F0DC00] text-[#171512]'
                        : 'bg-black/10 dark:bg-white/10 text-[#8E887E] dark:text-[#A8A196]'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#171512] dark:text-white leading-tight">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-[#8E887E] dark:text-[#A8A196] mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
