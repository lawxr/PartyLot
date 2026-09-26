'use client';

import React from 'react';
import { Wine, Pizza, Car } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlassButton } from '@/components/ui/GlassButton';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { ExpenseCategory, Member } from '../types';

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { id: 'drinks', label: 'Drinks', icon: Wine, color: 'text-[#171512] bg-[#FFE600]' },
  { id: 'food', label: 'Snacks', icon: Pizza, color: 'text-[#E06000] bg-[#FF8A00]/20' },
  { id: 'transport', label: 'Ride', icon: Car, color: 'text-[#6B46C1] bg-[#EDE5FF]' },
];

interface AddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  partyMembers: Member[];
  paidById: string;
  setPaidById: (id: string) => void;
  splitBetween: string[];
  toggleSplitMember: (memberId: string) => void;
  desc: string;
  setDesc: (d: string) => void;
  amount: string;
  setAmount: (a: string) => void;
  category: ExpenseCategory;
  setCategory: (c: ExpenseCategory) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddExpenseSheet: React.FC<AddExpenseSheetProps> = ({
  isOpen,
  onClose,
  partyMembers,
  paidById,
  setPaidById,
  splitBetween,
  toggleSplitMember,
  desc,
  setDesc,
  amount,
  setAmount,
  category,
  setCategory,
  onSubmit,
}) => {
  const { t } = useTranslation();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.split.addExpense}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
            {t.split.categoryLabel}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {EXPENSE_CATEGORIES.map((cat) => {
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
            {t.split.descLabel}
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
            {t.split.amountLabel}
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
            {t.split.paidByLabel}
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
            <span>{t.split.splitBetweenLabel}</span>
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
          <GlassButton variant="accent" size="lg" fullWidth type="submit">
            {t.split.splitButton}
          </GlassButton>
        </div>
      </form>
    </BottomSheet>
  );
};
