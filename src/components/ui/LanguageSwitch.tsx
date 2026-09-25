'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation, Language } from '@/lib/i18n/useTranslation';
import { Globe } from 'lucide-react';

interface LanguageSwitchProps {
  compact?: boolean;
  className?: string;
  variant?: 'auto' | 'glass';
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({
  compact = false,
  className = '',
  variant = 'auto',
}) => {
  const { language, setLanguage } = useTranslation();

  const options: { code: Language; label: string }[] = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
  ];

  const isGlass = variant === 'glass';

  const containerStyles = isGlass
    ? 'bg-black/55 backdrop-blur-xl border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
    : 'bg-[#EAE4D7] dark:bg-white/10 backdrop-blur-md border border-[#DDD5C5] dark:border-white/15 shadow-sm';

  const inactiveTextColor = isGlass
    ? 'text-white/85 hover:text-white'
    : 'text-[#483F34] dark:text-[#DCD5C9] hover:text-[#171512] dark:hover:text-white';

  const globeColor = isGlass
    ? 'text-[#F0DC00]'
    : 'text-[#967C1C] dark:text-[#F0DC00]';

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full ${containerStyles} ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      {!compact && (
        <Globe className={`w-3.5 h-3.5 ${globeColor} ml-2 mr-1 shrink-0`} />
      )}
      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const isActive = language === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => setLanguage(opt.code)}
              className={`relative px-3.5 py-1 rounded-full text-xs tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center select-none ${
                isActive
                  ? 'text-[#171512] font-black'
                  : `${inactiveTextColor} font-bold`
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeLangBg"
                  className="absolute inset-0 bg-[#F0DC00] rounded-full shadow-[0_2px_10px_rgba(240,220,0,0.45)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
