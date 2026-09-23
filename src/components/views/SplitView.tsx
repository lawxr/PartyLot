'use client';

import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Loader2,
  Wine,
  Pizza,
  Car,
  Music,
  Home,
  Package,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { calculateNetBalances, computeDebtSettlements } from '@/services/settlements';
import { settleDamageOnchain } from '@/services/treasury';
import { ExpenseCategory } from '@/types';
import confetti from 'canvas-confetti';

const CATEGORIES: {
  id: ExpenseCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { id: 'drinks', label: 'Drinks', icon: Wine, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { id: 'food', label: 'Food', icon: Pizza, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  { id: 'transport', label: 'Transport', icon: Car, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { id: 'music', label: 'DJ / Music', icon: Music, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { id: 'venue', label: 'Venue', icon: Home, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  { id: 'supplies', label: 'Supplies', icon: Package, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  { id: 'general', label: 'General', icon: Tag, color: 'text-white/70 bg-white/10 border-white/15' },
];

export const SplitView: React.FC = () => {
  const { parties, currentPartyId, expenses, addExpense, settleAllDebts } = usePartyStore();
  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyExpenses = expenses.filter((e) => e.partyId === party.id);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [settlementSuccessTx, setSettlementSuccessTx] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);

  // Form states
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('drinks');
  const [paidById, setPaidById] = useState(party.members[0]?.id || 'u-law');
  const [splitBetween, setSplitBetween] = useState<string[]>(party.members.map((m) => m.id));

  // Category filter state
  const [selectedFilter, setSelectedFilter] = useState<'all' | ExpenseCategory>('all');

  // Calculations
  const netBalances = calculateNetBalances(partyExpenses, party.members);
  const settlements = computeDebtSettlements(netBalances, party.members);
  const totalAmount = partyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = selectedFilter === 'all'
    ? partyExpenses
    : partyExpenses.filter((e) => (e.category || 'general') === selectedFilter);

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
      category,
    });

    setDesc('');
    setAmount('');
    setCategory('drinks');
    setIsAddOpen(false);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#E9FF32', '#FFFFFF'],
    });
  };

  const handleSettleConfirm = async () => {
    if (settlements.length === 0) {
      setIsSettleOpen(false);
      return;
    }

    setIsSettling(true);
    try {
      // Execute sponsored 0-gas debt settlement on Monad Testnet
      const receipt = await settleDamageOnchain(party.id, settlements);

      settleAllDebts(party.id, receipt.txHash);
      setSettlementSuccessTx(receipt.txHash);

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#E9FF32', '#FFFFFF', '#10B981'],
      });
    } catch (err) {
      console.error('Failed onchain settlement, applying local settlement:', err);
      settleAllDebts(party.id);
      setIsSettleOpen(false);
    } finally {
      setIsSettling(false);
    }
  };

  const handleCopyTx = (tx: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(tx);
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
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

  const getCategoryMeta = (catId?: ExpenseCategory) => {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 select-none">
      <TopNav title="EXPENSE ENGINE" />

      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto pt-2 w-full">
        {/* Editorial Header */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E9FF32]">
                AUTOMATIC LIQUIDATION
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Monad 0-Gas
              </span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-none">
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
                onClick={() => {
                  setSettlementSuccessTx(null);
                  setIsSettleOpen(true);
                }}
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
            onClick={() => {
              setSettlementSuccessTx(null);
              setIsSettleOpen(true);
            }}
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
            <div className="p-5 rounded-3xl liquid-glass-card border border-white/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E9FF32]">
                  SETTLEMENT ENGINE
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ERC-4337 Sponsored
                </span>
              </div>
              <h4 className="font-display font-black text-xl text-white mb-2">
                Optimal Debt Routing
              </h4>
              <p className="text-xs text-white/70 leading-relaxed mb-4">
                Reduces total transfers to the mathematical minimum and settles natively on Monad with 0 gas via Pimlico Paymaster.
              </p>
              <GlassButton
                variant="glass"
                size="md"
                fullWidth
                onClick={() => {
                  setSettlementSuccessTx(null);
                  setIsSettleOpen(true);
                }}
                icon={<CheckCircle2 className="w-4 h-4 text-[#E9FF32]" />}
              >
                Review & Settle Up
              </GlassButton>
            </div>
          </div>

          {/* Right Column: Expenses List (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedFilter === 'all'
                    ? 'bg-[#E9FF32] text-black shadow-md'
                    : 'liquid-glass-card text-white/60 hover:text-white'
                }`}
              >
                All ({partyExpenses.length})
              </button>

              {CATEGORIES.map((cat) => {
                const count = partyExpenses.filter((e) => (e.category || 'general') === cat.id).length;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedFilter(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                      selectedFilter === cat.id
                        ? 'bg-white text-black shadow-md'
                        : 'liquid-glass-card text-white/60 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                    {count > 0 && <span className="opacity-60 text-[10px]">({count})</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                RECENT BILLS ({filteredExpenses.length})
              </span>
              <span className="text-xs text-white/40">Itemized expenses</span>
            </div>

            <div className="space-y-3">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => {
                  const meta = getCategoryMeta(exp.category);
                  const Icon = meta.icon;
                  const perPerson = exp.splitBetweenIds.length > 0 ? exp.amount / exp.splitBetweenIds.length : exp.amount;

                  return (
                    <GlassPanel
                      key={exp.id}
                      level={2}
                      className="p-4 sm:p-5 flex items-center justify-between border border-white/15 hover:border-white/25 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${meta.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-base sm:text-lg text-white">
                              {exp.description}
                            </h4>
                            {exp.isSettled && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                Settled
                              </span>
                            )}
                          </div>
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
                          ${perPerson.toFixed(2)} / ea
                        </span>
                      </div>
                    </GlassPanel>
                  );
                })
              ) : (
                <div className="p-8 text-center rounded-3xl liquid-glass-card border border-white/10">
                  <Receipt className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-xs text-white/50">No expenses recorded in this category yet.</p>
                </div>
              )}
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
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'border-[#E9FF32] bg-[#E9FF32]/10 text-white'
                        : 'border-white/10 opacity-60 text-white/60 hover:opacity-100'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 text-[#E9FF32]" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sourdough Pizza, Drinks, Ice, Venue Deposit..."
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
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
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
        onClose={() => {
          if (!isSettling) {
            setIsSettleOpen(false);
            setSettlementSuccessTx(null);
          }
        }}
        title="Optimal Debt Settlement"
      >
        <div className="space-y-4">
          {settlementSuccessTx ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#E9FF32] block mb-1">
                  SETTLEMENT COMPLETE
                </span>
                <h3 className="font-display font-black text-2xl text-white">
                  Debts Liquidated Onchain
                </h3>
                <p className="text-xs text-white/70 max-w-sm mx-auto mt-1">
                  Settled via Monad Testnet with sponsored zero gas via Pimlico Paymaster.
                </p>
              </div>

              {/* TX Card */}
              <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15 text-left space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                  Monad Transaction Hash
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[#E9FF32] truncate">
                    {settlementSuccessTx}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyTx(settlementSuccessTx)}
                    className="p-1.5 rounded-lg liquid-glass-card hover:bg-white/10 text-white/70 hover:text-white"
                  >
                    {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <GlassButton
                  variant="accent"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    setIsSettleOpen(false);
                    setSettlementSuccessTx(null);
                  }}
                >
                  Done
                </GlassButton>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Sponsored Gas Active</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Pimlico · 0 Gas Cost
                </span>
              </div>

              <p className="text-xs text-white/70">
                Based on all party bills, here is the minimum set of transactions calculated by our greedy algorithm:
              </p>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
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
                  disabled={isSettling || settlements.length === 0}
                  onClick={handleSettleConfirm}
                  icon={isSettling ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Sparkles className="w-4 h-4 text-black" />}
                >
                  {isSettling ? 'Settling on Monad...' : 'Execute 0-Gas Settlement'}
                </GlassButton>
              </div>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};
