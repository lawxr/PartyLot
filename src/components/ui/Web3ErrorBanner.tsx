'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { formatWeb3Error, type FormattedWeb3Error } from '@/lib/web3Error';

export interface Web3ErrorBannerProps {
  error: FormattedWeb3Error | Error | string | null | undefined;
  isEs?: boolean;
  onDismiss?: () => void;
  className?: string;
  showTechnicalDetails?: boolean;
}

export const Web3ErrorBanner: React.FC<Web3ErrorBannerProps> = ({
  error,
  isEs = true,
  onDismiss,
  className = '',
  showTechnicalDetails = true,
}) => {
  if (!error) return null;

  const formatted: FormattedWeb3Error =
    typeof error === 'object' && 'title' in error && 'isUserRejection' in error
      ? (error as FormattedWeb3Error)
      : formatWeb3Error(error, isEs);

  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className={`w-full p-3.5 sm:p-4 rounded-[24px] backdrop-blur-2xl border transition-all text-left ${
          formatted.isUserRejection
            ? 'bg-amber-500/[0.08] dark:bg-amber-400/[0.12] border-amber-500/25 dark:border-amber-400/30 text-[#171512] dark:text-[#FBF8F2] shadow-[0_8px_30px_rgba(245,158,11,0.06)]'
            : 'bg-rose-500/[0.08] dark:bg-rose-500/[0.14] border-rose-500/25 dark:border-rose-400/30 text-[#171512] dark:text-[#FBF8F2] shadow-[0_8px_30px_rgba(244,63,94,0.06)]'
        } ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                formatted.isUserRejection
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}
            >
              {formatted.isUserRejection ? (
                <AlertCircle className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-display font-bold text-xs sm:text-sm block leading-tight">
                {formatted.title}
              </span>
              <p className="text-[11px] sm:text-xs text-[#706B66] dark:text-[#A8A196] font-medium mt-0.5 leading-relaxed">
                {formatted.message}
              </p>
            </div>
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[#706B66] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label={isEs ? 'Cerrar aviso' : 'Dismiss notice'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Collapsible Technical Details (hidden for intentional rejections, visible on real errors) */}
        {showTechnicalDetails && formatted.technicalDetails && !formatted.isUserRejection && (
          <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10">
            <details className="text-xs text-secondary font-mono">
              <summary className="cursor-pointer hover:underline font-sans font-semibold text-[11px] text-[#706B66] dark:text-[#A8A196] select-none">
                {isEs ? 'Detalles técnicos' : 'Technical details'}
              </summary>
              <pre className="mt-1.5 p-2 rounded-xl bg-black/5 dark:bg-black/40 text-[10px] sm:text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-24 select-all">
                {formatted.technicalDetails}
              </pre>
            </details>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
