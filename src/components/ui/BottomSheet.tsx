'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[90vh] sm:max-h-[85vh]',
}) => {
  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 400) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md"
          />

          
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`relative z-10 w-full max-w-lg sm:max-w-md bg-[#FFFDF8] rounded-t-[34px] sm:rounded-[34px] overflow-hidden flex flex-col ${maxHeight} safe-bottom border border-[rgba(35,30,22,0.12)] shadow-[0_-14px_70px_rgba(62,43,21,0.16)] text-[#171512]`}
          >
            {/* Top Specular Rim Highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

            {/* Grab handle (visible on mobile) */}
            <div className="w-full flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none shrink-0 sm:hidden">
              <div className="w-10 h-1.5 rounded-full bg-[rgba(80,68,55,0.25)] hover:bg-[rgba(80,68,55,0.4)] transition-colors" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-5 sm:px-6 pb-3 pt-2 sm:pt-4 flex items-center justify-between border-b border-[rgba(35,30,22,0.08)] shrink-0">
                <h3 className="font-display text-lg font-extrabold text-[#171512] tracking-tight truncate pr-2">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 text-[#171512]/70 hover:text-[#171512] flex items-center justify-center text-xs transition-colors shrink-0 cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Content Body with smooth scrolling */}
            <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain no-scrollbar flex-1 text-[#171512]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
