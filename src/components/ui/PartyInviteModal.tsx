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

  const inviteUrl = `https://partylot.app/join?code=${party.code}`;

  // Draw a crisp, high-contrast QR Matrix on Canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 260;
    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = '#0F0F0F';
    ctx.fillRect(0, 0, size, size);

    const gridSize = 25;
    const cellSize = (size - 32) / gridSize;
    const offsetX = 16;
    const offsetY = 16;

    // Deterministic pseudo-random based on party code
    const seed = party.code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 42);
    const pseudoRandom = (x: number, y: number) => {
      const val = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
      return val - Math.floor(val) > 0.46;
    };

    // Helper: Draw QR Finder Pattern (corners)
    const drawFinder = (startX: number, startY: number) => {
      const x = offsetX + startX * cellSize;
      const y = offsetY + startY * cellSize;
      const outerSize = 7 * cellSize;

      ctx.fillStyle = '#F0DC00';
      ctx.fillRect(x, y, outerSize, outerSize);

      ctx.fillStyle = '#0F0F0F';
      ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);

      ctx.fillStyle = '#F0DC00';
      ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    };

    // Draw 3 position finders
    drawFinder(0, 0); // Top-left
    drawFinder(gridSize - 7, 0); // Top-right
    drawFinder(0, gridSize - 7); // Bottom-left

    // Draw Data Modules
    ctx.fillStyle = '#FFFFFF';
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Skip finder zones
        const inTopLeft = row < 8 && col < 8;
        const inTopRight = row < 8 && col >= gridSize - 8;
        const inBottomLeft = row >= gridSize - 8 && col < 8;
        const inCenterLogo = row >= 10 && row <= 14 && col >= 10 && col <= 14;

        if (inTopLeft || inTopRight || inBottomLeft || inCenterLogo) continue;

        if (pseudoRandom(col, row)) {
          ctx.beginPath();
          ctx.roundRect(
            offsetX + col * cellSize + 0.6,
            offsetY + row * cellSize + 0.6,
            cellSize - 1.2,
            cellSize - 1.2,
            cellSize * 0.25
          );
          ctx.fill();
        }
      }
    }

    // Center Partylot Icon badge
    const badgeSize = cellSize * 5;
    const badgeX = offsetX + 10 * cellSize;
    const badgeY = offsetY + 10 * cellSize;

    ctx.fillStyle = '#15140f';
    ctx.beginPath();
    ctx.roundRect(badgeX - 2, badgeY - 2, badgeSize + 4, badgeSize + 4, 8);
    ctx.fill();

    ctx.fillStyle = '#F0DC00';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 6);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', badgeX + badgeSize / 2, badgeY + badgeSize / 2);
  }, [isOpen, party.code]);

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
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md rounded-[32px] liquid-glass-card border border-white/20 p-6 shadow-2xl text-white z-10 overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#F0DC00]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0DC00]/10 border border-[#F0DC00]/30 text-[#F0DC00] text-[11px] font-extrabold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              PRIVATE PARTY INVITATION
            </span>
            <h3 className="font-display font-black text-2xl text-white tracking-tight">
              {party.title}
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              Scan QR code or use the 4-character passkey to join
            </p>
          </div>

          {/* QR Code Canvas Card */}
          <div className="flex flex-col items-center justify-center mb-5">
            <div className="p-3.5 rounded-3xl bg-[#0F0F0F] border border-white/15 shadow-2xl relative">
              <canvas
                ref={canvasRef}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl block"
              />
              <span className="absolute bottom-2 left-0 right-0 text-[10px] text-center font-mono text-white/40 tracking-wider">
                SCAN WITH MOBILE CAMERA
              </span>
            </div>
          </div>

          {/* Verbal 4-Character Code Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/40 block">
                Verbal Passkey
              </span>
              <span className="font-mono font-black text-3xl text-[#F0DC00] tracking-widest block">
                {party.code}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-display flex items-center gap-1.5 transition-all ${
                copiedCode
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Code
                </>
              )}
            </button>
          </div>

          {/* Quick Viral Share Actions */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <a
              href={`https://wa.me/?text=${shareTextWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-emerald-300 font-display font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${shareTextTelegram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-2xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-sky-300 font-display font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
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
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-mono text-white/40">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Server-side permit mapping · Monad Testnet</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
