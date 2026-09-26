'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ProfileAddNightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, date: string) => void;
}

export const ProfileAddNightModal: React.FC<ProfileAddNightModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { language } = useTranslation();
  const isEs = language === 'es';

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), date.trim());
    setTitle('');
    setDate('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[10px]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-md bg-[#FFFDF8] dark:bg-[#1C1A16] rounded-t-[36px] sm:rounded-[36px] p-6 text-[#171512] dark:text-[#F5F1E8] shadow-2xl border border-white/85 dark:border-white/15 safe-bottom"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-lg text-[#171512] dark:text-white">
                {isEs ? 'Registrar noche asistida' : 'Log Attended Night'}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white hover:bg-black/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-[#8E887E] dark:text-[#A8A196] mb-1">
                  {isEs ? 'Nombre de la fiesta / evento' : 'Party / Event Name'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isEs ? 'Ej: Rooftop Golden Hour' : 'e.g. Rooftop Golden Hour'}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-sm focus:border-[#F0DC00] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-[#8E887E] dark:text-[#A8A196] mb-1">
                  {isEs ? 'Fecha' : 'Date'}
                </label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3.5 w-4 h-4 text-[#8E887E]" />
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder={isEs ? 'Ej: 24 Sep' : 'e.g. Sep 24'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-sm focus:border-[#F0DC00] outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-black/5 dark:bg-white/10 text-xs font-bold text-[#706B66] dark:text-white/80 cursor-pointer"
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#F0DC00] text-[#171512] text-xs font-bold hover:brightness-105 cursor-pointer shadow-sm"
                >
                  {isEs ? 'Registrar noche' : 'Save Night'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
