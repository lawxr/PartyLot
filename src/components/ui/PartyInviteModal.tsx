'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  Send,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Party } from '@/types';
import { GlassButton } from '@/components/ui/GlassButton';
import { formatPartyInviteText } from '@/services/party';
import confetti from 'canvas-confetti';

import QRCode from 'qrcode';

interface PartyInviteModalProps {
  party: Party;
  isOpen: boolean;
  onClose: () => void;
}

export const PartyInviteModal: React.FC<PartyInviteModalProps> = ({
  party,
  isOpen,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://partylot.app';
  const inviteUrl = `${origin}/join?code=${party.code}`;

  // Draw Instagram-style rounded QR Code on Canvas (clean, sleek, without center emoji)
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const qr = QRCode.create(inviteUrl, {
        errorCorrectionLevel: 'M',
      });
      const moduleCount = qr.modules.size;
      const margin = 3;
      const totalModules = moduleCount + margin * 2;

      // High-resolution canvas for ultra-sharp rendering on Retina displays
      const cellSize = Math.floor(520 / totalModules);
      const canvasSize = cellSize * totalModules;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // Crisp pure white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      const offset = margin * cellSize;
      const dotColor = '#141414';
      const bgColor = '#FFFFFF';

      const isFinder = (r: number, c: number) => {
        if (r <= 7 && c <= 7) return true;
        if (r <= 7 && c >= moduleCount - 8) return true;
        if (r >= moduleCount - 8 && c <= 7) return true;
        return false;
      };

      const drawRoundRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        radius: number,
        fillColor: string
      ) => {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, w, h, radius);
        } else {
          ctx.rect(x, y, w, h);
        }
        ctx.fill();
      };

      // Draw Instagram rounded finder pattern (eyes)
      const drawFinder = (r0: number, c0: number) => {
        const x = offset + c0 * cellSize;
        const y = offset + r0 * cellSize;

        // Outer 7x7 rounded squircle
        drawRoundRect(
          x,
          y,
          7 * cellSize,
          7 * cellSize,
          cellSize * 1.7,
          dotColor
        );
        // Inner 5x5 cutout
        drawRoundRect(
          x + cellSize,
          y + cellSize,
          5 * cellSize,
          5 * cellSize,
          cellSize * 1.15,
          bgColor
        );
        // Center 3x3 solid rounded pupil
        drawRoundRect(
          x + 2 * cellSize,
          y + 2 * cellSize,
          3 * cellSize,
          3 * cellSize,
          cellSize * 0.85,
          dotColor
        );
      };

      // 1. Draw the 3 rounded finders
      drawFinder(0, 0);
      drawFinder(0, moduleCount - 7);
      drawFinder(moduleCount - 7, 0);

      // 2. Draw rounded squircle data modules
      const gap = Math.max(0.4, cellSize * 0.05);
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (isFinder(r, c)) continue;
          if (qr.modules.get(r, c) === 1) {
            const x = offset + c * cellSize + gap;
            const y = offset + r * cellSize + gap;
            const s = cellSize - gap * 2;
            drawRoundRect(x, y, s, s, s * 0.38, dotColor);
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate Instagram rounded QR code:', err);
    }
  }, [isOpen, inviteUrl]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(party.code);
    setCopiedCode(true);
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.6 },
      colors: ['#F0DC00', '#FFFFFF'],
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.6 },
      colors: ['#F0DC00', '#10B981'],
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    const text = formatPartyInviteText(party);
    if (navigator.share) {
      try {
        await navigator.share({
          title: party.title,
          text,
          url: inviteUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const shareTextWhatsApp = encodeURIComponent(
    `Yo! Join "${party.title}" on Partylot 🔥\nCode: ${party.code}\n${inviteUrl}`
  );
  const shareTextTelegram = encodeURIComponent(
    `Join ${party.title} on Partylot with code ${party.code}`
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md rounded-[32px] bg-[#FFFDF8] border border-[rgba(35,30,22,0.12)] p-6 shadow-[0_24px_80px_rgba(65,48,25,0.18)] text-[#171512] z-10 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F8F3EA] hover:bg-[#F1EADF] flex items-center justify-center text-[#171512] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0DC00]/20 border border-[#F0DC00]/40 text-[#171512] text-[11px] font-extrabold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#B8A700]" />
              PRIVATE PARTY INVITATION
            </span>
            <h3 className="font-bubble text-2xl sm:text-3xl text-[#171512] tracking-tight leading-none mb-1">
              {party.title}
            </h3>
            <p className="text-xs text-[#6F6A62] mt-1">
              Scan QR code or use the 4-character passkey to join
            </p>
          </div>

          {/* QR Code Canvas Card (Instagram rounded style) */}
          <div className="flex flex-col items-center justify-center mb-5">
            <div className="p-4 sm:p-5 rounded-[28px] bg-white text-black shadow-md border border-[rgba(35,30,22,0.1)] relative flex flex-col items-center">
              <canvas
                ref={canvasRef}
                className="w-52 h-52 sm:w-60 sm:h-60 rounded-2xl block"
              />
              <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between w-full px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-black/50">
                    CODE:
                  </span>
                  <span className="font-mono font-black text-sm text-black tracking-widest">
                    {party.code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-black text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy passkey"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-black/60" />}
                  <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Viral Share Actions */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <a
              href={`https://wa.me/?text=${shareTextWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-emerald-800 font-display font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${shareTextTelegram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-2xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-sky-800 font-display font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              Telegram
            </a>
          </div>

          {/* Copy Direct Link CTA */}
          <div className="space-y-2">
            <GlassButton
              variant="accent"
              size="md"
              fullWidth
              onClick={handleNativeShare}
              icon={
                copiedLink ? (
                  <Check className="w-4 h-4 text-black stroke-[3]" />
                ) : (
                  <Share2 className="w-4 h-4 text-black stroke-[3]" />
                )
              }
            >
              {copiedLink ? 'Invite Link Copied!' : 'Share Direct Invite Link'}
            </GlassButton>
          </div>

          {/* Security & Verification note */}
          <div className="mt-4 pt-3 border-t border-[rgba(35,30,22,0.08)] flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#8E887E]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ENLACE PRIVADO Y CIFRADO · ACCESO EXCLUSIVO</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
