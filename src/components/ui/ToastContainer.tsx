'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, ToastItem } from '@/store/useToastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      role="region"
      className="fixed top-4 inset-x-0 z-[100] pointer-events-none flex flex-col items-center gap-2 px-4 max-w-md mx-auto"
    >
      <AnimatePresence>
        {toasts.map((toastItem: ToastItem) => {
          const isSuccess = toastItem.type === 'success';
          const isError = toastItem.type === 'error';

          return (
            <motion.div
              key={toastItem.id}
              role="status"
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 shadow-lg text-[#171512] dark:text-[#F5F1E8] text-sm font-medium w-full max-w-sm"
            >
              <div className="shrink-0">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#4A7C59]" />}
                {isError && <AlertCircle className="w-4 h-4 text-[#DE6B48]" />}
                {!isSuccess && !isError && <Info className="w-4 h-4 text-[#F0DC00]" />}
              </div>

              <span className="flex-1 text-xs leading-relaxed">{toastItem.message}</span>

              <button
                type="button"
                onClick={() => removeToast(toastItem.id)}
                aria-label="Dismiss notification"
                className="shrink-0 p-1 text-[#6F6A62] hover:text-[#171512] dark:hover:text-[#F5F1E8] transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F0DC00]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </aside>
  );
};
