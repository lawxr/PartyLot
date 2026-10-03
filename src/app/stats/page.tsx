'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  Flame,
  Users,
  Coins,
  Gamepad2,
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw,
  Clock,
  Radio,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import { publicMonadClient } from '@/lib/web3/monad';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import {
  checkEnvioSyncStatus,
  fetchEnvioGlobalMetrics,
  EnvioSyncStatus,
  EnvioGlobalMetrics,
} from '@/lib/web3/envio';

interface PartySummary {
  id: string;
  title: string;
  code: string;
  location: string;
  potBalance: number;
  date: string;
}

interface CrewSummary {
  id: string;
  name: string;
  treasuryBalance: number;
}

interface LivePlatformStats {
  totalParties: number;
  totalCrews: number;
  totalMembers: number;
  totalPotVolume: number;
  totalTransactionsCount: number;
  totalGamesSessions: number;
  totalMemoriesCount: number;
  latestBlockNumber: number | null;
  parties: PartySummary[];
  crews: CrewSummary[];
}

export default function PlatformStatsPage() {
  const { language } = useTranslation();
  const isEs = language === 'es';

  const [stats, setStats] = useState<LivePlatformStats>({
    totalParties: 0,
    totalCrews: 0,
    totalMembers: 0,
    totalPotVolume: 0,
    totalTransactionsCount: 0,
    totalGamesSessions: 0,
    totalMemoriesCount: 0,
    latestBlockNumber: null,
    parties: [],
    crews: [],
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [envioStatus, setEnvioStatus] = useState<EnvioSyncStatus | null>(null);
  const [envioMetrics, setEnvioMetrics] = useState<EnvioGlobalMetrics | null>(null);

  const loadStats = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const [
        partiesRes,
        crewsRes,
        usersRes,
        transactionsRes,
        gamesRes,
        memoriesRes,
        blockNumber,
        envioSync,
        envioGlobal,
      ] = await Promise.all([
        supabase.from('parties').select('id, title, code, location, pot_balance, date').order('created_at', { ascending: false }),
        supabase.from('crews').select('id, name, treasury_balance').order('created_at', { ascending: false }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('pot_transactions').select('amount'),
        supabase.from('game_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('party_memories').select('id', { count: 'exact', head: true }),
        publicMonadClient.getBlockNumber().catch(() => null),
        checkEnvioSyncStatus().catch(() => null),
        fetchEnvioGlobalMetrics().catch(() => null),
      ]);

      const partiesList: PartySummary[] = (partiesRes.data || []).map((p) => ({
        id: p.id,
        title: p.title,
        code: p.code,
        location: p.location,
        potBalance: Number(p.pot_balance) || 0,
        date: p.date,
      }));

      const crewsList: CrewSummary[] = (crewsRes.data || []).map((c) => ({
        id: c.id,
        name: c.name,
        treasuryBalance: Number(c.treasury_balance) || 0,
      }));

      const transactions = transactionsRes.data || [];
      const totalVolumeFromTx = transactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
      const totalVolumeFromParties = partiesList.reduce((acc, p) => acc + p.potBalance, 0);
      const effectivePotVolume = Math.max(totalVolumeFromTx, totalVolumeFromParties);

      if (envioSync) setEnvioStatus(envioSync);
      if (envioGlobal) setEnvioMetrics(envioGlobal);

      setStats({
        totalParties: partiesList.length,
        totalCrews: crewsList.length,
        totalMembers: usersRes.count || 0,
        totalPotVolume: effectivePotVolume,
        totalTransactionsCount: transactions.length,
        totalGamesSessions: gamesRes.count || 0,
        totalMemoriesCount: memoriesRes.count || 0,
        latestBlockNumber: blockNumber ? Number(blockNumber) : null,
        parties: partiesList,
        crews: crewsList,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Realtime stats fetch notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and Realtime WebSocket Subscription
  useEffect(() => {
    let ignore = false;
    const fetchInitial = async () => {
      if (!ignore) {
        await loadStats();
      }
    };
    void fetchInitial();

    const supabase = getSupabase();
    if (!supabase) {
      return () => {
        ignore = true;
      };
    }

    // Supabase Realtime channel across core tables
    const channel = supabase
      .channel('public-stats-live-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crews' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pot_transactions' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_memories' }, () => loadStats())
      .subscribe((status) => {
        setIsLiveConnected(status === 'SUBSCRIBED');
      });

    // Monad block ticker every 6 seconds
    const blockInterval = setInterval(async () => {
      try {
        const blk = await publicMonadClient.getBlockNumber();
        setStats((prev) => ({ ...prev, latestBlockNumber: Number(blk) }));
      } catch {
        // Silently skip if network blips
      }
    }, 6000);

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
      clearInterval(blockInterval);
    };
  }, [loadStats]);

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] py-8 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto transition-colors select-none">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEs ? 'Volver a Partylot' : 'Back to Partylot'}</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Realtime Live Pulse */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">
              {isLiveConnected
                ? isEs
                  ? 'Realtime Activo'
                  : 'Realtime Connected'
                : isEs
                ? 'Conectando...'
                : 'Connecting...'}
            </span>
          </div>

          <LanguageSwitch compact />
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0DC00]/20 text-[#B89600] dark:text-[#F0DC00] text-xs font-extrabold tracking-wider uppercase mb-3">
          <Activity className="w-3.5 h-3.5" />
          <span>{isEs ? 'Auditoría & Salud en Vivo' : 'Live Ecosystem & Audit Stats'}</span>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-[#171512] dark:text-white tracking-tight">
              {isEs ? 'Métricas de la Red en Tiempo Real' : 'Real-Time Platform Analytics'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6F6A62] dark:text-[#A8A196] mt-2 max-w-xl leading-relaxed">
              {isEs
                ? 'Monitoreo 100% transparente y descentralizado. Datos reales alimentados por WebSockets de Supabase y contratos en Monad Testnet.'
                : '100% transparent and decentralized monitoring. Real database queries connected via Supabase WebSockets and Monad smart contracts.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadStats}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isEs ? 'Actualizar' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#8E887E] dark:text-[#A8A196] mt-3">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {isEs ? 'Última sincronización:' : 'Last live sync:'} {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Primary KPI Grid (All Real Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-8">
        {/* KPI 1: Real Parties */}
        <div className="p-5 rounded-[24px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-[0_8px_24px_rgba(65,48,25,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="w-9 h-9 rounded-xl bg-[#F0DC00]/20 text-[#B89600] dark:text-[#F0DC00] flex items-center justify-center mb-3">
            <Flame className="w-5 h-5" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white block">
            {stats.totalParties}
          </span>
          <span className="text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] block mt-0.5">
            {isEs ? 'Fiestas Registradas' : 'Total Gatherings Hosted'}
          </span>
        </div>

        {/* KPI 2: Real Pot Volume */}
        <div className="p-5 rounded-[24px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-[0_8px_24px_rgba(65,48,25,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <Coins className="w-5 h-5" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400 block">
            ${stats.totalPotVolume.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] block mt-0.5">
            {isEs ? 'Volumen en Party Pots (USDC)' : 'Party Pot Total Volume'}
          </span>
        </div>

        {/* KPI 3: Real Crews */}
        <div className="p-5 rounded-[24px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-[0_8px_24px_rgba(65,48,25,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white block">
            {stats.totalCrews}
          </span>
          <span className="text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] block mt-0.5">
            {isEs ? 'Crews Permanentes' : 'Permanent Circles / Crews'}
          </span>
        </div>

        {/* KPI 4: Registered Users */}
        <div className="p-5 rounded-[24px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-[0_8px_24px_rgba(65,48,25,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white block">
            {stats.totalMembers}
          </span>
          <span className="text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] block mt-0.5">
            {isEs ? 'Billeteras Sincronizadas' : 'Connected Privy Wallets'}
          </span>
        </div>

        {/* KPI 5: Interactive Games Sessions */}
        <div className="p-5 rounded-[24px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-[0_8px_24px_rgba(65,48,25,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white block">
            {stats.totalGamesSessions}
          </span>
          <span className="text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] block mt-0.5">
            {isEs ? 'Sesiones de Juegos Activas' : 'Active Game Sessions'}
          </span>
        </div>

        {/* KPI 6: Real-time Block Height */}
        <div className="p-5 rounded-[24px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-[0_8px_24px_rgba(65,48,25,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-display font-black text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 block font-mono">
            {stats.latestBlockNumber ? `#${stats.latestBlockNumber.toLocaleString()}` : 'Live RPC'}
          </span>
          <span className="text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] block mt-0.5">
            {isEs ? 'Bloque en Monad Testnet' : 'Monad Current Block Height'}
          </span>
        </div>
      </div>

      {/* Live Parties & Crews Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Active Parties List */}
        <div className="p-5 rounded-[28px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-black text-base text-[#171512] dark:text-white">
              {isEs ? 'Fiestas en la Base de Datos' : 'Live Gatherings in Database'}
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
              {stats.parties.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {stats.parties.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[#171512] dark:text-white block">
                    {p.title}
                  </span>
                  <span className="text-[11px] text-[#6F6A62] dark:text-[#A8A196]">
                    {p.date} · {p.location}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                    ${p.potBalance.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono text-[#8E887E] dark:text-[#A8A196]">
                    {p.code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Crews List */}
        <div className="p-5 rounded-[28px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-black text-base text-[#171512] dark:text-white">
              {isEs ? 'Crews en la Base de Datos' : 'Live Crews in Database'}
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
              {stats.crews.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {stats.crews.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[#171512] dark:text-white block">
                    {c.name}
                  </span>
                  <span className="text-[11px] text-[#6F6A62] dark:text-[#A8A196]">
                    ID: {c.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-[#B89600] dark:text-[#F0DC00] block">
                    ${c.treasuryBalance.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                    Treasury
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Envio HyperIndex Sub-second Pipeline Section */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-[0_8px_30px_rgba(65,48,25,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
            <h2 className="font-display font-black text-lg sm:text-xl text-[#171512] dark:text-white">
              {isEs ? 'Pipeline de Indexación Envio HyperIndex' : 'Envio HyperIndex Real-Time Pipeline'}
            </h2>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {envioStatus?.indexerStatus === 'syncing'
                ? isEs ? 'Sincronizando' : 'Syncing'
                : isEs ? 'Sub-second Activo' : 'Sub-second Active'}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] mb-5 leading-relaxed">
          {isEs
            ? 'Indexación descentralizada en sub-segundos para Monad Testnet (Chain ID 10143). Normaliza eventos de tesorería, registro y grafo social en entidades agregadas consumidas por GraphQL.'
            : 'Sub-second decentralized event indexing on Monad Testnet (Chain ID 10143). Normalizes treasury, registry, and social graph events into GraphQL aggregated entities.'}
        </p>

        {/* Envio Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
            <span className="text-[11px] font-bold text-[#8E887E] dark:text-[#A8A196] block mb-1">
              {isEs ? 'Bloque Indexado' : 'Indexed Block'}
            </span>
            <span className="font-mono font-black text-sm text-[#171512] dark:text-white">
              {envioStatus?.latestIndexedBlock && envioStatus.latestIndexedBlock > 0
                ? `#${envioStatus.latestIndexedBlock.toLocaleString()}`
                : stats.latestBlockNumber
                ? `#${stats.latestBlockNumber.toLocaleString()}`
                : 'Live'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
            <span className="text-[11px] font-bold text-[#8E887E] dark:text-[#A8A196] block mb-1">
              {isEs ? 'Latencia del Pipeline' : 'Pipeline Latency'}
            </span>
            <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
              {envioStatus?.latencyMs ? `${envioStatus.latencyMs} ms` : '< 50 ms'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
            <span className="text-[11px] font-bold text-[#8E887E] dark:text-[#A8A196] block mb-1">
              {isEs ? 'Contratos Indexados' : 'Indexed Contracts'}
            </span>
            <span className="font-mono font-black text-sm text-[#171512] dark:text-white">
              3 (Vault, Registry, Social)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
            <span className="text-[11px] font-bold text-[#8E887E] dark:text-[#A8A196] block mb-1">
              {isEs ? 'Motor de Consulta' : 'Query Engine'}
            </span>
            <span className="font-mono font-black text-sm text-[#B89600] dark:text-[#F0DC00]">
              HyperIndex GraphQL
            </span>
          </div>
        </div>

        {envioMetrics && Number(envioMetrics.totalMonVolumeIndexed) > 0 && (
          <div className="p-3.5 mb-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">
              {isEs ? 'Volumen Histórico Indexado por Envio' : 'Historical Volume Indexed by Envio'}
            </span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
              {envioMetrics.totalMonVolumeIndexed} MON · {envioMetrics.totalSettlementsExecuted} {isEs ? 'liquidaciones' : 'settlements'}
            </span>
          </div>
        )}

        {/* GraphQL Endpoint link */}
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div>
            <span className="font-sans font-bold text-[#171512] dark:text-white block">
              {isEs ? 'Endpoint GraphQL de Envio' : 'Envio GraphQL Endpoint'}
            </span>
            <span className="text-[#8E887E] dark:text-[#A8A196] text-[11px] font-mono break-all">
              {envioStatus?.endpoint || 'https://indexer.envio.dev/v1/graphql'}
            </span>
          </div>
          <a
            href="https://docs.envio.dev/docs/HyperIndex/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#B89600] dark:text-[#F0DC00] font-sans font-bold flex items-center gap-1 hover:underline text-xs"
          >
            <span>{isEs ? 'Docs de Envio' : 'Envio Docs'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Monad Smart Contract Verification */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/8 dark:border-white/10 shadow-[0_8px_30px_rgba(65,48,25,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-[#B89600] dark:text-[#F0DC00]" />
          <h2 className="font-display font-black text-lg sm:text-xl text-[#171512] dark:text-white">
            {isEs ? 'Contratos Inteligentes Desplegados en Monad' : 'Verified Smart Contracts on Monad Testnet'}
          </h2>
        </div>

        <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] mb-4 leading-relaxed">
          {isEs
            ? 'Transparencia de código en la red Monad (Chain ID 10143). Puedes auditar el código fuente y las transacciones directamente en el explorador:'
            : 'Open code transparency on Monad Testnet (Chain ID 10143). Audit contract bytecode and verified transactions directly on the explorer:'}
        </p>

        <div className="space-y-3 font-mono text-xs">
          {/* Party Registry */}
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-sans font-bold text-[#171512] dark:text-white block">Party Registry</span>
              <span className="text-[#8E887E] dark:text-[#A8A196] text-[11px] break-all">0xb7d922488daa522443ffe1627efc6d65825eebad</span>
            </div>
            <a
              href="https://testnet.monadexplorer.com/address/0xb7d922488daa522443ffe1627efc6d65825eebad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B89600] dark:text-[#F0DC00] font-sans font-bold flex items-center gap-1 hover:underline text-xs"
            >
              <span>{isEs ? 'Ver en Explorer' : 'View on Explorer'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Treasury Vault */}
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-sans font-bold text-[#171512] dark:text-white block">Party Treasury (Vault)</span>
              <span className="text-[#8E887E] dark:text-[#A8A196] text-[11px] break-all">0x13ed67e844496095c0f44c914f89e30ef190db2c</span>
            </div>
            <a
              href="https://testnet.monadexplorer.com/address/0x13ed67e844496095c0f44c914f89e30ef190db2c"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B89600] dark:text-[#F0DC00] font-sans font-bold flex items-center gap-1 hover:underline text-xs"
            >
              <span>{isEs ? 'Ver en Explorer' : 'View on Explorer'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Social Graph */}
          <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-sans font-bold text-[#171512] dark:text-white block">Social Graph (EAS Attestations)</span>
              <span className="text-[#8E887E] dark:text-[#A8A196] text-[11px] break-all">0x7e87e96bc959fa9ee559fad9c2e3d017d757adf9</span>
            </div>
            <a
              href="https://testnet.monadexplorer.com/address/0x7e87e96bc959fa9ee559fad9c2e3d017d757adf9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B89600] dark:text-[#F0DC00] font-sans font-bold flex items-center gap-1 hover:underline text-xs"
            >
              <span>{isEs ? 'Ver en Explorer' : 'View on Explorer'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="text-center text-xs text-[#6F6A62] dark:text-[#A8A196] border-t border-black/5 dark:border-white/10 pt-6">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/privacy" className="hover:underline font-bold">
            {isEs ? 'Política de Tratamiento de Datos' : 'Privacy & Data Protection Policy'}
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:underline font-bold">
            {isEs ? 'Términos y Condiciones' : 'Terms of Service'}
          </Link>
        </div>
        <p>© {new Date().getFullYear()} PARTYLOT. {isEs ? 'Datos en vivo de producción.' : 'Live production analytics.'}</p>
      </div>
    </div>
  );
}
