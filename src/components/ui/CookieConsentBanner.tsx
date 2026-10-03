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
          <div className="p-4 sm:p-5 rounded-[24px] bg-[#FFFDF8]/95 dark:bg-[#1C1A16]/95 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-[0_16px_40px_rgba(65,48,25,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#F0DC00]/20 flex items-center justify-center text-[#B89600] dark:text-[#F0DC00]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-display font-black text-sm text-[#171512] dark:text-white">
                  {isEs ? 'Privacidad & Almacenamiento' : 'Privacy & Local Storage'}
                </h4>
              </div>
              <button
                onClick={handleDismiss}
                className="text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white p-1 transition-colors cursor-pointer"
                aria-label={isEs ? 'Cerrar aviso' : 'Close banner'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] leading-relaxed mb-4">
              {isEs ? (
                <>
                  Usamos almacenamiento local y cookies técnicas esenciales para mantener tu sesión segura con tu billetera, guardar preferencias y sincronizar fiestas en tiempo real. Consulta nuestra{' '}
                  <Link href="/privacy" className="text-[#171512] dark:text-white font-bold underline hover:text-[#B89600]">
                    Política de Datos
                  </Link>{' '}
                  y{' '}
                  <Link href="/terms" className="text-[#171512] dark:text-white font-bold underline hover:text-[#B89600]">
                    Términos
                  </Link>.
                </>
              ) : (
                <>
                  We use local storage and essential technical cookies to keep your wallet session secure, persist your preferences, and sync gatherings in real time. Read our{' '}
                  <Link href="/privacy" className="text-[#171512] dark:text-white font-bold underline hover:text-[#B89600]">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/terms" className="text-[#171512] dark:text-white font-bold underline hover:text-[#B89600]">
                    Terms
                  </Link>.
                </>
              )}
            </p>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleDismiss}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                {isEs ? 'Solo Necesarias' : 'Necessary Only'}
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 rounded-xl bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] font-black text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {isEs ? 'Aceptar Todo' : 'Accept All'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
