'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const STORAGE_KEY = 'partylot_cookie_consent_v1';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { language } = useTranslation();
  const isEs = language === 'es';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Small delay to let initial page animations settle
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[35] select-none"
        >
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FFFDF8]/95 dark:bg-[#1C1A16]/95 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00] shrink-0" />
              <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] truncate">
                {isEs ? (
                  <>
                    Usamos cookies esenciales.{' '}
                    <Link href="/privacy" className="text-[#171512] dark:text-white font-semibold underline hover:text-[#B89600]">
                      Privacidad
                    </Link>
                  </>
                ) : (
                  <>
                    Essential cookies only.{' '}
                    <Link href="/privacy" className="text-[#171512] dark:text-white font-semibold underline hover:text-[#B89600]">
                      Privacy
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleAccept}
                className="px-3 py-1.5 rounded-xl bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {isEs ? 'Entendido' : 'Got it'}
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-colors cursor-pointer"
                aria-label={isEs ? 'Cerrar aviso' : 'Close banner'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
