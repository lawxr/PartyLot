'use client';

import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Wine,
  Pizza,
  Car,
  Music,
  Home,
  Package,
  Tag,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassButton } from '@/components/ui/GlassButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TokenLogo, CryptoBadge } from '@/components/ui/TokenLogo';
import { calculateNetBalances, computeDebtSettlements } from '@/services/settlements';
import { ExpenseCategory } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { INITIAL_PARTIES } from '@/data/mockData';
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
  const { language } = useTranslation();
  const isEs = language === 'es';
  const defaultParty = INITIAL_PARTIES[0];
  const party = parties.find((p) => p.id === currentPartyId) || parties[0] || defaultParty;
  const partyMembers = party?.members || [];
  const partyExpenses = expenses.filter((e) => e.partyId === party?.id);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  // Form states
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('drinks');
  const [paidById, setPaidById] = useState(partyMembers[0]?.id || 'u-law');
  const [splitBetween, setSplitBetween] = useState<string[]>(partyMembers.map((m) => m.id));

  // Category filter state
  const [selectedFilter, setSelectedFilter] = useState<'all' | ExpenseCategory>('all');

  // Calculations
  const netBalances = calculateNetBalances(partyExpenses, partyMembers);
  const settlements = computeDebtSettlements(netBalances, partyMembers);
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
      colors: ['#F0DC00', '#FFFFFF'],
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

  const getCategoryMeta = (catId?: ExpenseCategory) => {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
  };

  const handleSettleOnchain = async () => {
    setIsSettling(true);
    try {
      await settleAllDebts(party.id);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2775CA', '#836EF9', '#F0DC00'],
      });
      setIsSettleOpen(false);
    } catch (err) {
      console.error('Error settling debts:', err);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#171512] pb-32 select-none">
      <TopNav title={isEs ? 'DIVISIÓN DE GASTOS' : 'EXPENSE ENGINE'} />

      <main className="px-4 sm:px-6 md:px-8 max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto pt-2 w-full">
        {/* Monad Testnet USDC Settlement Banner */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2775CA]/25 bg-gradient-to-r from-[#2775CA]/10 via-[#836EF9]/10 to-transparent p-3.5 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-2.5">
            <TokenLogo token="usdc" size="md" />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#171512] dark:text-white">
                <span>USDC Split Engine · Monad Testnet</span>
                <span className="px-2 py-0.5 rounded-full bg-[#836EF9]/15 text-[#674FF4] text-[10px] font-mono font-bold">
                  Chain 10143
                </span>
              </div>
              <span className="text-[11px] text-[#635B50]">
                {isEs
                  ? 'Minimización matemática de deudas con liquidación en USDC'
                  : 'Greedy debt minimization with 1-click onchain settlement in USDC'}
              </span>
            </div>
          </div>
          <CryptoBadge token="usdc" network="Monad" />
        </div>
        {/* Editorial Header */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(35,30,22,0.08)] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#B89600]">
                {isEs ? 'LIQUIDACIÓN DE CUENTAS' : 'DAMAGE CALCULATOR'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                <ShieldCheck className="w-3 h-3" />
                {isEs ? 'Sugerencia de división' : 'Suggested split'}
              </span>
            </div>
            <h2 className="font-bubble text-4xl sm:text-6xl text-[#171512] tracking-tight leading-none">
              {isEs ? 'DIVIDE LOS GASTOS' : 'SPLIT THE DAMAGE'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#6F6A62] block">
                {isEs ? 'TOTAL GASTADO (USDC)' : 'TOTAL SPENT (USDC)'}
              </span>
              <div className="flex items-center gap-1.5 justify-end">
                <TokenLogo token="usdc" size="sm" />
                <span className="font-display font-black text-2xl sm:text-3xl text-[#171512]">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <GlassButton
                variant="accent"
                size="md"
                onClick={() => setIsAddOpen(true)}
                icon={<Plus className="w-4 h-4 text-[#171512] stroke-[3]" />}
              >
                {isEs ? 'Añadir gasto' : 'Add expense'}
              </GlassButton>

              <GlassButton
                variant="glass"
                size="md"
                onClick={() => setIsSettleOpen(true)}
                disabled={settlements.length === 0}
                icon={<Sparkles className="w-4 h-4 text-[#171512]" />}
              >
                {isEs ? 'Saldar cuentas (USDC)' : 'Settle debts (USDC)'}
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
            icon={<Plus className="w-4 h-4 text-[#171512] stroke-[3]" />}
          >
            {isEs ? 'Añadir gasto' : 'Add expense'}
          </GlassButton>

          <GlassButton
            variant="glass"
            size="md"
            fullWidth
            disabled={settlements.length === 0}
            onClick={() => setIsSettleOpen(true)}
            icon={<CheckCircle2 className="w-4 h-4 text-[#171512]" />}
          >
            {isEs ? 'Saldar cuentas' : 'Settle debts'}
          </GlassButton>
        </div>

        {/* Responsive Multi-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Net Balances & Settle Card (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Net Balances Summary Section */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A62]">
                  WHO OWES WHO
                </span>
                <span className="text-[11px] text-[#8E887E]">{isEs ? 'Cálculo orientativo' : 'Suggested calculation'}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5">
                {netBalances.map((b) => {
                  const isPositive = b.netAmount > 0.001;
                  const isNegative = b.netAmount < -0.001;

                  return (
                    <div
                      key={b.memberId}
                      className="p-3.5 flex flex-col justify-between rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_2px_12px_rgba(40,30,20,0.03)]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-black/5 shrink-0 flex items-center justify-center bg-[#F1EADF]">
                          {b.avatar ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={b.avatar} alt={b.memberName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-[#171512]">
                              {b.memberName ? b.memberName.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-[#171512] truncate">
                          {b.memberName}
                        </span>
                      </div>

                      <div className="text-left">
                        <span
                          className={`font-display font-black text-base ${
                            isPositive
                              ? 'text-[#8C7300]'
                              : isNegative
                              ? 'text-rose-600'
                              : 'text-[#8E887E]'
                          }`}
                        >
                          {isPositive ? `+$${b.netAmount.toFixed(2)}` : isNegative ? `-$${Math.abs(b.netAmount).toFixed(2)}` : '$0.00'}
                        </span>
                        <span className="block text-[9px] uppercase font-bold text-[#8E887E] tracking-wider">
                          {isPositive ? (isEs ? 'recibe' : 'gets back') : isNegative ? (isEs ? 'debe' : 'owes') : (isEs ? 'en equilibrio' : 'balanced')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Desktop Quick Settlement Summary */}
            <div className="p-5 rounded-3xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_4px_20px_rgba(40,30,20,0.04)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B89600]">
                  {isEs ? 'DIVISIÓN SUGERIDA' : 'SUGGESTED SPLIT'}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  {isEs ? 'Sin pagos' : 'No payments'}
                </span>
              </div>
              <h4 className="font-display font-black text-xl text-[#171512] mb-2">
                {isEs ? 'Resumen de saldos' : 'Balance summary'}
              </h4>
              <p className="text-xs text-[#6F6A62] leading-relaxed mb-4">
                Reduce las transferencias entre amigos al mínimo matemático para que nadie pague de más.
              </p>
              <GlassButton
                variant="accent"
                size="md"
                fullWidth
                disabled={settlements.length === 0}
                onClick={() => {
                  setIsSettleOpen(true);
                }}
                icon={<Sparkles className="w-4 h-4 text-[#171512]" />}
              >
                {isEs ? 'Saldar cuentas en Monad (USDC)' : 'Settle debts on Monad (USDC)'}
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
                    : 'bg-[#FFFDF8] text-[#6F6A62] hover:text-[#171512] border border-[rgba(35,30,22,0.08)] shadow-xs'
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedFilter === cat.id
                        ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
                        : 'bg-[#FFFDF8] text-[#6F6A62] hover:text-[#171512] border border-[rgba(35,30,22,0.08)] shadow-xs'
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
              <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A62]">
                RECENT BILLS ({filteredExpenses.length})
              </span>
              <span className="text-xs text-[#8E887E]">Itemized expenses</span>
            </div>

            <div className="space-y-3">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => {
                  const meta = getCategoryMeta(exp.category);
                  const Icon = meta.icon;
                  const perPerson = exp.splitBetweenIds.length > 0 ? exp.amount / exp.splitBetweenIds.length : exp.amount;

                  return (
                    <div
                      key={exp.id}
                      className="p-4 sm:p-5 flex items-center justify-between bg-[#FFFDF8] border border-[rgba(35,30,22,0.07)] rounded-[20px] shadow-[0_4px_16px_rgba(40,30,20,0.03)] hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${meta.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-base sm:text-lg text-[#171512]">
                              {exp.description}
                            </h4>
                            {exp.isSettled && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                {isEs ? 'Marcado como saldado' : 'Previously marked settled'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6F6A62]">
                            Paid by <span className="text-[#171512] font-semibold">{exp.paidByName}</span> · split by {exp.splitBetweenIds.length} people
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-display font-black text-lg sm:text-xl text-[#171512]">
                          ${exp.amount.toFixed(2)}
                        </span>
                        <span className="block text-xs text-[#8C7300] font-semibold">
                          ${perPerson.toFixed(2)} / ea
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center rounded-3xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-sm">
                  <Receipt className="w-8 h-8 text-[#999187] mx-auto mb-2" />
                  <p className="text-xs text-[#6F6A62]">No expenses recorded in this category yet.</p>
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
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
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
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#F0DC00] bg-[#FFF5C0] text-[#171512]'
                        : 'border-[rgba(35,30,22,0.08)] bg-[#F7F2E8] text-[#6F6A62] hover:text-[#171512]'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 text-[#B89600]" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
              Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sourdough Pizza, Drinks, Ice, Venue Deposit..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F2E8] text-[#171512] placeholder-[#999187] text-base font-semibold outline-none border border-[rgba(35,30,22,0.1)] focus:border-[#F0DC00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
              Amount ($)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display font-black text-xl text-[#8E887E]">
                $
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-[#F7F2E8] text-[#171512] font-display font-black text-2xl outline-none border border-[rgba(35,30,22,0.1)] focus:border-[#F0DC00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
              Paid by
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {party.members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setPaidById(member.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    paidById === member.id
                      ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
                      : 'bg-[#F7F2E8] text-[#6F6A62] border border-[rgba(35,30,22,0.08)]'
                  }`}
                >
                  {member.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={member.avatar} alt={member.name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[#EFE9DF] flex items-center justify-center text-[9px] font-bold text-[#171512]">
                      {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span>{member.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5 flex justify-between">
              <span>Split Between</span>
              <span className="text-[#B89600] font-bold">{splitBetween.length} selected</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {party.members.map((member) => {
                const isSelected = splitBetween.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleSplitMember(member.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#F0DC00] bg-[#FFF5C0] text-[#171512]'
                        : 'border-[rgba(35,30,22,0.08)] bg-[#F7F2E8] text-[#6F6A62]'
                    }`}
                  >
                    {member.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#EFE9DF] flex items-center justify-center text-[10px] font-bold text-[#171512]">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
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
          if (!isSettling) setIsSettleOpen(false);
        }}
        title={isEs ? 'Saldar Cuentas (USDC)' : 'Settle Debts (USDC)'}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#2775CA]/10 to-[#836EF9]/10 border border-[#2775CA]/20">
            <div className="flex items-center gap-2.5">
              <TokenLogo token="usdc" size="md" />
              <div>
                <span className="text-xs font-bold text-[#171512] block">
                  {isEs ? 'Liquidación instantánea en Monad' : 'Instant settlement on Monad'}
                </span>
                <span className="text-[10px] text-[#6F6A62]">
                  {isEs ? 'Algoritmo codicioso de transferencias mínimas' : 'Greedy minimal-transfer algorithm'}
                </span>
              </div>
            </div>
            <CryptoBadge token="usdc" network="Monad" showNetwork={false} />
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {settlements.map((settlement, index) => (
              <div
                key={`${settlement.fromId}-${settlement.toId}-${index}`}
                className="p-3.5 rounded-2xl bg-[#F7F2E8] border border-[rgba(35,30,22,0.08)] flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-rose-600">{settlement.fromName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8E887E]" />
                  <span className="font-bold text-xs text-emerald-700">{settlement.toName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TokenLogo token="usdc" size="xs" />
                  <span className="font-display font-black text-base text-[#171512]">
                    ${settlement.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              disabled={isSettling || settlements.length === 0}
              onClick={handleSettleOnchain}
            >
              {isSettling
                ? isEs ? 'Liquidando en Monad...' : 'Settling on Monad...'
                : isEs
                ? `Confirmar liquidación (${settlements.length} pagos en USDC)`
                : `Confirm settlement (${settlements.length} payments in USDC)`}
            </GlassButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
