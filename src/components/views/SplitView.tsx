'use client';

import React, { useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import {
  ArrowLeft,
  ChevronRight,
  MoreHorizontal,
  Coins,
  Users,
  Wine,
  Pizza,
  Car,
  Send,
  Plus,
  Receipt,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import {
  AddExpenseSheet,
  SettleDebtsSheet,
  SplitOptionsMenu,
  calculateNetBalances,
  computeDebtSettlements,
} from '@/features/expenses';
import type { ExpenseCategory } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import confetti from 'canvas-confetti';

export const SplitView: React.FC = () => {
  const { parties, currentPartyId, expenses, addExpense, settleAllDebts, goBack, setCurrentView, currentUser } = usePartyStore();
  const { t, language } = useTranslation();
  const isEs = language === 'es';
  const { wallets } = useWallets();
  const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
  const [settleError, setSettleError] = useState<string | null>(null);

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyMembers = party?.members || [];
  const partyExpenses = expenses.filter((e) => e.partyId === party?.id);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'equal' | 'custom' | 'items'>('equal');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  // Add Expense Form state
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('drinks');
  const [paidById, setPaidById] = useState(partyMembers[0]?.id || currentUser?.id || '');
  const [splitBetween, setSplitBetween] = useState<string[]>(partyMembers.map((m) => m.id));

  // Custom split weights state
  const [customWeights, setCustomWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    partyMembers.forEach((m) => {
      initial[m.id] = 1;
    });
    return initial;
  });

  // Calculations
  const netBalances = calculateNetBalances(partyExpenses, partyMembers);
  const settlements = computeDebtSettlements(netBalances, partyMembers);
  const totalAmount = partyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown calculation
  const drinksTotal = partyExpenses
    .filter((e) => e.category === 'drinks')
    .reduce((sum, e) => sum + e.amount, 0);

  const snacksTotal = partyExpenses
    .filter((e) => e.category === 'food')
    .reduce((sum, e) => sum + e.amount, 0);

  const rideTotal = partyExpenses
    .filter((e) => e.category === 'transport')
    .reduce((sum, e) => sum + e.amount, 0);

  const safeTotal = totalAmount > 0 ? totalAmount : 1;
  const drinksPercent = totalAmount > 0 ? Math.round((drinksTotal / safeTotal) * 100) : 0;
  const snacksPercent = totalAmount > 0 ? Math.round((snacksTotal / safeTotal) * 100) : 0;
  const ridePercent = totalAmount > 0 ? Math.round((rideTotal / safeTotal) * 100) : 0;

  // Handle Create Expense
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
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F0DC00', '#171512', '#FFFFFF'],
    });
  };

  // Handle Onchain Settlement
  const handleSettleOnchain = async () => {
    setSettleError(null);
    setIsSettling(true);
    try {
      const result = await settleAllDebts(party.id, { wallet: activeWallet });
      if (result.partial) {
        setSettleError(result.message);
      } else {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2775CA', '#836EF9', '#F0DC00'],
        });
        setIsSettleOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error settling debts on Monad.';
      setSettleError(msg);
      console.error('Error settling debts:', err);
    } finally {
      setIsSettling(false);
    }
  };

  // Toggle member in expense split
  const toggleSplitMember = (memberId: string) => {
    if (splitBetween.includes(memberId)) {
      if (splitBetween.length > 1) {
        setSplitBetween(splitBetween.filter((id) => id !== memberId));
      }
    } else {
      setSplitBetween([...splitBetween, memberId]);
    }
  };

  // Calculate real debtor list from settlements
  const realDebtorsList = settlements
    .filter((s) => s.toId === currentUser.id)
    .map((s) => ({
      id: s.fromId,
      name: s.fromName,
      avatar: s.fromAvatar,
      subtitle: isEs ? 'Debe transferir' : 'Owes you',
      type: 'debtor' as const,
      amount: `$${s.amount.toFixed(2)}`,
    }));

  // Calculate real creditor list from settlements
  const realCreditorsList = settlements
    .filter((s) => s.fromId === currentUser.id)
    .map((s) => ({
      id: s.toId,
      name: s.toName,
      avatar: s.toAvatar,
      subtitle: isEs ? 'Debes transferir' : 'You owe',
      type: 'creditor' as const,
      amount: `$${s.amount.toFixed(2)}`,
    }));

  // Combine debtors and creditors for the equal tab display
  const realMembersList = [
    ...realDebtorsList,
    ...realCreditorsList,
  ];

  if (!party) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] flex flex-col items-center justify-center p-6 text-center transition-colors duration-200">
        <h2 className="font-display font-black text-2xl text-[#171512] dark:text-white mb-2">
          {isEs ? 'Sin fiesta seleccionada' : 'No Party Selected'}
        </h2>
        <p className="text-xs text-[#8E887E] dark:text-[#A8A196] max-w-xs mb-6 leading-relaxed">
          {isEs
            ? 'Selecciona una fiesta para dividir gastos entre amigos.'
            : 'Select a gathering to split shared expenses.'}
        </p>
        <button
          onClick={() => {
            if (goBack) goBack();
            else setCurrentView('home');
          }}
          className="accent-button px-6 py-3 rounded-full text-xs font-bold cursor-pointer"
        >
          {isEs ? 'Volver al Inicio' : 'Return Home'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] flex flex-col justify-between selection:bg-[#F0DC00]/30 transition-colors duration-200">
      {/* Mobile-first Container matching the exact mockup */}
      <div className="w-full max-w-md sm:max-w-lg mx-auto flex-1 flex flex-col px-4 pt-3 pb-24 relative">
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between py-2 mb-3">
          {/* Back Button */}
          <button
            type="button"
            onClick={goBack}
            className="w-11 h-11 rounded-full glass-light flex items-center justify-center text-[#171512] dark:text-white border border-black/10 dark:border-white/20 shadow-sm active:scale-95 transition-transform cursor-pointer p-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
          </button>

          {/* Center Party Profile Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shrink-0 shadow-xs bg-[#EFEAE2] dark:bg-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={party.coverImage || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=400&q=80'}
                alt={party.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <h1 className="font-display font-black text-base sm:text-lg text-[#171512] dark:text-white leading-tight tracking-tight">
                {party.title}
              </h1>
              <span className="text-xs text-[#8A8173] dark:text-[#A8A196] leading-tight block font-medium">
                {t.split.title}
              </span>
            </div>
          </div>

          {/* Options Menu Button */}
          <button
            type="button"
            onClick={() => setIsOptionsOpen(true)}
            className="w-10 h-10 rounded-full bg-white/85 dark:bg-white/10 backdrop-blur-md border border-[rgba(35,30,22,0.06)] dark:border-white/10 shadow-xs flex items-center justify-center text-[#171512] dark:text-white hover:bg-white dark:hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            aria-label="Options"
          >
            <MoreHorizontal className="w-5 h-5 text-[#171512] dark:text-white" />
          </button>
        </header>

        {/* Hero Card: Total Shared Spend */}
        <section className="relative overflow-hidden rounded-[28px] p-5 sm:p-6 mb-4 split-hero-card">
          {/* Left Text Content */}
          <div className="relative z-10 max-w-[62%]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#171512]/5 dark:bg-white/10 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-[#171512] dark:text-[#F0DC00]" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#7A7265] dark:text-[#A8A196]">
                {t.split.totalSharedSpend}
              </span>
            </div>

            <div className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white tracking-tight mb-1">
              ${totalAmount.toFixed(2)}
            </div>

            <p className="text-xs text-[#8A8173] dark:text-[#A8A196] font-medium">
              {t.split.peopleUpdated(partyMembers.length, isEs ? 'al día' : 'up to date')}
            </p>
          </div>

          {/* Right 3D Frosted Glass Graphic with Orbs */}
          <div className="absolute right-0 top-0 bottom-0 w-44 pointer-events-none overflow-hidden select-none">
            {/* Background Golden Warm Glow Sphere */}
            <div
              className="absolute -right-2 top-2 w-28 h-28 rounded-full pointer-events-none opacity-85 dark:opacity-40"
              style={{
                background: 'radial-gradient(circle, #F5A623 0%, #FFD043 65%, rgba(255,208,67,0) 100%)',
                filter: 'blur(2px)',
              }}
            />

            {/* Smaller Warm Gold Orb */}
            <div
              className="absolute right-20 bottom-3 w-14 h-14 rounded-full pointer-events-none opacity-90 dark:opacity-30"
              style={{
                background: 'radial-gradient(circle, #FFD043 10%, #F5A623 75%, rgba(245,166,35,0) 100%)',
              }}
            />

            {/* Angled Frosted Glass Card Shape */}
            <div
              className="absolute right-2 top-3 w-32 h-20 rounded-2xl border border-white/60 dark:border-white/15 pointer-events-none shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.18) 100%)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transform: 'rotate(-8deg)',
              }}
            >
              <div className="w-10 h-6 border-b border-r border-white/40 dark:border-white/20 rounded-br-lg ml-3 mt-3 opacity-60" />
            </div>

            {/* Foreground Frosted Circle with Users Icon */}
            <div
              className="absolute right-8 bottom-3 w-15 h-15 rounded-full border border-white/85 dark:border-white/20 flex items-center justify-center pointer-events-none shadow-[0_6px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.4)]"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.25) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <Users className="w-7 h-7 text-white drop-shadow-sm stroke-[2.2]" />
            </div>
          </div>
        </section>

        {/* Segmented Control Pill: Equal / Custom / Items */}
        <div className="bg-[#ECE6DC]/85 dark:bg-white/10 p-1 rounded-full flex gap-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('equal')}
            className={`py-2 px-5 rounded-full text-xs sm:text-sm font-bold flex-1 text-center transition-all cursor-pointer ${
              activeTab === 'equal'
                ? 'bg-[#F0DC00] text-[#171512] shadow-xs'
                : 'text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white'
            }`}
          >
            {t.split.tabEqual}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`py-2 px-5 rounded-full text-xs sm:text-sm font-bold flex-1 text-center transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#F0DC00] text-[#171512] shadow-xs'
                : 'text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white'
            }`}
          >
            {t.split.tabCustom}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`py-2 px-5 rounded-full text-xs sm:text-sm font-bold flex-1 text-center transition-all cursor-pointer ${
              activeTab === 'items'
                ? 'bg-[#F0DC00] text-[#171512] shadow-xs'
                : 'text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white'
            }`}
          >
            {t.split.tabItems}
          </button>
        </div>

        {/* Tab 1: Equal Split (Real Balances or Empty State) */}
        {activeTab === 'equal' && (
          <div className="space-y-2.5 mb-5">
            {realMembersList.length > 0 ? (
              realMembersList.map((member) => (
                <div
                  key={member.id}
                  className="bg-[#FFFDF8] dark:bg-[#1C1A16] rounded-[22px] p-3 sm:p-3.5 border border-[rgba(35,30,22,0.06)] dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] flex items-center justify-between"
                >
                  {/* Member Avatar + Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-black/5 dark:border-white/10 shrink-0 bg-[#EFEAE2] dark:bg-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <span className="font-display font-bold text-sm sm:text-base text-[#171512] dark:text-white block leading-tight">
                        {member.name}
                      </span>
                      <span className="text-xs text-[#8A8173] dark:text-[#A8A196] font-medium leading-tight block">
                        {member.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Right Badge / Status */}
                  {member.type === 'debtor' && (
                    <div className="bg-[#EBF7EE] dark:bg-emerald-950/40 border border-[#BDE8CA] dark:border-emerald-800/50 rounded-2xl px-2.5 py-1 flex items-center gap-2 shadow-2xs">
                      <div className="text-left">
                        <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 leading-none block mb-0.5">
                          {t.split.youWillReceive}
                        </span>
                        <span className="font-display font-black text-sm text-emerald-700 dark:text-emerald-400 leading-none block">
                          {member.amount}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                    </div>
                  )}

                  {member.type === 'creditor' && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-black text-base text-[#171512] dark:text-white">
                        {member.amount}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#999187] dark:text-[#A8A196] stroke-[2.5]" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 rounded-[24px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[rgba(35,30,22,0.06)] dark:border-white/10 shadow-xs text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] dark:bg-white/5 border border-[rgba(35,30,22,0.08)] dark:border-white/10 flex items-center justify-center text-[#B89600] dark:text-[#F0DC00] mb-3">
                  <Receipt className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="font-display font-bold text-base text-[#171512] dark:text-white mb-1">
                  {isEs ? 'Sin cuentas ni gastos aún' : 'No split expenses yet'}
                </h3>
                <p className="text-xs text-[#8A8173] dark:text-[#A8A196] max-w-xs leading-relaxed mb-4">
                  {isEs
                    ? 'Agrega un gasto para calcular los saldos y liquidar deudas entre el grupo.'
                    : 'Add an expense to calculate net balances and settle up between members.'}
                </p>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F0DC00] text-[#171512] text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  {isEs ? 'Agregar primer gasto' : 'Add first expense'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Custom Split Adjustment */}
        {activeTab === 'custom' && (
          <div className="space-y-3 mb-5">
            <div className="p-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[rgba(35,30,22,0.06)] dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196]">
                  {isEs ? 'Reparto personalizado' : 'Custom split weights'}
                </span>
                <span className="text-xs font-bold text-[#B89600] dark:text-[#F0DC00]">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-[#8A8173] dark:text-[#A8A196] leading-relaxed mb-4">
                {isEs
                  ? 'Ajusta la proporción que aporta cada persona en este plan de gasto.'
                  : 'Adjust individual share multipliers for members who consumed more or less.'}
              </p>

              <div className="space-y-3">
                {partyMembers.slice(0, 6).map((m) => {
                  const weight = customWeights[m.id] ?? 1;
                  const totalWeights = Object.values(customWeights).reduce((a, b) => a + b, 0) || 1;
                  const memberAmount = (totalAmount * (weight / totalWeights));

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-white/5 border border-[rgba(35,30,22,0.05)] dark:border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#EFEAE2] dark:bg-white/10 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-xs text-[#171512] dark:text-white">{m.name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-display font-bold text-xs text-[#171512] dark:text-white block">
                            ${memberAmount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-[#8A8173] dark:text-[#A8A196] font-medium">
                            {weight}x share
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCustomWeights((prev) => ({
                                ...prev,
                                [m.id]: Math.max(0.5, (prev[m.id] ?? 1) - 0.5),
                              }))
                            }
                            className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 text-[#171512] dark:text-white border border-[rgba(35,30,22,0.1)] dark:border-white/15 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-black/5 dark:hover:bg-white/15"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomWeights((prev) => ({
                                ...prev,
                                [m.id]: (prev[m.id] ?? 1) + 0.5,
                              }))
                            }
                            className="w-7 h-7 rounded-lg bg-[#F0DC00] text-[#171512] flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-[#E6D300]"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Itemized Expenses List */}
        {activeTab === 'items' && (
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196]">
                {isEs ? 'Gastos detallados' : 'Itemized bills'} ({partyExpenses.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="text-xs font-bold text-[#171512] bg-[#F0DC00] px-3 py-1 rounded-full shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>{isEs ? 'Añadir' : 'Add bill'}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {partyExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3.5 rounded-[20px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[rgba(35,30,22,0.06)] dark:border-white/10 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFE600]/20 dark:bg-[#FFE600]/15 flex items-center justify-center shrink-0 text-[#171512] dark:text-[#F0DC00]">
                      <Receipt className="w-5 h-5 text-[#B89600] dark:text-[#F0DC00]" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-[#171512] dark:text-white">
                        {exp.description}
                      </h4>
                      <p className="text-xs text-[#8A8173] dark:text-[#A8A196]">
                        Paid by <span className="text-[#171512] dark:text-white font-semibold">{exp.paidByName}</span> · split by {exp.splitBetweenIds.length} people
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-display font-black text-sm text-[#171512] dark:text-white block">
                      ${exp.amount.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-[#B89600] dark:text-[#F0DC00] font-bold">
                      ${(exp.amount / Math.max(1, exp.splitBetweenIds.length)).toFixed(2)} / ea
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense Breakdown Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="font-display font-black text-base text-[#171512] dark:text-white">
              {t.split.expenseBreakdown}
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className="text-xs font-bold text-[#8A8173] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white flex items-center gap-0.5 cursor-pointer transition-colors"
            >
              <span>{t.split.viewAll}</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Drinks */}
            <div className="p-3 rounded-[20px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[rgba(35,30,22,0.06)] dark:border-white/10 shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FFE600] flex items-center justify-center shrink-0 text-[#171512]">
                <Wine className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-[#8A8173] dark:text-[#A8A196] leading-none mb-1 block truncate">
                  {t.split.drinks}
                </span>
                <span className="font-display font-bold text-xs sm:text-sm text-[#171512] dark:text-white leading-none mb-0.5 block">
                  ${drinksTotal.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium text-[#8A8173] dark:text-[#A8A196] leading-none block">
                  {drinksPercent}%
                </span>
              </div>
            </div>

            {/* Snacks */}
            <div className="p-3 rounded-[20px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[rgba(35,30,22,0.06)] dark:border-white/10 shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FF7A00]/20 flex items-center justify-center shrink-0 text-[#E06000]">
                <Pizza className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-[#8A8173] dark:text-[#A8A196] leading-none mb-1 block truncate">
                  {t.split.snacks}
                </span>
                <span className="font-display font-bold text-xs sm:text-sm text-[#171512] dark:text-white leading-none mb-0.5 block">
                  ${snacksTotal.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium text-[#8A8173] dark:text-[#A8A196] leading-none block">
                  {snacksPercent}%
                </span>
              </div>
            </div>

            {/* Ride */}
            <div className="p-3 rounded-[20px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[rgba(35,30,22,0.06)] dark:border-white/10 shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#EDE5FF] dark:bg-[#6B46C1]/25 flex items-center justify-center shrink-0 text-[#6B46C1] dark:text-[#A78BFA]">
                <Car className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-[#8A8173] dark:text-[#A8A196] leading-none mb-1 block truncate">
                  {t.split.ride}
                </span>
                <span className="font-display font-bold text-xs sm:text-sm text-[#171512] dark:text-white leading-none mb-0.5 block">
                  ${rideTotal.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium text-[#8A8173] dark:text-[#A8A196] leading-none block">
                  {ridePercent}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-30 pt-3 pb-6 px-4 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/95 dark:from-[#12110E] dark:via-[#12110E]/95 to-transparent pointer-events-none">
          <div className="max-w-md sm:max-w-lg mx-auto w-full pointer-events-auto">
            {/* Primary CTA: Request payments */}
            <button
              type="button"
              onClick={() => setIsSettleOpen(true)}
              className="w-full h-13 sm:h-14 rounded-full bg-[#F0DC00] hover:bg-[#E6D300] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 font-display font-black text-base text-[#171512] shadow-[0_4px_18px_rgba(240,220,0,0.35)] cursor-pointer"
            >
              <Send className="w-4.5 h-4.5 fill-current -rotate-12 translate-x-0.5" />
              <span>{t.split.requestPayments}</span>
            </button>

            {/* Secondary Action: Edit split */}
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="text-xs font-bold text-[#8A8173] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white pt-2.5 pb-1 text-center block w-full cursor-pointer transition-colors"
            >
              {t.split.editSplit}
            </button>
          </div>
        </div>
      </div>

      {/* Options Menu Sheet */}
      <SplitOptionsMenu
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        onOpenAddExpense={() => setIsAddOpen(true)}
        onOpenSettle={() => setIsSettleOpen(true)}
      />

      {/* Add Expense Sheet */}
      <AddExpenseSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        partyMembers={partyMembers}
        paidById={paidById}
        setPaidById={setPaidById}
        splitBetween={splitBetween}
        toggleSplitMember={toggleSplitMember}
        desc={desc}
        setDesc={setDesc}
        amount={amount}
        setAmount={setAmount}
        category={category}
        setCategory={setCategory}
        onSubmit={handleCreateExpense}
      />

      {/* Settle Debts Sheet */}
      <SettleDebtsSheet
        isOpen={isSettleOpen}
        onClose={() => {
          setSettleError(null);
          setIsSettleOpen(false);
        }}
        isSettling={isSettling}
        debtorsList={realCreditorsList}
        onSettle={handleSettleOnchain}
        errorMessage={settleError}
      />
    </div>
  );
};
