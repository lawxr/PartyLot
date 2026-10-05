'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trash2, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { ActivityItem } from '@/types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
}) => {
  const { activities, dismissActivity, clearAllActivities, selectParty, setCurrentView } =
    usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when pressing Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close when clicking outside on desktop
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay adding listener to prevent immediate trigger on open click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'pot':
        return {
          icon: '💰',
          bg: 'bg-[#F0DC00]/20 text-[#8F7400] dark:text-[#F0DC00]',
          label: isEs ? 'Tesorería' : 'Pot',
        };
      case 'expense':
        return {
          icon: '💸',
          bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
          label: isEs ? 'Gasto' : 'Expense',
        };
      case 'poll':
        return {
          icon: '📊',
          bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
          label: isEs ? 'Votación' : 'Poll',
        };
      case 'game':
        return {
          icon: '🎮',
          bg: 'bg-pink-500/15 text-pink-700 dark:text-pink-300',
          label: isEs ? 'Juego' : 'Game',
        };
      case 'join':
      default:
        return {
          icon: '🎉',
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
          label: isEs ? 'Reunión' : 'Event',
        };
    }
  };

  const handleOpenParty = (partyId?: string) => {
    if (!partyId) return;
    selectParty(partyId);
    setCurrentView('party-detail');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Ambient Backdrop on Mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-[2px] sm:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Floating Popover Container */}
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 350 }}
            className="fixed top-18 inset-x-3 sm:inset-x-auto sm:right-6 md:right-10 lg:right-16 sm:top-20 z-50 sm:w-[400px] max-h-[85vh] flex flex-col rounded-[28px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/[0.08] dark:border-white/12 shadow-[0_20px_60px_rgba(65,48,25,0.18)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.65)] overflow-hidden"
            role="dialog"
            aria-label={isEs ? 'Notificaciones' : 'Notifications'}
          >
            {/* Header: Title + Count + Clear All + Close */}
            <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#F0DC00]/20 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                  <Bell className="w-4 h-4 stroke-[2.4]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-black text-base text-[#171512] dark:text-white tracking-tight">
                      {isEs ? 'Notificaciones' : 'Notifications'}
                    </h2>
                    {activities.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#F0DC00] text-[#171512] font-black text-[11px] leading-tight">
                        {activities.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activities.length > 0 && (
                  <button
                    onClick={clearAllActivities}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-[#8E887E] dark:text-[#A8A196] hover:text-[#FF3B30] dark:hover:text-[#FF453A] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
                    title={isEs ? 'Borrar todas' : 'Clear all'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Borrar todas' : 'Clear all'}</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#6F6A62] dark:text-[#A8A196] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer p-0"
                  aria-label={isEs ? 'Cerrar' : 'Close'}
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Scrollable Notification List */}
            <div className="p-3 sm:p-4 overflow-y-auto max-h-[460px] space-y-2.5 divide-y-0">
              {activities.length === 0 ? (
                /* Warm Empty State */
                <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#F0DC00]/20 flex items-center justify-center text-[#171512] dark:text-[#F0DC00] mb-3">
                    <CheckCheck className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <h3 className="font-display font-extrabold text-base text-[#171512] dark:text-white">
                    {isEs ? 'Todo al día' : 'All caught up!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8E887E] dark:text-[#A8A196] mt-1 max-w-[240px] leading-relaxed">
                    {isEs
                      ? 'No tienes notificaciones pendientes en este momento.'
                      : 'You have no pending notifications right now.'}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {activities.map((act) => {
                    const badge = getActivityBadge(act.type);
                    return (
                      <motion.div
                        key={act.id}
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92, height: 0, marginBottom: 0, padding: 0 }}
                        transition={{ duration: 0.2 }}
                        className="group relative rounded-[20px] p-3 sm:p-3.5 bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04] dark:hover:bg-white/[0.07] border border-black/[0.04] dark:border-white/[0.06] transition-all flex items-start gap-3"
                      >
                        {/* Leading Avatar / Type Icon */}
                        <div className="relative shrink-0 mt-0.5">
                          {act.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={act.avatar}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-white dark:border-white/10 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#F0DC00]/30 flex items-center justify-center text-base">
                              {badge.icon}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 text-xs">{badge.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-6">
                          <p className="text-xs sm:text-sm text-[#171512] dark:text-[#F5F1E8] font-medium leading-snug">
                            {act.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-[#8E887E] dark:text-[#A8A196] flex items-center gap-1">
                              <Clock className="w-3 h-3 opacity-70" />
                              {act.time}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                            {act.partyId && (
                              <button
                                onClick={() => handleOpenParty(act.partyId)}
                                className="text-[10px] font-bold text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer"
                              >
                                <span>{isEs ? 'Ver fiesta' : 'View party'}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dismiss Single Notification Button */}
                        <button
                          onClick={() => dismissActivity(act.id)}
                          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[#8E887E] dark:text-[#A8A196] hover:text-[#FF3B30] dark:hover:text-[#FF453A] hover:bg-[#FF3B30]/10 active:scale-90 transition-all cursor-pointer p-0"
                          title={isEs ? 'Descartar notificación' : 'Dismiss notification'}
                          aria-label={isEs ? 'Descartar notificación' : 'Dismiss notification'}
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer Tip */}
            {activities.length > 0 && (
              <div className="px-5 py-2.5 border-t border-black/[0.04] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02] text-center">
                <span className="text-[11px] font-semibold text-[#8E887E] dark:text-[#A8A196]">
                  {isEs
                    ? '💡 Las notificaciones se actualizan en vivo con tu grupo'
                    : '💡 Notifications update live with your crew'}
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
