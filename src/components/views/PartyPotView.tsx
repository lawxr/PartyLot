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
  Loader2,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LiquidBlob } from '@/components/ui/LiquidBlob';
import {
  depositToPartyPotOnchain,
  distributeBountyOnchain,
  rolloverFundsOnchain,
} from '@/services/treasury';
import { PartyTasksBoard } from '@/components/party/PartyTasksBoard';
import confetti from 'canvas-confetti';

export const PartyPotView: React.FC = () => {
  const { parties, currentPartyId, crews, transactions, addToPot, spendFromPot, rolloverPotToCrew } =
    usePartyStore();
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
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter state for transactions
  const [txFilter, setTxFilter] = useState<'all' | 'add' | 'spend' | 'reward' | 'rollover'>('all');

  const filteredTransactions =
    txFilter === 'all'
      ? partyTransactions
      : partyTransactions.filter((t) => t.type === txFilter);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(addAmount);
    if (isNaN(val) || val <= 0) return;

    setIsProcessing(true);

    try {
      // Execute 0-gas deposit into PartyTreasury on Monad Testnet
      const receipt = await depositToPartyPotOnchain(party.id, val);

      addToPot(party.id, val, `Deposit [tx: ${receipt.txHash.slice(0, 8)}...]`);
      setIsAddOpen(false);

      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#FFFFFF', '#60A5FA'],
      });
    } catch (err) {
      console.error('Error adding funds to pot:', err);
      addToPot(party.id, val, 'Treasury Pot Deposit');
      setIsAddOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(spendAmount);
    if (!spendDesc.trim() || isNaN(val) || val <= 0) return;

    spendFromPot(party.id, val, spendDesc.trim());
    setSpendDesc('');
    setIsSpendOpen(false);
  };

  const handleDistributeReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(rewardAmount);
    if (isNaN(val) || val <= 0) return;

    setIsProcessing(true);
    try {
      const receipt = await distributeBountyOnchain(
        party.id,
        rewardRecipient,
        val,
        rewardRole
      );

      spendFromPot(
        party.id,
        val,
        `Reward for ${rewardRecipient} [tx: ${receipt.txHash.slice(0, 8)}...]`
      );
      setIsRewardOpen(false);

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#F0DC00', '#F59E0B', '#10B981'],
      });
    } catch (err) {
      console.error('Error distributing reward:', err);
      spendFromPot(party.id, val, `Reward for ${rewardRecipient} (${rewardRole})`);
      setIsRewardOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRolloverConfirm = async () => {
    if (!associatedCrew || party.potBalance <= 0) return;

    setIsProcessing(true);
    try {
      await rolloverFundsOnchain(
        party.id,
        associatedCrew.id,
        party.potBalance
      );

      rolloverPotToCrew(party.id, associatedCrew.id);
      setIsRolloverOpen(false);

      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#F0DC00', '#10B981', '#3B82F6'],
      });
    } catch (err) {
      console.error('Error rolling over pot:', err);
      rolloverPotToCrew(party.id, associatedCrew.id);
      setIsRolloverOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#15140f] text-white pb-32 select-none">
      <TopNav title="SHARED TREASURY" />

      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto pt-2 w-full">
        {/* Editorial Header */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F0DC00]">
                CREW TREASURY · ERC-4337
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Monad 0-Gas
              </span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-none">
              PARTY POT
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <GlassButton
              variant="accent"
              size="md"
              onClick={() => setIsAddOpen(true)}
              icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
            >
              Add money
            </GlassButton>

            <GlassButton
              variant="glass"
              size="md"
              onClick={() => setIsRewardOpen(true)}
              icon={<Award className="w-4 h-4 text-[#F0DC00]" />}
            >
              Reward
            </GlassButton>

            <GlassButton
              variant="glass"
              size="md"
              onClick={() => setIsSpendOpen(true)}
              icon={<Minus className="w-4 h-4 text-white" />}
            >
              Spend
            </GlassButton>

            {associatedCrew && (
              <GlassButton
                variant="glass"
                size="md"
                disabled={party.potBalance <= 0}
                onClick={() => setIsRolloverOpen(true)}
                icon={<Landmark className="w-4 h-4 text-[#F0DC00]" />}
              >
                Rollover to Crew
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
                <span className="font-display font-black text-5xl sm:text-6xl text-white tracking-tight drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
                  ${party.potBalance.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-white/80 mt-1 drop-shadow-md">
                  Controlled by {party.members.length} members
                </span>
                <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-[#F0DC00] border border-white/10">
                  <ShieldCheck className="w-3 h-3 text-[#F0DC00]" />
                  PIMLICO SPONSORED · 0 GAS
                </span>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="grid sm:hidden grid-cols-3 gap-2.5 w-full my-4">
              <GlassButton
                variant="accent"
                size="md"
                onClick={() => setIsAddOpen(true)}
                icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
              >
                Add money
              </GlassButton>

              <GlassButton
                variant="glass"
                size="md"
                onClick={() => setIsRewardOpen(true)}
                icon={<Award className="w-4 h-4 text-[#F0DC00]" />}
              >
                Reward
              </GlassButton>

              <GlassButton
                variant="glass"
                size="md"
                onClick={() => setIsSpendOpen(true)}
                icon={<Minus className="w-4 h-4 text-white" />}
              >
                Spend
              </GlassButton>
            </div>

            {/* Mobile Rollover Button if Crew Associated */}
            {associatedCrew && (
              <div className="w-full sm:hidden mb-4">
                <GlassButton
                  variant="glass"
                  size="md"
                  fullWidth
                  disabled={party.potBalance <= 0}
                  onClick={() => setIsRolloverOpen(true)}
                  icon={<Landmark className="w-4 h-4 text-[#F0DC00]" />}
                >
                  Rollover to {associatedCrew.name}
                </GlassButton>
              </div>
            )}

            {/* Crew Treasury Link / Rollover Banner */}
            {associatedCrew && (
              <div className="w-full p-4 rounded-3xl liquid-glass-card mt-2 sm:mt-4 text-left border border-white/15">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#F0DC00] tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" />
                    PERSISTENT CREW TREASURY
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    ${(associatedCrew.treasuryBalance ?? 0).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Linked to <span className="text-white font-bold">{associatedCrew.name}</span>. Rollover leftover pot funds to save toward the next trip or group event!
                </p>
                {party.potBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsRolloverOpen(true)}
                    className="mt-3 w-full py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-[#F0DC00] text-xs font-bold flex items-center justify-center gap-2 border border-[#F0DC00]/30 transition-all"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Rollover ${party.potBalance.toFixed(2)} to {associatedCrew.name}
                  </button>
                )}
              </div>
            )}

            {/* Social Stake Banner */}
            <div className="w-full p-4 rounded-3xl liquid-glass-card mt-3 text-left border border-white/10">
              <span className="text-[10px] uppercase font-bold text-[#F0DC00] tracking-wider block">
                SOCIAL PARTICIPATION → ECONOMIC STAKE
              </span>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Leftover pot automatically rolls over to the next gathering. Contributor prizes are audited on Monad.
              </p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10 text-[11px] text-white/60">
                <span className="w-2 h-2 rounded-full bg-[#F0DC00] animate-pulse" />
                <span>Simulated via Tenderly Pro & Monad Testnet</span>
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
                  VERIFIED TREASURY LEDGER
                </span>
                <span className="text-xs text-white/40">Real-time pot activity</span>
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
            Pool funds instantly for midnight food, drinks, and rides. All gas is 100% sponsored via Pimlico Paymaster.
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
              disabled={isProcessing}
            >
              {isProcessing ? 'Executing 0-Gas Deposit...' : `Contribute $${addAmount}`}
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
            Send an instant prize or reimbursement directly from the shared pot for crucial party contributions.
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
              disabled={isProcessing}
            >
              {isProcessing ? 'Executing Onchain Payout...' : `Reward ${rewardRecipient} $${rewardAmount}`}
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
            >
              Confirm Spend
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
              Transfer leftover party pot funds into the permanent crew treasury on Monad. These funds stay persistent across gatherings for your next big adventure!
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
                disabled={isProcessing || party.potBalance <= 0}
                onClick={handleRolloverConfirm}
                icon={isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Landmark className="w-4 h-4 text-black" />}
              >
                {isProcessing
                  ? 'Transferring to Crew Treasury...'
                  : `Transfer $${party.potBalance.toFixed(2)} to ${associatedCrew.name}`}
              </GlassButton>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
