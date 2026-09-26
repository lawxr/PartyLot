'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, X } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Member } from '@/types';

interface ProfilePeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
  peopleConnections: Member[];
  onSelectMember: (member: Member) => void;
}

export const ProfilePeopleModal: React.FC<ProfilePeopleModalProps> = ({
  isOpen,
  onClose,
  peopleConnections,
  onSelectMember,
}) => {
  const { isUserStarred, toggleStarUser } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';
  const [search, setSearch] = useState('');

  const filteredPeople = useMemo(() => {
    if (!search.trim()) return peopleConnections;
    const q = search.toLowerCase();
    return peopleConnections.filter(
      (p) => p.name.toLowerCase().includes(q) || p.handle?.toLowerCase().includes(q)
    );
  }, [peopleConnections, search]);

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
            className="relative z-10 w-full max-w-md bg-[#FFFDF8] dark:bg-[#1C1A16] rounded-t-[36px] sm:rounded-[36px] p-6 text-[#171512] dark:text-[#F5F1E8] shadow-2xl border border-white/85 dark:border-white/15 safe-bottom max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h3 className="font-display font-extrabold text-lg text-[#171512] dark:text-white">
                  {isEs ? 'Tu gente y amigos' : 'Your people & connections'}
                </h3>
                <span className="text-xs text-[#8E887E] dark:text-[#A8A196]">
                  {peopleConnections.length} {isEs ? 'contactos en la fiesta' : 'party connections'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white hover:bg-black/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative flex items-center mb-4 shrink-0">
              <Search className="absolute left-3.5 w-4 h-4 text-[#8E887E] dark:text-white/40" />
              <input
                type="text"
                placeholder={isEs ? 'Buscar amigos...' : 'Search friends...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-xs focus:border-[#F0DC00] outline-none transition-colors"
              />
            </div>

            {/* People List */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {filteredPeople.map((person) => {
                const starred = isUserStarred(person.id);

                return (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <div
                      onClick={() => {
                        onClose();
                        onSelectMember(person);
                      }}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden border border-black/10 dark:border-white/15 shadow-sm shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-[#171512] dark:text-white block">
                          {person.name}
                        </span>
                        <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                          {person.nightsTogether ?? 1} {isEs ? 'noches juntos' : 'nights together'}
                        </span>
                      </div>
                    </div>

                    <motion.button
                      onClick={() => toggleStarUser(person.id)}
                      whileTap={{ scale: 0.85 }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors duration-200 ${
                        starred
                          ? 'bg-[#F0DC00] text-[#171512]'
                          : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#8E887E] dark:text-[#A8A196]'
                      }`}
                      aria-label={`Follow ${person.name}`}
                    >
                      <Star className={`w-4 h-4 ${starred ? 'fill-current stroke-[1.5]' : 'stroke-[2]'}`} />
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
