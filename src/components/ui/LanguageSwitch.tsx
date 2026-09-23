'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation, Language } from '@/lib/i18n/useTranslation';
import { Globe } from 'lucide-react';

interface LanguageSwitchProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ compact = false, className = '' }) => {
  const { language, setLanguage } = useTranslation();

  const options: { code: Language; label: string }[] = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full liquid-glass-card border border-white/20 shadow-md ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      {!compact && (
        <Globe className="w-3.5 h-3.5 text-[#F0DC00] ml-1.5 mr-1 shrink-0 opacity-80" />
      )}
      {options.map((opt) => {
        const isActive = language === opt.code;
        return (
          <button
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            className={`relative px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider transition-all duration-200 cursor-pointer ${
              isActive ? 'text-[#0C0B0A]' : 'text-white/60 hover:text-white'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeLangBg"
                className="absolute inset-0 bg-[#F0DC00] rounded-full shadow-[0_2px_10px_rgba(240,220,0,0.4)]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
