'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  ArrowUp,
  QrCode,
  ChevronDown,
  Check,
  Copy,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  X,
  Landmark,
  Coins,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { usePartyStore } from '@/store/usePartyStore';
import { useWallets } from '@privy-io/react-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { MONAD_CONTRACT_ADDRESSES } from '@/contracts';
import { useMonPrice } from '@/hooks/useMonPrice';
import { getCoverUrl, getAvatarUrl } from '@/lib/imageOptimization';
import { UsdcLogo, MonadLogo } from '@/components/ui/TokenLogo';
import {
  formatWeb3Error,
  formatShortRelativeTime,
  FormattedWeb3Error,
} from '@/lib/web3Error';

export const PartyPotView: React.FC = () => {
  const {
    parties,
    currentPartyId,
    crews,
    transactions,
    addToPot,
    spendFromPot,
    rolloverPotToCrew,
    setCurrentView,
    goBack,
    theme,
  } = usePartyStore();

  const { language } = useTranslation();
  const isEs = language === 'es';

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyMembers = party?.members || [];
  const partyTransactions = transactions.filter((t) => t.partyId === party?.id);
  const associatedCrew = crews.find((c) => c.id === party?.crewId);

  // Pyth Network Onchain MON/USD Price Feed
  const { price: monPrice } = useMonPrice();

  // Active Tab: 'add' | 'withdraw' | 'qr'
  const [activeTab, setActiveTab] = useState<'add' | 'withdraw' | 'qr'>('add');
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const potActions = [
    {
      id: 'add' as const,
      label: isEs ? 'Añadir' : 'Add',
      icon: Plus,
      onClick: () => {
        setActiveTab('add');
        setTxError(null);
      },
    },
    {
      id: 'withdraw' as const,
      label: isEs ? 'Retirar' : 'Withdraw',
      icon: ArrowUp,
      onClick: () => {
        setActiveTab('withdraw');
        setTxError(null);
      },
    },
    {
      id: 'qr' as const,
      label: isEs ? 'Código QR' : 'QR Code',
      icon: QrCode,
      onClick: () => {
        setActiveTab('qr');
        setTxError(null);
      },
    },
  ];

  // Suggested Amount Selected
  const [selectedSuggested, setSelectedSuggested] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState<string>('10');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('5');
  const [withdrawDesc, setWithdrawDesc] = useState<string>('');

  // Token & Network Selector State
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'MON'>('USDC');

  // QR Canvas
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Menu Modal State
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState<boolean>(false);

  // Feedback & Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<FormattedWeb3Error | null>(null);

  const { wallets } = useWallets();
  const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];

  // Derive USD balance and MON balance
  const monBalance = party?.potBalance ?? 0;
  // If user views in USD, calculate via monPrice or default multiplier
  const effectiveMonPrice = monPrice && monPrice > 0 ? monPrice : 18.64;
  const potUsdAmount = (monBalance * effectiveMonPrice).toFixed(2);

  // Target deposit address (Party contract or party ID fallback)
  const depositAddress =
    MONAD_CONTRACT_ADDRESSES?.partyTreasury || party?.id || '0x71C...PartyPot';

  // Render QR Code on canvas
  useEffect(() => {
    if (activeTab !== 'qr' || !qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const qrData = `ethereum:${depositAddress}?value=${customAmount}`;
      const qr = QRCode.create(qrData, { errorCorrectionLevel: 'M' });
      const moduleCount = qr.modules.size;
      const margin = 2;
      const totalModules = moduleCount + margin * 2;
      const cellSize = Math.floor(480 / totalModules);
      const canvasSize = cellSize * totalModules;

      canvas.width = canvasSize;
      canvas.height = canvasSize;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      ctx.fillStyle = '#171512';
      const offset = margin * cellSize;
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.modules.get(r, c)) {
            ctx.beginPath();
            ctx.roundRect(
              offset + c * cellSize,
              offset + r * cellSize,
              cellSize - 0.5,
              cellSize - 0.5,
              1.5
            );
            ctx.fill();
          }
        }
      }
    } catch (err) {
      console.error('Error generating pot QR code:', err);
    }
  }, [activeTab, depositAddress, customAmount]);

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(depositAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSelectSuggested = (val: number) => {
    setSelectedSuggested(val);
    setCustomAmount(String(val));
    setIsCustomMode(false);
  };

  const handleAddFunds = async () => {
    const usdVal = parseFloat(customAmount);
    if (isNaN(usdVal) || usdVal <= 0) {
      setTxError({
        title: isEs ? 'Monto no válido' : 'Invalid amount',
        message: isEs
          ? 'Ingresa un monto válido mayor a 0 para aportar al bote.'
          : 'Enter a valid amount greater than 0 to add to the pot.',
        isUserRejection: false,
      });
      return;
    }

    // Convert USD input to MON for onchain contract execution if needed
    const monDepositAmount = selectedToken === 'MON' ? usdVal : Number((usdVal / effectiveMonPrice).toFixed(4));

    setIsProcessing(true);
    setTxError(null);
    try {
      const res = await addToPot(
        party.id,
        monDepositAmount > 0 ? monDepositAmount : 0.1,
        `Added $${usdVal.toFixed(2)} (${selectedToken}) to Party Pot`,
        { wallet: activeWallet }
      );

      if (res.receipt?.txHash) {
        setLastTxHash(res.receipt.txHash);
      }

      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#2775CA', '#836EF9'],
      });
    } catch (err: unknown) {
      console.error('Error adding funds to pot:', err);
      setTxError(formatWeb3Error(err, isEs));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawFunds = async () => {
    const amountVal = parseFloat(withdrawAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setTxError({
        title: isEs ? 'Monto no válido' : 'Invalid amount',
        message: isEs
          ? 'Ingresa un monto válido mayor a 0 para retirar.'
          : 'Enter a valid amount greater than 0 to withdraw.',
        isUserRejection: false,
      });
      return;
    }
    if (!withdrawDesc.trim()) {
      setTxError({
        title: isEs ? 'Motivo requerido' : 'Description required',
        message: isEs
          ? 'Indica el motivo o gasto de la fiesta (ej. hielo, bebidas).'
          : 'Please enter a description for this party expense.',
        isUserRejection: false,
      });
      return;
    }

    const monWithdrawAmount = Number((amountVal / effectiveMonPrice).toFixed(4));
    if (party.potBalance < monWithdrawAmount) {
      setTxError({
        title: isEs ? 'Saldo insuficiente en el Pot' : 'Insufficient Pot Balance',
        message: isEs
          ? `Solo hay ${party.potBalance.toFixed(2)} MON disponibles en el bote.`
          : `Only ${party.potBalance.toFixed(2)} MON available in the party pot.`,
        isUserRejection: false,
      });
      return;
    }

    setIsProcessing(true);
    setTxError(null);
    try {
      const res = await spendFromPot(party.id, monWithdrawAmount, withdrawDesc.trim());
      if (res.receipt?.txHash) {
        setLastTxHash(res.receipt.txHash);
      }
      setWithdrawDesc('');
      setActiveTab('add');
    } catch (err: unknown) {
      console.error('Error withdrawing from pot:', err);
      setTxError(formatWeb3Error(err, isEs));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRolloverConfirm = async () => {
    if (!associatedCrew || party.potBalance <= 0) return;
    setIsProcessing(true);
    setTxError(null);
    try {
      const res = await rolloverPotToCrew(party.id, associatedCrew.id);
      if (res.receipt?.txHash) {
        setLastTxHash(res.receipt.txHash);
      }
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      setIsRolloverOpen(false);
      setIsMenuOpen(false);
    } catch (err: unknown) {
      console.error('Error rolling over pot:', err);
      setTxError(formatWeb3Error(err, isEs));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!party) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-32 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FFF5C0] dark:bg-[#F0DC00]/15 border border-[#F0DC00]/40 flex items-center justify-center text-[#B89600] mb-4">
          <Landmark className="w-8 h-8" />
        </div>
        <h2 className="font-display font-black text-xl mb-2">
          {isEs ? 'Sin fiesta seleccionada' : 'No gathering selected'}
        </h2>
        <p className="text-xs text-[#8E887E] dark:text-[#A8A196] max-w-xs mb-6 leading-relaxed">
          {isEs
            ? 'Selecciona una fiesta para gestionar su bote colectivo onchain.'
            : 'Select a gathering to manage its shared onchain treasury.'}
        </p>
        <button
          onClick={() => setCurrentView('home')}
          className="px-6 py-3 rounded-full bg-[#F0DC00] text-[#171512] font-bold text-xs"
        >
          {isEs ? 'Volver al Inicio' : 'Return Home'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-28 select-none relative transition-colors duration-200">
      {/* ============================================================== */}
      {/* 1. HERO COVER SECTION (MATCHING DESIGN REFERENCE)               */}
      {/* ============================================================== */}
      <div className="relative h-[390px] sm:h-[430px] md:h-[460px] w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto overflow-hidden">
        {/* Cover Photo Optimized */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getCoverUrl(party.coverImage, 900)}
          alt={party.title}
          className="w-full h-full object-cover"
          decoding="async"
          loading="eager"
        />

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/25 pointer-events-none" />

        {/* Top Floating Controls matching PartyDetailView aesthetics and position */}
        <header className="absolute top-0 left-0 right-0 z-40 px-4 sm:px-6 md:px-8 py-3 safe-top flex items-center justify-between pointer-events-none max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto w-full">
          {/* Back Button */}
          <button
            onClick={() => {
              if (goBack) goBack();
              else setCurrentView('party-detail');
            }}
            className="w-11 h-11 rounded-full glass-light flex items-center justify-center text-white border border-white/35 shadow-md pointer-events-auto active:scale-95 transition-transform cursor-pointer p-0"
            aria-label={isEs ? 'Volver' : 'Back'}
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
          </button>

          {/* Options Menu Button */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-11 h-11 rounded-full glass-light flex items-center justify-center text-white border border-white/35 shadow-md active:scale-95 transition-transform cursor-pointer p-0"
              aria-label={isEs ? 'Más opciones' : 'More options'}
            >
              <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </header>

        {/* Content Overlaid at Bottom of Photo (Sitting directly above the floating navigation pill) */}
        <div className="absolute bottom-16 sm:bottom-18 inset-x-5 sm:inset-x-6 z-20 text-white">
          <span className="text-white/85 text-xs sm:text-sm font-semibold tracking-tight block">
            {isEs ? 'Bote de la fiesta' : 'Party Pot'}
          </span>

          <div className="flex items-baseline gap-2.5 mt-0.5">
            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight leading-none text-white drop-shadow-sm">
              ${potUsdAmount}
            </h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs border border-white/20 text-[#FFF5C0]">
              {monBalance.toFixed(2)} MON
            </span>
          </div>

          <p className="text-white/75 text-xs font-medium mt-1">
            {isEs
              ? `compartido por ${partyMembers.length} personas`
              : `shared by ${partyMembers.length} people`}
          </p>

          {/* Overlapping Avatars Row (Directly above the floating capsule bar) */}
          <div className="flex items-center -space-x-2 mt-2.5">
            {partyMembers.slice(0, 8).map((m, idx) => (
              <div
                key={m.id || idx}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-[#181613] overflow-hidden bg-black/20 shadow-sm shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getAvatarUrl(m.avatar, 64)}
                  alt={m.name}
                  className="w-full h-full object-cover"
                  decoding="async"
                />
              </div>
            ))}
            {partyMembers.length > 8 && (
              <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs border-2 border-white dark:border-[#181613] flex items-center justify-center text-white text-[10px] font-extrabold shadow-sm shrink-0">
                +{partyMembers.length - 8}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN CARD SURFACE (LIQUID GLASS / WARM IVORY)               */}
      {/* ============================================================== */}
      <div className="relative -mt-6 md:-mt-8 z-20 rounded-t-[34px] md:rounded-t-[38px] bg-[#F7F2E8] dark:bg-[#12110E] px-4 sm:px-6 pt-0 pb-20 shadow-[0_-12px_40px_rgba(65,48,25,0.08)] dark:shadow-[0_-12px_40px_rgba(0,0,0,0.5)] max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto w-full transition-colors duration-200">
        {/* Floating Action Tabs Pill Container: Exactly matching PartyDetailView aesthetics and position ("arribita del borde y asi") */}
        <nav
          aria-label={isEs ? 'Acciones del bote' : 'Party Pot Actions'}
          className="relative -top-8 md:-top-10 h-[86px] sm:h-[90px] md:h-[96px] max-w-md sm:max-w-lg md:max-w-2xl mx-auto grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 sm:p-2.5 rounded-[36px] transition-all select-none bg-[rgba(250,248,243,0.85)] dark:bg-[rgba(24,22,19,0.88)] border border-white/90 dark:border-white/15 shadow-[0_12px_32px_rgba(71,55,35,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-2xl z-30"
        >
          {potActions.map((action) => {
            const Icon = action.icon;
            const isActive = activeTab === action.id;
            const isHovered = hoveredAction === action.id;

            return (
              <motion.button
                key={action.id}
                onMouseEnter={() => setHoveredAction(action.id)}
                onMouseLeave={() => setHoveredAction(null)}
                onTouchStart={() => setHoveredAction(action.id)}
                onTouchEnd={() => setHoveredAction(null)}
                onClick={action.onClick}
                whileTap={{ scale: 0.94 }}
                style={
                  isHovered
                    ? {
                        background: 'linear-gradient(145deg, #FFE973, #FFCE18 68%, #F8BF0A)',
                        boxShadow:
                          '0 0 24px rgba(255, 212, 41, 0.55), 0 6px 14px rgba(235, 179, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.75)',
                      }
                    : isActive
                      ? {
                          background:
                            theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.88)',
                          boxShadow:
                            theme === 'dark'
                              ? '0 3px 12px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                              : '0 3px 12px rgba(74, 56, 35, 0.08), inset 0 1px 1px rgba(255, 255, 255, 1)',
                        }
                      : {
                          background:
                            theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.45)',
                          boxShadow:
                            theme === 'dark'
                              ? '0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.08)'
                              : '0 2px 6px rgba(74, 56, 35, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.85)',
                        }
                }
                className={`flex flex-col items-center justify-center gap-1 min-w-0 rounded-[26px] transition-all duration-200 cursor-pointer text-[#161514] dark:text-[#F5F1E8] ${
                  isHovered || isActive ? 'font-bold' : 'font-medium opacity-85'
                }`}
                aria-label={action.label}
              >
                <Icon
                  className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${
                    isHovered || isActive ? 'stroke-[2.5]' : 'stroke-[2.2]'
                  }`}
                />
                <span className="text-[11px] sm:text-[12px] tracking-tight leading-none">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </nav>

        {/* Content Wrapper (Offset below the floating navigation capsule) */}
        <div className="relative -mt-4 sm:-mt-5">
          {/* iOS 27 Liquid Glass Real-time Web3 Error / Notice Banner */}
          <AnimatePresence>
            {txError && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className={`mb-5 p-3.5 sm:p-4 rounded-[26px] backdrop-blur-2xl border transition-all ${
                  txError.isUserRejection
                    ? 'bg-amber-500/[0.08] dark:bg-amber-400/[0.12] border-amber-500/25 dark:border-amber-400/30 text-[#171512] dark:text-[#FBF8F2] shadow-[0_8px_30px_rgba(245,158,11,0.08),inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]'
                    : 'bg-rose-500/[0.08] dark:bg-rose-500/[0.14] border-rose-500/25 dark:border-rose-400/30 text-[#171512] dark:text-[#FBF8F2] shadow-[0_8px_30px_rgba(244,63,94,0.08),inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                        txError.isUserRejection
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {txError.isUserRejection ? (
                        <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-display font-bold text-xs sm:text-sm block leading-tight">
                        {txError.title}
                      </span>
                      <p className="text-[11px] sm:text-xs text-[#706B66] dark:text-[#A8A196] font-medium mt-0.5 leading-relaxed">
                        {txError.message}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTxError(null)}
                    className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[#706B66] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-colors cursor-pointer shrink-0"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Collapsible Technical Details for Developer Tracing (Cleanly Truncated) */}
                {txError.technicalDetails && !txError.isUserRejection && (
                  <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10">
                    <details className="text-[10px] text-[#8E887E] dark:text-[#A8A196] font-mono">
                      <summary className="cursor-pointer hover:underline font-sans font-semibold">
                        {isEs ? 'Detalles técnicos' : 'Technical details'}
                      </summary>
                      <pre className="mt-1.5 p-2 rounded-xl bg-black/5 dark:bg-black/40 text-[9px] overflow-x-auto whitespace-pre-wrap break-all max-h-24">
                        {txError.technicalDetails}
                      </pre>
                    </details>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Real-time Monad Transaction Confirmation Toast */}
          {lastTxHash && (
            <div className="mb-4 flex items-center justify-between p-3.5 rounded-[22px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs backdrop-blur-xl shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isEs
                    ? 'Transacción confirmada en Monad Testnet'
                    : 'Transaction confirmed on Monad Testnet'}
                </span>
              </div>
              <a
                href={`https://testnet.monadexplorer.com/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono underline font-bold flex items-center gap-1 text-[#674FF4]"
              >
                <span>{lastTxHash.slice(0, 8)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

        {/* ============================================================== */}
        {/* TAB WORKSPACE CARD (MATCHING PARTY DETAIL LIQUID GLASS FINISH) */}
        {/* ============================================================== */}
        <section
          aria-label={isEs ? 'Panel de acción del bote' : 'Pot action panel'}
          className="rounded-[32px] bg-white/55 dark:bg-[#1C1A16] border border-white/80 dark:border-white/10 shadow-[0_9px_20px_rgba(66,52,32,0.08)] dark:shadow-[0_9px_20px_rgba(0,0,0,0.45)] backdrop-blur-md p-4 sm:p-5 mb-6"
        >
          {/* TAB A: ADD TO POT (DEFAULT & PRIMARY USER FLOW) */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              {/* Suggested Amounts Label & Pills */}
              <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-bold text-xs sm:text-sm text-[#171512] dark:text-white">
                  {isEs ? 'Montos sugeridos' : 'Suggested amounts'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className="text-xs text-[#8E887E] dark:text-[#A8A196] font-semibold hover:text-[#171512] dark:hover:text-white cursor-pointer"
                >
                  {isCustomMode
                    ? isEs
                      ? 'Usar sugeridos'
                      : 'Use suggested'
                    : isEs
                      ? 'Monto personalizado'
                      : 'Custom amount'}
                </button>
              </div>

              {!isCustomMode ? (
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                  {[5, 10, 20, 50].map((amt) => {
                    const isSelected = selectedSuggested === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectSuggested(amt)}
                        className={`py-2.5 sm:py-3 rounded-[20px] sm:rounded-[24px] text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#FFE600] dark:bg-[#F0DC00] text-[#161514] font-black shadow-[0_2px_14px_rgba(240,220,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.9)]'
                            : 'bg-white/95 dark:bg-[#1E1B17]/95 text-[#171512] dark:text-white shadow-[0_2px_8px_rgba(65,48,25,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-black/[0.04] dark:border-white/10 hover:border-black/15'
                        }`}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-base text-[#8E887E]">
                    $
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedSuggested(null);
                    }}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-white/95 dark:bg-[#1E1B17]/95 border border-black/10 dark:border-white/15 text-[#171512] dark:text-white font-bold text-base focus:outline-none focus:border-[#F0DC00]"
                  />
                </div>
              )}
            </div>

            {/* Token & Network Selector Card with Official Circle USDC & Monad SVGs */}
            <div className="relative">
              <div
                onClick={() => setIsTokenSelectorOpen(!isTokenSelectorOpen)}
                className="p-3.5 sm:p-4 rounded-[24px] sm:rounded-[28px] bg-white/95 dark:bg-[#1E1B17]/95 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_4px_20px_rgba(70,52,28,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.08)] flex items-center justify-between cursor-pointer hover:border-black/15 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  {selectedToken === 'USDC' ? (
                    <UsdcLogo size="xl" className="w-10 h-10 shrink-0" />
                  ) : (
                    <MonadLogo size="xl" className="w-10 h-10 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-sm text-[#171512] dark:text-white block leading-tight">
                      {selectedToken === 'USDC' ? 'USDC · Base' : 'MON · Monad Testnet'}
                    </span>
                    <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block mt-0.5">
                      {isEs ? 'Rápido, comisiones bajas' : 'Fast, low fees'}
                    </span>
                  </div>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-[#8E887E] transition-transform ${
                    isTokenSelectorOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Token Selector Dropdown */}
              <AnimatePresence>
                {isTokenSelectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute top-full left-0 right-0 mt-2 z-30 p-2 rounded-2xl bg-white dark:bg-[#1E1B17] border border-black/10 dark:border-white/15 shadow-xl space-y-1"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedToken('USDC');
                        setIsTokenSelectorOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left text-xs font-bold cursor-pointer transition-colors ${
                        selectedToken === 'USDC'
                          ? 'bg-[#F0DC00]/20 text-[#171512] dark:text-white'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <UsdcLogo size="lg" className="w-6 h-6" />
                        <span>USDC · Base Network</span>
                      </div>
                      {selectedToken === 'USDC' && <Check className="w-4 h-4 text-[#171512] dark:text-white" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedToken('MON');
                        setIsTokenSelectorOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left text-xs font-bold cursor-pointer transition-colors ${
                        selectedToken === 'MON'
                          ? 'bg-[#836EF9]/20 text-[#171512] dark:text-white'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MonadLogo size="lg" className="w-6 h-6" />
                        <span>MON · Monad Testnet</span>
                      </div>
                      {selectedToken === 'MON' && <Check className="w-4 h-4 text-[#171512] dark:text-white" />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Big Prominent Yellow CTA Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleAddFunds}
              disabled={isProcessing}
              className="w-full py-3.5 sm:py-4 rounded-full bg-[#FFE600] dark:bg-[#F0DC00] text-[#161514] font-display font-black text-sm sm:text-base tracking-tight shadow-[0_6px_22px_rgba(240,220,0,0.38),inset_0_1px_1px_rgba(255,255,255,0.9)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-[#161514] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>
                  {isEs
                    ? `Añadir $${parseFloat(customAmount || '0').toFixed(2)} al bote`
                    : `Add $${parseFloat(customAmount || '0').toFixed(2)} to pot`}
                </span>
              )}
            </motion.button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB B: WITHDRAW FUNDS (EXPENSE SETTLEMENT)                      */}
        {/* ============================================================== */}
        {activeTab === 'withdraw' && (
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#171512] dark:text-white block mb-1">
                  {isEs ? 'Monto a retirar' : 'Amount to withdraw'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[#8E887E]">
                    $
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/15 text-sm font-bold focus:outline-none focus:border-[#F0DC00]"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#171512] dark:text-white block mb-1">
                  {isEs ? 'Motivo o gasto de la fiesta' : 'Reason or party expense'}
                </label>
                <input
                  type="text"
                  value={withdrawDesc}
                  onChange={(e) => setWithdrawDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/15 text-sm font-medium focus:outline-none focus:border-[#F0DC00]"
                  placeholder={isEs ? 'Ej. Hielo, bebidas, snacks' : 'e.g. Ice, drinks, snacks'}
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleWithdrawFunds}
              disabled={isProcessing}
              className="w-full py-4 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] font-display font-black text-sm tracking-tight shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white dark:border-[#171512] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isEs ? 'Retirar del bote' : 'Withdraw from pot'}</span>
              )}
            </motion.button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB C: QR CODE DISPLAY & ADDRESS COPY                          */}
        {/* ============================================================== */}
        {activeTab === 'qr' && (
          <div className="p-6 rounded-[28px] bg-white/90 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xs flex flex-col items-center justify-center text-center mb-6">
            <h4 className="font-display font-bold text-base text-[#171512] dark:text-white mb-1">
              {isEs ? 'Escanea para transferir al bote' : 'Scan to transfer to pot'}
            </h4>
            <p className="text-xs text-[#8E887E] dark:text-[#A8A196] max-w-xs mb-4">
              {isEs
                ? 'Cualquier asistente puede enviar fondos directamente usando su billetera habitual.'
                : 'Any attendee can send funds directly using their preferred wallet.'}
            </p>

            {/* QR Canvas */}
            <div className="p-3 rounded-2xl bg-white shadow-md border border-black/10 mb-4 inline-block">
              <canvas ref={qrCanvasRef} className="w-48 h-48 sm:w-56 sm:h-56 block rounded-lg" />
            </div>

            {/* Copy Address Button */}
            <button
              onClick={handleCopyAddress}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-semibold cursor-pointer transition-colors"
            >
              {copiedAddress ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {isEs ? 'Dirección copiada' : 'Address copied'}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8E887E]" />
                  <span>
                    {depositAddress.slice(0, 10)}...{depositAddress.slice(-8)}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 3. RECENT ACTIVITY CARD (MATCHING PARTY DETAIL LIQUID GLASS)   */}
      {/* ============================================================== */}
      <section
        aria-label={isEs ? 'Historial del bote' : 'Pot history'}
        className="rounded-[32px] bg-white/55 dark:bg-[#1C1A16] border border-white/80 dark:border-white/10 shadow-[0_9px_20px_rgba(66,52,32,0.08)] dark:shadow-[0_9px_20px_rgba(0,0,0,0.45)] backdrop-blur-md p-4 sm:p-5"
      >
        <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-extrabold text-sm sm:text-base text-[#171512] dark:text-white tracking-tight">
              {isEs ? 'Actividad reciente' : 'Recent activity'}
            </h3>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-xs font-semibold text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isEs ? 'Ver todo' : 'See all'}</span>
              <span className="text-[10px] ml-0.5">&gt;</span>
            </button>
          </div>

          <div className="space-y-2">
            {partyTransactions.length > 0 ? (
              partyTransactions.slice(0, 5).map((tx) => {
                const isDeposit = tx.type === 'add';
                const user = partyMembers.find((m) => m.name === tx.userName) || partyMembers[0];

                return (
                  <div
                    key={tx.id}
                    className="p-2.5 sm:p-3 rounded-[22px] sm:rounded-[24px] bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-white/80 dark:border-white/10 flex items-center justify-between gap-2.5 sm:gap-3 shadow-[0_2px_12px_rgba(65,48,25,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {/* Avatar with Tiny Plus/Minus Micro Badge */}
                      <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getAvatarUrl(user?.avatar, 80)}
                          alt={tx.userName}
                          className="w-full h-full rounded-full object-cover border border-black/10 dark:border-white/15"
                          decoding="async"
                        />
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black border border-white dark:border-[#181613] shadow-xs ${
                            isDeposit
                              ? 'bg-[#FFE600] text-[#161514]'
                              : 'bg-[#FFCCD5] text-[#900B22]'
                          }`}
                        >
                          {isDeposit ? '+' : '-'}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pr-1">
                        <span className="text-xs sm:text-sm font-bold text-[#171512] dark:text-white block leading-tight truncate">
                          {tx.userName}{' '}
                          <span className="font-normal text-[#8E887E] dark:text-[#A8A196]">
                            {isDeposit
                              ? isEs
                                ? `aportó $${(tx.amount * effectiveMonPrice).toFixed(0)}`
                                : `added $${(tx.amount * effectiveMonPrice).toFixed(0)}`
                              : isEs
                                ? `retiró $${(tx.amount * effectiveMonPrice).toFixed(0)}`
                                : `withdrew $${(tx.amount * effectiveMonPrice).toFixed(0)}`}
                          </span>
                        </span>
                        {tx.description && (
                          <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196] block mt-0.5 truncate max-w-[130px] sm:max-w-xs">
                            {tx.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-1">
                      <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium whitespace-nowrap block">
                        {formatShortRelativeTime(tx.timestamp)}
                      </span>
                      {tx.txHash && (
                        <a
                          href={`https://testnet.monadexplorer.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#836EF9] hover:underline block font-mono"
                        >
                          explorer
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              /* Fallback Social Initial Activity matching design mockup */
              [
                {
                  id: 'default-1',
                  name: partyMembers[0]?.name || 'Ana',
                  avatar: partyMembers[0]?.avatar,
                  action: isEs ? 'aportó $10' : 'added $10',
                  time: '2m ago',
                  isAdd: true,
                },
                {
                  id: 'default-2',
                  name: partyMembers[1]?.name || 'Carlos',
                  avatar: partyMembers[1]?.avatar,
                  action: isEs ? 'aportó $25' : 'added $25',
                  time: '12m ago',
                  isAdd: true,
                },
                {
                  id: 'default-3',
                  name: partyMembers[2]?.name || 'Sofi',
                  avatar: partyMembers[2]?.avatar,
                  action: isEs ? 'retiró $12' : 'withdrew $12',
                  time: '1h ago',
                  isAdd: false,
                },
                {
                  id: 'default-4',
                  name: partyMembers[3]?.name || 'Valen',
                  avatar: partyMembers[3]?.avatar,
                  action: isEs ? 'aportó $8' : 'added $8',
                  time: '3h ago',
                  isAdd: true,
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 sm:p-3 rounded-[22px] sm:rounded-[24px] bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-white/80 dark:border-white/10 flex items-center justify-between gap-2.5 sm:gap-3 shadow-[0_2px_12px_rgba(65,48,25,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.05)]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getAvatarUrl(item.avatar, 80)}
                        alt={item.name}
                        className="w-full h-full rounded-full object-cover border border-black/10 dark:border-white/15"
                        decoding="async"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black border border-white dark:border-[#181613] shadow-xs ${
                          item.isAdd
                            ? 'bg-[#FFE600] text-[#161514]'
                            : 'bg-[#FFCCD5] text-[#900B22]'
                        }`}
                      >
                        {item.isAdd ? '+' : '-'}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 pr-1">
                      <span className="text-xs sm:text-sm font-bold text-[#171512] dark:text-white block leading-tight truncate">
                        {item.name}{' '}
                        <span className="font-normal text-[#8E887E] dark:text-[#A8A196]">
                          {item.action}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-1">
                    <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium whitespace-nowrap block">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>

      {/* ============================================================== */}
      {/* 4. OPTIONS MENU MODAL                                          */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-[#FFFDF8] dark:bg-[#1E1B17] border border-black/10 dark:border-white/15 p-6 shadow-2xl z-10 text-[#171512] dark:text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg">
                  {isEs ? 'Opciones del Bote' : 'Party Pot Options'}
                </h3>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#8E887E] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <a
                  href={`https://testnet.monadexplorer.com/address/${MONAD_CONTRACT_ADDRESSES.partyTreasury}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] flex items-center justify-between hover:bg-black/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-[#836EF9]" />
                    <span className="text-xs font-bold">
                      {isEs ? 'Ver contrato en Monad Explorer' : 'View contract on Monad Explorer'}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#8E887E]" />
                </a>

                {associatedCrew && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsRolloverOpen(true);
                    }}
                    className="w-full p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] flex items-center justify-between hover:bg-black/[0.06] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowRightLeft className="w-5 h-5 text-[#B89600]" />
                      <div>
                        <span className="text-xs font-bold block">
                          {isEs ? 'Transferir remanente a Crew' : 'Rollover pot to Crew'}
                        </span>
                        <span className="text-[10px] text-[#8E887E] block mt-0.5">
                          {associatedCrew.name}
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-3 rounded-full bg-black/5 dark:bg-white/10 text-xs font-bold"
              >
                {isEs ? 'Cerrar' : 'Close'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rollover Confirm Modal */}
      <AnimatePresence>
        {isRolloverOpen && associatedCrew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRolloverOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-sm rounded-[32px] bg-[#FFFDF8] dark:bg-[#1E1B17] border border-black/10 dark:border-white/15 p-6 shadow-2xl z-10 text-center"
            >
              <h3 className="font-display font-black text-lg mb-2">
                {isEs ? '¿Transferir remanente?' : 'Rollover remaining pot?'}
              </h3>
              <p className="text-xs text-[#8E887E] dark:text-[#A8A196] leading-relaxed mb-6">
                {isEs
                  ? `Se transferirán ${party.potBalance.toFixed(2)} MON a la tesorería permanente de "${associatedCrew.name}".`
                  : `Transfer ${party.potBalance.toFixed(2)} MON to "${associatedCrew.name}" permanent crew treasury.`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRolloverOpen(false)}
                  className="flex-1 py-3 rounded-full border border-black/10 text-xs font-bold"
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={handleRolloverConfirm}
                  disabled={isProcessing}
                  className="flex-1 py-3 rounded-full bg-[#F0DC00] text-[#171512] text-xs font-bold"
                >
                  {isProcessing ? '...' : isEs ? 'Confirmar' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
