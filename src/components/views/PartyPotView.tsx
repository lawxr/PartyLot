'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowUpRight, ArrowDownLeft, ShieldCheck, Sparkles, Send, Award, Disc, Flame } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LiquidBlob } from '@/components/ui/LiquidBlob';
import { executeSponsoredUserOp, getOrCreateSmartAccount } from '@/lib/web3/smartAccount';
import { simulateTreasuryCall } from '@/lib/web3/metropolis';
import confetti from 'canvas-confetti';

export const PartyPotView: React.FC = () => {
  const { parties, currentPartyId, transactions, addToPot, spendFromPot } = usePartyStore();
  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyTransactions = transactions.filter((t) => t.partyId === party.id);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSpendOpen, setIsSpendOpen] = useState(false);
  const [isRewardOpen, setIsRewardOpen] = useState(false);

  const [addAmount, setAddAmount] = useState('20');
  const [spendAmount, setSpendAmount] = useState('15');
  const [spendDesc, setSpendDesc] = useState('');
  const [rewardRecipient, setRewardRecipient] = useState(party.members[1]?.name || 'Ana');
  const [rewardRole, setRewardRole] = useState('OFFICIAL_DJ');
  const [rewardAmount, setRewardAmount] = useState('10');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(addAmount);
    if (isNaN(val) || val <= 0) return;

    setIsProcessing(true);

    // 1. Pre-simulate call via Tenderly Pro to guarantee zero-revert execution
    await simulateTreasuryCall('0xPartyTreasury', 'deposit', { amount: val });

    // 2. Execute sponsored UserOp via Pimlico Paymaster on Monad
    const account = getOrCreateSmartAccount();
    await executeSponsoredUserOp(account.address, [
      { to: '0xPartyTreasury', value: val, label: 'PartyPot.deposit()' },
    ]);

    addToPot(party.id, val, 'Sponsored Treasury Deposit');
    setIsProcessing(false);
    setIsAddOpen(false);

    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E9FF32', '#FFFFFF', '#60A5FA'],
    });
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
    await simulateTreasuryCall('0xPartyTreasury', 'distributeReward', {
      recipient: rewardRecipient,
      amount: val,
      role: rewardRole,
    });

    const account = getOrCreateSmartAccount();
    await executeSponsoredUserOp(account.address, [
      { to: '0xPartyTreasury', value: 0, label: `distributeReward(${rewardRole})` },
    ]);

    spendFromPot(party.id, val, `Reward for ${rewardRecipient} (${rewardRole})`);
    setIsProcessing(false);
    setIsRewardOpen(false);

    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#E9FF32', '#F59E0B', '#10B981'],
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 select-none">
      <TopNav title="SHARED TREASURY" />

      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto pt-2 w-full">
        {/* Editorial Header */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E9FF32]">
              CREW TREASURY · ERC-4337
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-none mt-1">
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
              icon={<Award className="w-4 h-4 text-[#E9FF32]" />}
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
                <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-[#E9FF32] border border-white/10">
                  <ShieldCheck className="w-3 h-3 text-[#E9FF32]" />
                  PIMLICO SPONSORED · 0 GAS
                </span>
              </div>
            </div>

            {/* Mobile Action Buttons (3 grid) */}
            <div className="grid sm:hidden grid-cols-3 gap-2.5 w-full my-6">
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
                icon={<Award className="w-4 h-4 text-[#E9FF32]" />}
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

            {/* Social Stake Banner */}
            <div className="w-full p-4 rounded-3xl liquid-glass-card mt-2 sm:mt-6 text-left border border-white/10">
              <span className="text-[10px] uppercase font-bold text-[#E9FF32] tracking-wider block">
                SOCIAL PARTICIPATION → ECONOMIC STAKE
              </span>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Leftover pot automatically rolls over to the next gathering. Contributor prizes are audited on Monad.
              </p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10 text-[11px] text-white/60">
                <span className="w-2 h-2 rounded-full bg-[#E9FF32] animate-pulse" />
                <span>Simulated via Tenderly Pro & Monad Testnet</span>
              </div>
            </div>
          </div>

          {/* Right Column: Verified Ledger Feed (7 cols on desktop) */}
          <div className="lg:col-span-7 w-full text-left">
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/60 block">
                  VERIFIED TREASURY LEDGER
                </span>
                <span className="text-xs text-white/40">Real-time pot activity</span>
              </div>
              <span className="text-xs text-[#E9FF32] font-mono font-semibold">
                {partyTransactions.length} records
              </span>
            </div>

            <div className="space-y-3">
              {partyTransactions.map((tx) => {
                const isAdd = tx.type === 'add';
                return (
                  <GlassPanel
                    key={tx.id}
                    level={2}
                    className="p-4 sm:p-5 flex items-center justify-between border border-white/15 hover:border-white/25 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full overflow-hidden border border-white/20 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tx.userAvatar} alt={tx.userName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-white">
                          {tx.userName}
                        </h4>
                        <p className="text-xs text-white/50">{tx.description} · {tx.timestamp}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-display font-black text-lg sm:text-xl ${
                          isAdd ? 'text-[#E9FF32]' : 'text-rose-400'
                        }`}
                      >
                        {isAdd ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                      </span>
                      <span className="block text-[10px] text-white/40 uppercase font-mono">
                        {isAdd ? 'Deposit' : 'Distributed'}
                      </span>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          </div>
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
            Pool funds instantly for midnight food, drinks, and Uber rides. All gas is 100% sponsored.
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
                      ? 'bg-[#E9FF32] text-black shadow-lg scale-105'
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
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white font-display font-black text-2xl outline-none border border-white/20 focus:border-[#E9FF32]"
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
              {isProcessing ? 'Simulating via Tenderly...' : `Contribute $${addAmount}`}
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
                      ? 'bg-[#E9FF32] text-black shadow-md'
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
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white font-display font-black text-2xl outline-none border border-white/20 focus:border-[#E9FF32]"
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
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white text-base font-semibold outline-none border border-white/20 focus:border-[#E9FF32]"
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
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white font-display font-black text-2xl outline-none border border-white/20 focus:border-[#E9FF32]"
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
    </div>
  );
};
