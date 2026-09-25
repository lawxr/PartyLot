'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Coins,
  Users,
  Wine,
  Pizza,
  Car,
  Send,
  Check,
  Crown,
  Plus,
  Receipt,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Share2,
  DollarSign,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlassButton } from '@/components/ui/GlassButton';
import { TokenLogo, CryptoBadge } from '@/components/ui/TokenLogo';
import { calculateNetBalances, computeDebtSettlements } from '@/services/settlements';
import { ExpenseCategory, Member } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import confetti from 'canvas-confetti';

interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'drinks', label: 'Drinks', icon: Wine, color: 'text-[#171512] bg-[#FFE600]' },
  { id: 'food', label: 'Snacks', icon: Pizza, color: 'text-[#E06000] bg-[#FF8A00]/20' },
  { id: 'transport', label: 'Ride', icon: Car, color: 'text-[#6B46C1] bg-[#EDE5FF]' },
];

export const SplitView: React.FC = () => {
  const { parties, currentPartyId, expenses, addExpense, settleAllDebts, goBack, currentUser } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const defaultParty = parties[0];
  const party = parties.find((p) => p.id === currentPartyId) || parties[0] || defaultParty;
  const partyMembers = party?.members || [];
  const partyExpenses = expenses.filter((e) => e.partyId === party?.id);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'equal' | 'custom' | 'items'>('equal');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);

  // Add Expense Form state
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('drinks');
  const [paidById, setPaidById] = useState(partyMembers[0]?.id || currentUser?.id || 'u-law');
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
  const totalAmount = partyExpenses.reduce((sum, e) => sum + e.amount, 0) || 186.40;

  // Category breakdown calculation
  const drinksTotal = partyExpenses
    .filter((e) => e.category === 'drinks')
    .reduce((sum, e) => sum + e.amount, 0) || 103.00;

  const snacksTotal = partyExpenses
    .filter((e) => e.category === 'food')
    .reduce((sum, e) => sum + e.amount, 0) || 46.20;

  const rideTotal = partyExpenses
    .filter((e) => e.category === 'transport')
    .reduce((sum, e) => sum + e.amount, 0) || 37.20;

  const safeTotal = drinksTotal + snacksTotal + rideTotal || totalAmount || 186.40;
  const drinksPercent = Math.round((drinksTotal / safeTotal) * 100) || 55;
  const snacksPercent = Math.round((snacksTotal / safeTotal) * 100) || 25;
  const ridePercent = Math.round((rideTotal / safeTotal) * 100) || 20;

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
    setIsSettling(true);
    try {
      await settleAllDebts(party.id);
      confetti({
        particleCount: 70,
        spread: 80,
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

  // Default members list corresponding to the mockup
  const defaultMockMembers = [
    {
      id: 'u-law',
      name: 'Law',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      subtitle: 'You paid $42.00',
      type: 'creator_positive' as const,
      receiveAmount: '$28.69',
    },
    {
      id: 'u-sofi',
      name: 'Sofi',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      subtitle: 'Owes you',
      type: 'debtor' as const,
      amount: '$13.31',
    },
    {
      id: 'u-cam',
      name: 'Cam',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      subtitle: 'Owes you',
      type: 'debtor' as const,
      amount: '$13.31',
    },
    {
      id: 'u-ana',
      name: 'Ana',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      subtitle: 'Already paid',
      type: 'covered_badge' as const,
      badgeText: 'Covered drinks',
    },
    {
      id: 'u-diego',
      name: 'Diego',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      subtitle: 'Owes you',
      type: 'debtor' as const,
      amount: '$13.31',
    },
    {
      id: 'u-sara',
      name: 'Sara',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      subtitle: 'Owes you',
      type: 'debtor' as const,
      amount: '$13.31',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#171512] flex flex-col justify-between selection:bg-[#F0DC00]/30">
      {/* Mobile-first Container matching the exact mockup */}
      <div className="w-full max-w-md sm:max-w-lg mx-auto flex-1 flex flex-col px-4 pt-3 pb-24 relative">
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between py-2 mb-3">
          {/* Back Button */}
          <button
            type="button"
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-white/85 backdrop-blur-md border border-[rgba(35,30,22,0.06)] shadow-xs flex items-center justify-center text-[#171512] hover:bg-white active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-[#171512] stroke-[2.5]" />
          </button>

          {/* Center Party Profile Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-black/10 shrink-0 shadow-xs bg-[#EFEAE2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={party?.coverImage || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=400&q=80'}
                alt={party?.title || '404 House'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <h1 className="font-display font-black text-base sm:text-lg text-[#171512] leading-tight tracking-tight">
                {party?.title || '404 House'}
              </h1>
              <span className="text-xs text-[#8A8173] leading-tight block font-medium">
                {isEs ? 'Dividir gastos' : 'Split expenses'}
              </span>
            </div>
          </div>

          {/* Options Menu Button */}
          <button
            type="button"
            onClick={() => setIsOptionsOpen(true)}
            className="w-10 h-10 rounded-full bg-white/85 backdrop-blur-md border border-[rgba(35,30,22,0.06)] shadow-xs flex items-center justify-center text-[#171512] hover:bg-white active:scale-95 transition-all cursor-pointer"
            aria-label="Options"
          >
            <MoreHorizontal className="w-5 h-5 text-[#171512]" />
          </button>
        </header>

        {/* Hero Card: Total Shared Spend */}
        <section
          className="relative overflow-hidden rounded-[28px] p-5 sm:p-6 mb-4 border border-white/70 shadow-[0_10px_32px_rgba(200,160,80,0.11)]"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 252, 245, 0.96) 0%, rgba(250, 242, 227, 0.92) 50%, rgba(246, 228, 194, 0.88) 100%)',
          }}
        >
          {/* Left Text Content */}
          <div className="relative z-10 max-w-[62%]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#171512]/5 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-[#171512]" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#7A7265]">
                {isEs ? 'Total compartido' : 'Total shared spend'}
              </span>
            </div>

            <div className="font-display font-black text-3xl sm:text-4xl text-[#171512] tracking-tight mb-1">
              ${totalAmount.toFixed(2)}
            </div>

            <p className="text-xs text-[#8A8173] font-medium">
              {partyMembers.length || 14} {isEs ? 'personas · Actualizado hace 2 min' : 'people · Updated 2 min ago'}
            </p>
          </div>

          {/* Right 3D Frosted Glass Graphic with Orbs */}
          <div className="absolute right-0 top-0 bottom-0 w-44 pointer-events-none overflow-hidden select-none">
            {/* Background Golden Warm Glow Sphere */}
            <div
              className="absolute -right-2 top-2 w-28 h-28 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, #F5A623 0%, #FFD043 65%, rgba(255,208,67,0) 100%)',
                opacity: 0.85,
                filter: 'blur(2px)',
              }}
            />

            {/* Smaller Warm Gold Orb */}
            <div
              className="absolute right-20 bottom-3 w-14 h-14 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, #FFD043 10%, #F5A623 75%, rgba(245,166,35,0) 100%)',
                opacity: 0.9,
              }}
            />

            {/* Angled Frosted Glass Card Shape */}
            <div
              className="absolute right-2 top-3 w-32 h-20 rounded-2xl border border-white/60 pointer-events-none shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.18) 100%)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transform: 'rotate(-8deg)',
              }}
            >
              <div className="w-10 h-6 border-b border-r border-white/40 rounded-br-lg ml-3 mt-3 opacity-60" />
            </div>

            {/* Foreground Frosted Circle with Users Icon */}
            <div
              className="absolute right-8 bottom-3 w-15 h-15 rounded-full border border-white/85 flex items-center justify-center pointer-events-none shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
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
        <div className="bg-[#ECE6DC]/85 p-1 rounded-full flex gap-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('equal')}
            className={`py-2 px-5 rounded-full text-xs sm:text-sm font-bold flex-1 text-center transition-all cursor-pointer ${
              activeTab === 'equal'
                ? 'bg-[#F0DC00] text-[#171512] shadow-xs'
                : 'text-[#6F6A62] hover:text-[#171512]'
            }`}
          >
            {isEs ? 'Equitativo' : 'Equal'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`py-2 px-5 rounded-full text-xs sm:text-sm font-bold flex-1 text-center transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#F0DC00] text-[#171512] shadow-xs'
                : 'text-[#6F6A62] hover:text-[#171512]'
            }`}
          >
            {isEs ? 'Personalizado' : 'Custom'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`py-2 px-5 rounded-full text-xs sm:text-sm font-bold flex-1 text-center transition-all cursor-pointer ${
              activeTab === 'items'
                ? 'bg-[#F0DC00] text-[#171512] shadow-xs'
                : 'text-[#6F6A62] hover:text-[#171512]'
            }`}
          >
            {isEs ? 'Cuentas' : 'Items'}
          </button>
        </div>

        {/* Tab 1: Equal Split (Mockup View) */}
        {activeTab === 'equal' && (
          <div className="space-y-2.5 mb-5">
            {defaultMockMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => {
                  const m = partyMembers.find((p) => p.id === member.id);
                  if (m) setSelectedMemberDetail(m);
                }}
                className="bg-[#FFFDF8] rounded-[22px] p-3 sm:p-3.5 border border-[rgba(35,30,22,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between hover:bg-white transition-all cursor-pointer"
              >
                {/* Member Avatar + Name */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-black/5 shrink-0 bg-[#EFEAE2]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <span className="font-display font-bold text-sm sm:text-base text-[#171512] block leading-tight">
                      {member.name}
                    </span>
                    <span className="text-xs text-[#8A8173] font-medium leading-tight block">
                      {member.subtitle}
                    </span>
                  </div>
                </div>

                {/* Right Badge / Status */}
                {member.type === 'creator_positive' && (
                  <div className="bg-[#EBF7EE] border border-[#BDE8CA] rounded-2xl px-2.5 py-1 flex items-center gap-2 shadow-2xs">
                    <div className="w-5 h-5 rounded-full bg-[#171512] flex items-center justify-center text-[#F0DC00] shrink-0">
                      <Crown className="w-3 h-3 fill-[#F0DC00]" />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-semibold text-emerald-800 leading-none block mb-0.5">
                        {isEs ? 'Recibirás' : 'You will receive'}
                      </span>
                      <span className="font-display font-black text-sm text-emerald-700 leading-none block">
                        {member.receiveAmount}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  </div>
                )}

                {member.type === 'debtor' && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-black text-base text-[#171512]">
                      {member.amount}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#999187] stroke-[2.5]" />
                  </div>
                )}

                {member.type === 'covered_badge' && (
                  <div className="bg-[#ECE8E1] rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-2xs">
                    <div className="w-4 h-4 rounded-full bg-[#666055] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-semibold text-[#666055]">
                      {member.badgeText}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Custom Split Adjustment */}
        {activeTab === 'custom' && (
          <div className="space-y-3 mb-5">
            <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.06)] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A62]">
                  {isEs ? 'Reparto personalizado' : 'Custom split weights'}
                </span>
                <span className="text-xs font-bold text-[#B89600]">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-[#8A8173] leading-relaxed mb-4">
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
                      className="p-3 rounded-xl bg-[#FAF7F2] border border-[rgba(35,30,22,0.05)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#EFEAE2] shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-xs text-[#171512]">{m.name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-display font-bold text-xs text-[#171512] block">
                            ${memberAmount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-[#8A8173] font-medium">
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
                            className="w-7 h-7 rounded-lg bg-white border border-[rgba(35,30,22,0.1)] flex items-center justify-center text-xs font-bold cursor-pointer"
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
                            className="w-7 h-7 rounded-lg bg-[#F0DC00] text-[#171512] flex items-center justify-center text-xs font-bold cursor-pointer"
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
              <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A62]">
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
                  className="p-3.5 rounded-[20px] bg-[#FFFDF8] border border-[rgba(35,30,22,0.06)] shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFE600]/20 flex items-center justify-center shrink-0 text-[#171512]">
                      <Receipt className="w-5 h-5 text-[#B89600]" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-[#171512]">
                        {exp.description}
                      </h4>
                      <p className="text-xs text-[#8A8173]">
                        Paid by <span className="text-[#171512] font-semibold">{exp.paidByName}</span> · split by {exp.splitBetweenIds.length} people
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-display font-black text-sm text-[#171512] block">
                      ${exp.amount.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-[#B89600] font-bold">
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
            <h3 className="font-display font-black text-base text-[#171512]">
              {isEs ? 'Desglose de gastos' : 'Expense breakdown'}
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className="text-xs font-bold text-[#8A8173] hover:text-[#171512] flex items-center gap-0.5 cursor-pointer transition-colors"
            >
              <span>{isEs ? 'Ver todos' : 'View all'}</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Drinks */}
            <div className="p-3 rounded-[20px] bg-[#FFFDF8] border border-[rgba(35,30,22,0.06)] shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FFE600] flex items-center justify-center shrink-0 text-[#171512]">
                <Wine className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-[#8A8173] leading-none mb-1 block truncate">
                  Drinks
                </span>
                <span className="font-display font-bold text-xs sm:text-sm text-[#171512] leading-none mb-0.5 block">
                  ${drinksTotal.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium text-[#8A8173] leading-none block">
                  {drinksPercent}%
                </span>
              </div>
            </div>

            {/* Snacks */}
            <div className="p-3 rounded-[20px] bg-[#FFFDF8] border border-[rgba(35,30,22,0.06)] shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FF7A00]/20 flex items-center justify-center shrink-0 text-[#E06000]">
                <Pizza className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-[#8A8173] leading-none mb-1 block truncate">
                  Snacks
                </span>
                <span className="font-display font-bold text-xs sm:text-sm text-[#171512] leading-none mb-0.5 block">
                  ${snacksTotal.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium text-[#8A8173] leading-none block">
                  {snacksPercent}%
                </span>
              </div>
            </div>

            {/* Ride */}
            <div className="p-3 rounded-[20px] bg-[#FFFDF8] border border-[rgba(35,30,22,0.06)] shadow-xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#EDE5FF] flex items-center justify-center shrink-0 text-[#6B46C1]">
                <Car className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-[#8A8173] leading-none mb-1 block truncate">
                  Ride
                </span>
                <span className="font-display font-bold text-xs sm:text-sm text-[#171512] leading-none mb-0.5 block">
                  ${rideTotal.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium text-[#8A8173] leading-none block">
                  {ridePercent}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-30 pt-3 pb-6 px-4 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/95 to-transparent pointer-events-none">
          <div className="max-w-md sm:max-w-lg mx-auto w-full pointer-events-auto">
            {/* Primary CTA: Request payments */}
            <button
              type="button"
              onClick={() => setIsSettleOpen(true)}
              className="w-full h-13 sm:h-14 rounded-full bg-[#F0DC00] hover:bg-[#E6D300] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 font-display font-black text-base text-[#171512] shadow-[0_4px_18px_rgba(240,220,0,0.35)] cursor-pointer"
            >
              <Send className="w-4.5 h-4.5 fill-current -rotate-12 translate-x-0.5" />
              <span>{isEs ? 'Solicitar pagos' : 'Request payments'}</span>
            </button>

            {/* Secondary Action: Edit split */}
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="text-xs font-bold text-[#8A8173] hover:text-[#171512] pt-2.5 pb-1 text-center block w-full cursor-pointer transition-colors"
            >
              {isEs ? 'Editar división' : 'Edit split'}
            </button>
          </div>
        </div>
      </div>

      {/* BottomSheet: Options Menu */}
      <BottomSheet
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        title={isEs ? 'Opciones de división' : 'Split Options'}
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setIsOptionsOpen(false);
              setIsAddOpen(true);
            }}
            className="w-full p-3.5 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] flex items-center justify-between text-left hover:bg-[#F7F2E8] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F0DC00]/20 flex items-center justify-center text-[#171512]">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-bold text-sm text-[#171512] block">
                  {isEs ? 'Añadir nuevo gasto' : 'Add new expense'}
                </span>
                <span className="text-xs text-[#8A8173]">
                  {isEs ? 'Registra una factura pagada por alguien' : 'Log a bill paid by someone'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#999187]" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOptionsOpen(false);
              setIsSettleOpen(true);
            }}
            className="w-full p-3.5 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] flex items-center justify-between text-left hover:bg-[#F7F2E8] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2775CA]/20 to-[#836EF9]/20 flex items-center justify-center text-[#2775CA]">
                <TokenLogo token="usdc" size="sm" />
              </div>
              <div>
                <span className="font-bold text-sm text-[#171512] block">
                  {isEs ? 'Liquidar en Monad (USDC)' : 'Settle on Monad (USDC)'}
                </span>
                <span className="text-xs text-[#8A8173]">
                  {isEs ? 'Minimización matemática y liquidación web3' : 'Greedy algorithm & web3 settlement'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#999187]" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                confetti({ particleCount: 30, spread: 45 });
                setIsOptionsOpen(false);
              }
            }}
            className="w-full p-3.5 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] flex items-center justify-between text-left hover:bg-[#F7F2E8] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] flex items-center justify-center text-[#171512]">
                <Share2 className="w-5 h-5 text-[#8A8173]" />
              </div>
              <div>
                <span className="font-bold text-sm text-[#171512] block">
                  {isEs ? 'Copiar enlace para compartir' : 'Copy share link'}
                </span>
                <span className="text-xs text-[#8A8173]">
                  {isEs ? 'Envía este desglose a tu grupo' : 'Send this split to the group'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#999187]" />
          </button>
        </div>
      </BottomSheet>

      {/* BottomSheet: + Add Expense */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={isEs ? 'Añadir gasto' : 'Add Expense'}
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
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
              placeholder="e.g. Cocktails, Artisanal Pizza, Uber XL..."
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
              {partyMembers.map((member) => (
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
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-[#EFEAE2]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
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
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {partyMembers.map((member) => {
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
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-[#EFEAE2] shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    </div>
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
              {isEs ? 'Dividir gasto' : 'Split Expense'}
            </GlassButton>
          </div>
        </form>
      </BottomSheet>

      {/* BottomSheet: Request / Settle Payments (Monad USDC) */}
      <BottomSheet
        isOpen={isSettleOpen}
        onClose={() => {
          if (!isSettling) setIsSettleOpen(false);
        }}
        title={isEs ? 'Liquidación de Cuentas (USDC)' : 'Request & Settle Payments'}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#2775CA]/10 via-[#836EF9]/10 to-transparent border border-[#2775CA]/20">
            <div className="flex items-center gap-2.5">
              <TokenLogo token="usdc" size="md" />
              <div>
                <span className="text-xs font-bold text-[#171512] block">
                  USDC Split Engine · Monad Testnet
                </span>
                <span className="text-[10px] text-[#6F6A62]">
                  {isEs ? 'Transferencias minimizadas con liquidación directa' : 'Greedy minimal debt minimization & settlement'}
                </span>
              </div>
            </div>
            <CryptoBadge token="usdc" network="Monad" showNetwork={false} />
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {defaultMockMembers.filter((m) => m.type === 'debtor').map((member, i) => (
              <div
                key={`settle-${member.id}-${i}`}
                className="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-[#EFEAE2]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#171512] block">{member.name}</span>
                    <span className="text-[10px] text-rose-600 font-semibold">{isEs ? 'Debe transferir' : 'Owes you'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <TokenLogo token="usdc" size="xs" />
                  <span className="font-display font-black text-base text-[#171512]">
                    {member.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 space-y-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              disabled={isSettling}
              onClick={handleSettleOnchain}
            >
              {isSettling
                ? isEs ? 'Liquidando en Monad...' : 'Settling on Monad...'
                : isEs
                ? `Confirmar solicitud y liquidación en Monad (USDC)`
                : `Confirm payment requests on Monad (USDC)`}
            </GlassButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
