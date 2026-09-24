'use client';

import React, { useState } from 'react';
import {
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Award,
  Landmark,
  ArrowRightLeft,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LiquidBlob } from '@/components/ui/LiquidBlob';
import { FINANCIAL_ACTIONS_AVAILABLE, getFinancialActionsUnavailableMessage } from '@/services/treasury';
import { PartyTasksBoard } from '@/components/party/PartyTasksBoard';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const PartyPotView: React.FC = () => {
  const { parties, currentPartyId, crews, transactions } =
    usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';
  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyTransactions = transactions.filter((t) => t.partyId === party.id);

  const associatedCrew = crews.find((c) => c.id === party.crewId);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSpendOpen, setIsSpendOpen] = useState(false);
  const [isRewardOpen, setIsRewardOpen] = useState(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);

  const [addAmount, setAddAmount] = useState('20');
  const [spendAmount, setSpendAmount] = useState('15');
  const [spendDesc, setSpendDesc] = useState('');
  const [rewardRecipient, setRewardRecipient] = useState(party.members[1]?.name || 'Ana');
  const [rewardRole, setRewardRole] = useState('OFFICIAL_DJ');
  const [rewardAmount, setRewardAmount] = useState('10');
  const isProcessing = false;

  // Filter state for transactions
  const [txFilter, setTxFilter] = useState<'all' | 'add' | 'spend' | 'reward' | 'rollover'>('all');

  const filteredTransactions =
    txFilter === 'all'
      ? partyTransactions
      : partyTransactions.filter((t) => t.type === txFilter);

  const financialActionsMessage = getFinancialActionsUnavailableMessage(language);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    return;
  };

  const handleSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    return;
  };

  const handleDistributeReward = async (e: React.FormEvent) => {
    e.preventDefault();
    return;
  };

  const handleRolloverConfirm = async () => {
    return;
  };

  return (
    <div className="min-h-screen bg-[#15140f] text-white pb-32 select-none">
      <TopNav title={isEs ? 'TESORERÍA COMPARTIDA' : 'SHARED TREASURY'} showLanguageSwitch />

      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto pt-2 w-full">
        <p role="status" className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          {financialActionsMessage}
        </p>
        {/* Editorial Header */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F0DC00]">
                {isEs ? 'POZO DEL GRUPO' : 'PARTY POT'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                {isEs ? 'No disponible' : 'Unavailable'}
              </span>
            </div>
            <h2 className="bubble text-4xl sm:text-6xl text-white tracking-tight leading-none">
              PARTY POT
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <GlassButton
              variant="accent"
              size="md"
              disabled={!FINANCIAL_ACTIONS_AVAILABLE}
              onClick={() => setIsAddOpen(true)}
              icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
            >
              {isEs ? 'Aportar (no disponible)' : 'Add money (unavailable)'}
            </GlassButton>

            <GlassButton
              variant="glass"
              size="md"
              disabled={!FINANCIAL_ACTIONS_AVAILABLE}
              onClick={() => setIsRewardOpen(true)}
              icon={<Award className="w-4 h-4 text-[#F0DC00]" />}
            >
              {isEs ? 'Recompensa (no disponible)' : 'Reward (unavailable)'}
            </GlassButton>

            <GlassButton
              variant="glass"
              size="md"
              disabled={!FINANCIAL_ACTIONS_AVAILABLE}
              onClick={() => setIsSpendOpen(true)}
              icon={<Minus className="w-4 h-4 text-white" />}
            >
              {isEs ? 'Gasto (no disponible)' : 'Spend (unavailable)'}
            </GlassButton>

            {associatedCrew && (
              <GlassButton
                variant="glass"
                size="md"
                disabled={!FINANCIAL_ACTIONS_AVAILABLE || party.potBalance <= 0}
                onClick={() => setIsRolloverOpen(true)}
                icon={<Landmark className="w-4 h-4 text-[#F0DC00]" />}
              >
                {isEs ? 'Transferir (no disponible)' : 'Transfer (unavailable)'}
              </GlassButton>
            )}
          </div>
        </div>

        {/* Multi-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Liquid Blob + Quick Actions (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            {/* Liquid Glass Interactive Blob Sphere */}
            <div className="relative my-2 w-full flex justify-center">
              <LiquidBlob balance={party.potBalance} />

              {/* Balance Overlay over sphere */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="bubble text-5xl sm:text-6xl text-white tracking-tight drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
                  ${party.potBalance.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-white/80 mt-1 drop-shadow-md">
                  {isEs ? `${party.members.length} participantes` : `${party.members.length} participants`}
                </span>
                <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-white/90 border border-white/10">
                  <ShieldCheck className="w-3 h-3 text-[#F0DC00]" />
                  {isEs ? 'Saldo mostrado' : 'Displayed balance'}
                </span>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="grid sm:hidden grid-cols-3 gap-2.5 w-full my-4">
              <GlassButton
                variant="accent"
                size="md"
                disabled={!FINANCIAL_ACTIONS_AVAILABLE}
                onClick={() => setIsAddOpen(true)}
                icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
              >
                {isEs ? 'Aportar (no disponible)' : 'Add money (unavailable)'}
              </GlassButton>

              <GlassButton
                variant="glass"
                size="md"
                disabled={!FINANCIAL_ACTIONS_AVAILABLE}
                onClick={() => setIsRewardOpen(true)}
                icon={<Award className="w-4 h-4 text-[#F0DC00]" />}
              >
                {isEs ? 'Recompensa (no disponible)' : 'Reward (unavailable)'}
              </GlassButton>

              <GlassButton
                variant="glass"
                size="md"
                disabled={!FINANCIAL_ACTIONS_AVAILABLE}
                onClick={() => setIsSpendOpen(true)}
                icon={<Minus className="w-4 h-4 text-white" />}
              >
                {isEs ? 'Gasto (no disponible)' : 'Spend (unavailable)'}
              </GlassButton>
            </div>

            {/* Mobile Rollover Button if Crew Associated */}
            {associatedCrew && (
              <div className="w-full sm:hidden mb-4">
                <GlassButton
                  variant="glass"
                  size="md"
                  fullWidth
                  disabled={!FINANCIAL_ACTIONS_AVAILABLE || party.potBalance <= 0}
                  onClick={() => setIsRolloverOpen(true)}
                  icon={<Landmark className="w-4 h-4 text-[#F0DC00]" />}
                >
                  {isEs ? 'Transferir al grupo (no disponible)' : `Transfer to ${associatedCrew.name} (unavailable)`}
                </GlassButton>
              </div>
            )}

            {/* Crew Treasury Link / Rollover Banner */}
            {associatedCrew && (
              <div className="w-full p-4 rounded-3xl liquid-glass-card mt-2 sm:mt-4 text-left border border-white/15">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#F0DC00] tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" />
                    {isEs ? 'SALDO DEL GRUPO' : 'CREW BALANCE'}
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    ${(associatedCrew.treasuryBalance ?? 0).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  {isEs ? 'Saldo mostrado para ' : 'Displayed balance for '}<span className="text-white font-bold">{associatedCrew.name}</span>. {isEs ? 'Las transferencias no están disponibles.' : 'Transfers are unavailable.'}
                </p>
                {party.potBalance > 0 && (
                  <button
                    type="button"
                    disabled={!FINANCIAL_ACTIONS_AVAILABLE}
                    onClick={() => setIsRolloverOpen(true)}
                    className="mt-3 w-full py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-[#F0DC00] text-xs font-bold flex items-center justify-center gap-2 border border-[#F0DC00]/30 transition-all"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    {isEs ? 'Transferencia no disponible' : 'Transfer unavailable'}
                  </button>
                )}
              </div>
            )}

            {/* Social Stake Banner */}
            <div className="w-full p-4 rounded-3xl liquid-glass-card mt-3 text-left border border-white/10">
              <span className="text-[10px] uppercase font-bold text-[#F0DC00] tracking-wider block">
                {isEs ? 'BOTE DE LA FIESTA' : 'PARTY POT'}
              </span>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                {isEs ? 'Las acciones de dinero están desactivadas hasta que haya un servicio real de pagos.' : 'Money actions are disabled until a real payment service is available.'}
              </p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10 text-[11px] text-white/60">
                <span className="w-2 h-2 rounded-full bg-[#F0DC00] animate-pulse" />
                <span>{isEs ? 'Sin pagos procesados' : 'No payments processed'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Verified Ledger Feed (7 cols on desktop) */}
          <div className="lg:col-span-7 w-full text-left space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: `All (${partyTransactions.length})` },
                { id: 'add', label: 'Deposits' },
                { id: 'spend', label: 'Deductions' },
                { id: 'reward', label: 'Rewards' },
                { id: 'rollover', label: 'Rollovers' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTxFilter(tab.id as typeof txFilter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    txFilter === tab.id
                      ? 'bg-[#F0DC00] text-black shadow-md'
                      : 'liquid-glass-card text-white/60 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/60 block">
                  {isEs ? 'MOVIMIENTOS MOSTRADOS' : 'DISPLAYED POT ACTIVITY'}
                </span>
                <span className="text-xs text-white/40">{isEs ? 'No confirma pagos reales' : 'Does not confirm real payments'}</span>
              </div>
              <span className="text-xs text-[#F0DC00] font-mono font-semibold">
                {filteredTransactions.length} records
              </span>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const isAdd = tx.type === 'add';
                  const isRollover = tx.type === 'rollover';
                  const isReward = tx.type === 'reward';

                  return (
                    <GlassPanel
                      key={tx.id}
                      level={2}
                      className="p-4 sm:p-5 flex items-center justify-between border border-white/15 hover:border-white/25 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
                            isRollover
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : isReward
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : isAdd
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {isRollover ? (
                            <Landmark className="w-5 h-5" />
                          ) : isReward ? (
                            <Award className="w-5 h-5" />
                          ) : isAdd ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-base text-white">
                              {tx.userName}
                            </h4>
                            {isRollover && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                Crew Rollover
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/50">{tx.description} · {tx.timestamp}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-display font-black text-lg sm:text-xl ${
                            isAdd
                              ? 'text-[#F0DC00]'
                              : isRollover
                              ? 'text-purple-300'
                              : 'text-rose-400'
                          }`}
                        >
                          {isAdd ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                        </span>
                        <span className="block text-[10px] text-white/40 uppercase font-mono">
                          {isRollover ? 'Rollover' : isAdd ? 'Deposit' : isReward ? 'Reward' : 'Deduction'}
                        </span>
                      </div>
                    </GlassPanel>
                  );
                })
              ) : (
                <div className="p-8 text-center rounded-3xl liquid-glass-card border border-white/10">
                  <Landmark className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-xs text-white/50">No transactions in this category yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Social Bounties & Tasks Board */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <PartyTasksBoard partyId={party.id} />
        </div>
      </main>

      {/* BottomSheet: Add Money */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add to Party Pot"
      >
        <form onSubmit={handleAddFunds} className="space-y-4">
          <p className="text-xs text-white/70">
            {financialActionsMessage}
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
              Select Preset Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['10', '20', '50', '100'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAddAmount(preset)}
                  className={`py-3 rounded-2xl font-display font-black text-base transition-all ${
                    addAmount === preset
                      ? 'bg-[#F0DC00] text-black shadow-lg scale-105'
                      : 'liquid-glass-card text-white/80'
                  }`}
                >
                  +${preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Custom Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white font-display font-black text-2xl outline-none border border-white/20 focus:border-[#F0DC00]"
            />
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              type="submit"
              disabled={!FINANCIAL_ACTIONS_AVAILABLE || isProcessing}
            >
              {isProcessing ? 'Processing...' : isEs ? 'Aportar no disponible' : 'Contribution unavailable'}
            </GlassButton>
          </div>
        </form>
      </BottomSheet>

      {/* BottomSheet: Reward Contributor */}
      <BottomSheet
        isOpen={isRewardOpen}
        onClose={() => setIsRewardOpen(false)}
        title="Reward Social Contributor"
      >
        <form onSubmit={handleDistributeReward} className="space-y-4">
          <p className="text-xs text-white/70">
            {financialActionsMessage}
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Contributor
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {party.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRewardRecipient(m.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                    rewardRecipient === m.name
                      ? 'bg-[#F0DC00] text-black shadow-md'
                      : 'liquid-glass-card text-white/60'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Contribution Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'OFFICIAL_DJ', label: '🎧 DJ MVP' },
                { id: 'ICE_RUNNER', label: '🧊 Ice & Lime' },
                { id: 'GAME_WINNER', label: '👑 Game Winner' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRewardRole(r.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    rewardRole === r.id
                      ? 'bg-white text-black shadow-md'
                      : 'liquid-glass-card text-white/70'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Reward Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white font-display font-black text-2xl outline-none border border-white/20 focus:border-[#F0DC00]"
            />
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              type="submit"
              disabled={!FINANCIAL_ACTIONS_AVAILABLE || isProcessing}
            >
              {isProcessing ? 'Processing...' : isEs ? 'Recompensa no disponible' : 'Reward unavailable'}
            </GlassButton>
          </div>
        </form>
      </BottomSheet>

      {/* BottomSheet: Spend Money */}
      <BottomSheet
        isOpen={isSpendOpen}
        onClose={() => setIsSpendOpen(false)}
        title="Spend from Pot"
      >
        <form onSubmit={handleSpend} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              What did you buy?
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Extra Ice & Lime, Midnight tacos..."
              value={spendDesc}
              onChange={(e) => setSpendDesc(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white text-base font-semibold outline-none border border-white/20 focus:border-[#F0DC00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Deduction Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white font-display font-black text-2xl outline-none border border-white/20 focus:border-[#F0DC00]"
            />
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              type="submit"
              disabled={!FINANCIAL_ACTIONS_AVAILABLE}
            >
              {isEs ? 'Gasto no disponible' : 'Spending unavailable'}
            </GlassButton>
          </div>
        </form>
      </BottomSheet>

      {/* BottomSheet: Rollover to Crew Treasury */}
      {associatedCrew && (
        <BottomSheet
          isOpen={isRolloverOpen}
          onClose={() => {
            if (!isProcessing) setIsRolloverOpen(false);
          }}
          title="Rollover to Crew Treasury"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">Target Treasury</span>
              </div>
              <span className="text-xs font-black text-[#F0DC00]">
                {associatedCrew.name}
              </span>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              {financialActionsMessage}
            </p>

            <div className="p-4 rounded-2xl liquid-glass-card border border-white/15 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Current Party Pot</span>
                <span className="font-mono font-bold text-white">${party.potBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Current Crew Treasury</span>
                <span className="font-mono font-bold text-white">
                  ${(associatedCrew.treasuryBalance ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                <span className="text-[#F0DC00]">New Crew Treasury</span>
                <span className="font-mono text-base text-[#F0DC00]">
                  ${((associatedCrew.treasuryBalance ?? 0) + party.potBalance).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <GlassButton
                variant="accent"
                size="lg"
                fullWidth
                disabled={!FINANCIAL_ACTIONS_AVAILABLE || isProcessing || party.potBalance <= 0}
                onClick={handleRolloverConfirm}
                icon={<Landmark className="w-4 h-4 text-black" />}
              >
                {isEs ? 'Transferencia no disponible' : 'Transfer unavailable'}
              </GlassButton>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
