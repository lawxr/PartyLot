'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Receipt, CheckCircle2, ArrowRight, Sparkles, DollarSign } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { calculateNetBalances, computeDebtSettlements } from '@/services/settlements';
import confetti from 'canvas-confetti';

export const SplitView: React.FC = () => {
  const { parties, currentPartyId, expenses, addExpense, settleAllDebts } = usePartyStore();
  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyExpenses = expenses.filter((e) => e.partyId === party.id);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);

  // Form states
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState(party.members[0]?.id || 'u-law');
  const [splitBetween, setSplitBetween] = useState<string[]>(party.members.map((m) => m.id));

  // Calculations
  const netBalances = calculateNetBalances(partyExpenses, party.members);
  const settlements = computeDebtSettlements(netBalances, party.members);
  const totalAmount = partyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!desc.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    addExpense({
      partyId: party.id,
      description: desc.trim(),
      amount: parsedAmount,
      paidById,
      splitBetweenIds: splitBetween.length > 0 ? splitBetween : party.members.map((m) => m.id),
    });

    setDesc('');
    setAmount('');
    setIsAddOpen(false);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#E9FF32', '#FFFFFF'],
    });
  };

  const handleSettleConfirm = () => {
    settleAllDebts(party.id);
    setIsSettleOpen(false);

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.5 },
      colors: ['#E9FF32', '#FFFFFF', '#10B981'],
    });
  };

  const toggleSplitMember = (memberId: string) => {
    if (splitBetween.includes(memberId)) {
      if (splitBetween.length > 1) {
        setSplitBetween(splitBetween.filter((id) => id !== memberId));
      }
    } else {
      setSplitBetween([...splitBetween, memberId]);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 select-none">
      <TopNav title="EXPENSE ENGINE" />

      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto pt-2 w-full">
        {/* Editorial Header */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E9FF32]">
              AUTOMATIC LIQUIDATION
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-none mt-1">
              SPLIT THE DAMAGE
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-white/50 block">
                TOTAL SPENT
              </span>
              <span className="font-display font-black text-2xl sm:text-3xl text-[#E9FF32]">
                ${totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <GlassButton
                variant="accent"
                size="md"
                onClick={() => setIsAddOpen(true)}
                icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
              >
                Add expense
              </GlassButton>

              <GlassButton
                variant="glass"
                size="md"
                onClick={() => setIsSettleOpen(true)}
                icon={<CheckCircle2 className="w-4 h-4 text-[#E9FF32]" />}
              >
                SETTLE UP
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Mobile Action Bar */}
        <div className="flex sm:hidden items-center gap-3 mb-6">
          <GlassButton
            variant="accent"
            size="md"
            fullWidth
            onClick={() => setIsAddOpen(true)}
            icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
          >
            Add expense
          </GlassButton>

          <GlassButton
            variant="glass"
            size="md"
            fullWidth
            onClick={() => setIsSettleOpen(true)}
            icon={<CheckCircle2 className="w-4 h-4 text-[#E9FF32]" />}
          >
            SETTLE UP
          </GlassButton>
        </div>

        {/* Responsive Multi-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Net Balances & Settle Card (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Net Balances Summary Section */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  WHO OWES WHO
                </span>
                <span className="text-[11px] text-white/40">Real-time ledger</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5">
                {netBalances.map((b) => {
                  const isPositive = b.netAmount > 0.001;
                  const isNegative = b.netAmount < -0.001;

                  return (
                    <GlassPanel
                      key={b.memberId}
                      level={2}
                      className="p-3.5 flex flex-col justify-between border border-white/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={b.avatar} alt={b.memberName} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-white truncate">
                          {b.memberName}
                        </span>
                      </div>

                      <div className="text-left">
                        <span
                          className={`font-display font-black text-base ${
                            isPositive
                              ? 'text-[#E9FF32]'
                              : isNegative
                              ? 'text-rose-400'
                              : 'text-white/40'
                          }`}
                        >
                          {isPositive ? `+$${b.netAmount.toFixed(2)}` : isNegative ? `-$${Math.abs(b.netAmount).toFixed(2)}` : '$0.00'}
                        </span>
                        <span className="block text-[9px] uppercase font-bold text-white/40 tracking-wider">
                          {isPositive ? 'gets back' : isNegative ? 'owes' : 'settled'}
                        </span>
                      </div>
                    </GlassPanel>
                  );
                })}
              </div>
            </section>

            {/* Desktop Quick Settlement Summary */}
            <div className="hidden lg:block p-5 rounded-3xl liquid-glass-card border border-white/15">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E9FF32] block mb-1">
                SETTLEMENT ENGINE
              </span>
              <h4 className="font-display font-black text-xl text-white mb-2">
                Optimal Debt Routing
              </h4>
              <p className="text-xs text-white/70 leading-relaxed mb-4">
                Reduces total bank transfers using a greedy debt minimization algorithm.
              </p>
              <GlassButton
                variant="glass"
                size="md"
                fullWidth
                onClick={() => setIsSettleOpen(true)}
                icon={<CheckCircle2 className="w-4 h-4 text-[#E9FF32]" />}
              >
                Review & Settle Up
              </GlassButton>
            </div>
          </div>

          {/* Right Column: Expenses List (7 cols on desktop) */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                RECENT BILLS ({partyExpenses.length})
              </span>
              <span className="text-xs text-white/40">Itemized expenses</span>
            </div>

            <div className="space-y-3">
              {partyExpenses.map((exp) => (
                <GlassPanel
                  key={exp.id}
                  level={2}
                  className="p-4 sm:p-5 flex items-center justify-between border border-white/15 hover:border-white/25 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0">
                      <Receipt className="w-5 h-5 text-white/80" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base sm:text-lg text-white">
                        {exp.description}
                      </h4>
                      <p className="text-xs text-white/50">
                        Paid by <span className="text-white font-semibold">{exp.paidByName}</span> · split by {exp.splitBetweenIds.length} people
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-display font-black text-lg sm:text-xl text-white">
                      ${exp.amount.toFixed(2)}
                    </span>
                    <span className="block text-xs text-[#E9FF32] font-semibold">
                      ${(exp.amount / exp.splitBetweenIds.length).toFixed(2)} / ea
                    </span>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* BottomSheet: + Add Expense */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Expense"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sourdough Pizza, Drinks, Ice..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white placeholder-white/30 text-base font-semibold outline-none border border-white/20 focus:border-[#E9FF32]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Amount ($)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display font-black text-xl text-white/50">
                $
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl liquid-glass-card text-white font-display font-black text-2xl outline-none border border-white/20 focus:border-[#E9FF32]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Paid by
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {party.members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setPaidById(member.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                    paidById === member.id
                      ? 'bg-[#E9FF32] text-black shadow-md'
                      : 'liquid-glass-card text-white/70'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={member.avatar} alt={member.name} className="w-4 h-4 rounded-full object-cover" />
                  <span>{member.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 flex justify-between">
              <span>Split Between</span>
              <span className="text-[#E9FF32]">{splitBetween.length} selected</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {party.members.map((member) => {
                const isSelected = splitBetween.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleSplitMember(member.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'border-[#E9FF32] bg-[#E9FF32]/10 text-white'
                        : 'border-white/10 opacity-50 text-white/50'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="truncate">{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              type="submit"
            >
              Split Expense
            </GlassButton>
          </div>
        </form>
      </BottomSheet>

      {/* BottomSheet: SETTLE UP Confirmation */}
      <BottomSheet
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        title="Optimal Settlement"
      >
        <div className="space-y-4">
          <p className="text-xs text-white/70">
            Based on all party bills, here is the minimum set of payments to square everyone up:
          </p>

          <div className="space-y-2.5">
            {settlements.length > 0 ? (
              settlements.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl liquid-glass-card flex items-center justify-between border border-white/15"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-rose-300">{s.fromName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                    <span className="font-bold text-xs text-[#E9FF32]">{s.toName}</span>
                  </div>

                  <span className="font-display font-black text-base text-white">
                    ${s.amount.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#E9FF32] font-semibold text-center py-4">
                ✨ Everyone is completely squared up! No debts pending.
              </p>
            )}
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              onClick={handleSettleConfirm}
            >
              Confirm All Settled
            </GlassButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
