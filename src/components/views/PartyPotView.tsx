'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  MoreHorizontal,
  Plus,
  ArrowUp,
  QrCode,
  ChevronDown,
  Check,
  Copy,
  ExternalLink,
  AlertTriangle,
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
  const [txError, setTxError] = useState<string | null>(null);

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
      setTxError(isEs ? 'Ingresa un monto válido mayor a 0' : 'Enter a valid amount greater than 0');
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
      const msg = err instanceof Error ? err.message : 'Error al procesar el depósito en Monad';
      console.error('Error adding funds to pot:', err);
      setTxError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawFunds = async () => {
    const amountVal = parseFloat(withdrawAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setTxError(isEs ? 'Ingresa un monto válido mayor a 0' : 'Enter a valid amount greater than 0');
      return;
    }
    if (!withdrawDesc.trim()) {
      setTxError(isEs ? 'Ingresa el motivo del retiro' : 'Enter a description for the withdrawal');
      return;
    }

    const monWithdrawAmount = Number((amountVal / effectiveMonPrice).toFixed(4));
    if (party.potBalance < monWithdrawAmount) {
      setTxError(
        isEs
          ? `Saldo insuficiente en el Pot (${party.potBalance.toFixed(2)} MON disponible).`
          : `Insufficient pot balance (${party.potBalance.toFixed(2)} MON available).`
      );
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
      const msg = err instanceof Error ? err.message : 'Error al retirar fondos del pot';
      console.error('Error withdrawing from pot:', err);
      setTxError(msg);
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
      const msg = err instanceof Error ? err.message : 'Error al transferir a la Crew';
      console.error('Error rolling over pot:', err);
      setTxError(msg);
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
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-28 select-none relative transition-colors duration-200">
      {/* ============================================================== */}
      {/* 1. HERO COVER SECTION (MATCHING DESIGN REFERENCE)               */}
      {/* ============================================================== */}
      <div className="relative h-80 sm:h-96 md:h-[420px] w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto overflow-hidden">
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

        {/* Top Floating Navigation Header */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
          {/* Back Button */}
          <button
            onClick={() => setCurrentView('party-detail')}
            className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer active:scale-95 shadow-md"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Options Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer active:scale-95 shadow-md"
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Content Overlaid at Bottom of Photo */}
        <div className="absolute bottom-9 inset-x-5 sm:inset-x-6 z-20 text-white">
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

          {/* Overlapping Avatars Row */}
          <div className="flex items-center -space-x-2 mt-3">
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
      <div className="relative -mt-6 z-20 rounded-t-[36px] bg-[#FAF7F2] dark:bg-[#181613] border-t border-white/70 dark:border-white/10 px-5 sm:px-6 pt-5 pb-16 shadow-[0_-12px_40px_rgba(65,48,25,0.08)] dark:shadow-[0_-12px_40px_rgba(0,0,0,0.5)] max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto w-full">
        {/* Real-time Monad Transaction Error Banner */}
        {txError && (
          <div className="mb-4 flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{txError}</span>
            </div>
            <button
              type="button"
              onClick={() => setTxError(null)}
              className="p-1 text-rose-500 hover:text-rose-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Real-time Monad Transaction Confirmation Toast */}
        {lastTxHash && (
          <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
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

        {/* 3 Action Squircles (Add, Withdraw, QR Code) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6">
          {/* 1. Add */}
          <button
            onClick={() => {
              setActiveTab('add');
              setTxError(null);
            }}
            className={`py-3.5 px-3 rounded-[24px] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'bg-[#F0DC00] text-[#171512] font-bold shadow-xs scale-[1.02]'
                : 'bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#736C61] dark:text-[#A8A196] hover:bg-white dark:hover:bg-white/10'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                activeTab === 'add' ? 'border border-[#171512]' : 'border border-current'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
            </div>
            <span className="text-xs font-bold leading-none tracking-tight">
              {isEs ? 'Añadir' : 'Add'}
            </span>
          </button>

          {/* 2. Withdraw */}
          <button
            onClick={() => {
              setActiveTab('withdraw');
              setTxError(null);
            }}
            className={`py-3.5 px-3 rounded-[24px] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'withdraw'
                ? 'bg-[#F0DC00] text-[#171512] font-bold shadow-xs scale-[1.02]'
                : 'bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#736C61] dark:text-[#A8A196] hover:bg-white dark:hover:bg-white/10'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                activeTab === 'withdraw' ? 'border border-[#171512]' : 'border border-current'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold leading-none tracking-tight">
              {isEs ? 'Retirar' : 'Withdraw'}
            </span>
          </button>

          {/* 3. QR Code */}
          <button
            onClick={() => {
              setActiveTab('qr');
              setTxError(null);
            }}
            className={`py-3.5 px-3 rounded-[24px] flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-[#F0DC00] text-[#171512] font-bold shadow-xs scale-[1.02]'
                : 'bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#736C61] dark:text-[#A8A196] hover:bg-white dark:hover:bg-white/10'
            }`}
          >
            <QrCode className="w-5 h-5 stroke-[2.2]" />
            <span className="text-xs font-bold leading-none tracking-tight">
              {isEs ? 'Código QR' : 'QR Code'}
            </span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB A: ADD TO POT (DEFAULT & PRIMARY USER FLOW)                */}
        {/* ============================================================== */}
        {activeTab === 'add' && (
          <div className="space-y-4 mb-6">
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
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {[5, 10, 20, 50].map((amt) => {
                    const isSelected = selectedSuggested === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectSuggested(amt)}
                        className={`py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#F0DC00] text-[#171512] shadow-xs scale-[1.02]'
                            : 'bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#171512] dark:text-white hover:bg-white dark:hover:bg-white/10'
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
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/15 text-[#171512] dark:text-white font-bold text-base focus:outline-none focus:border-[#F0DC00]"
                  />
                </div>
              )}
            </div>

            {/* Token & Network Selector Card */}
            <div className="relative">
              <div
                onClick={() => setIsTokenSelectorOpen(!isTokenSelectorOpen)}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-between cursor-pointer hover:border-black/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  {selectedToken === 'USDC' ? (
                    <div className="w-10 h-10 rounded-full bg-[#2775CA] flex items-center justify-center text-white shrink-0 shadow-sm">
                      <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center font-bold text-xs">
                        $
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#836EF9] flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-xs">
                      MON
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-sm text-[#171512] dark:text-white block leading-tight">
                      {selectedToken === 'USDC' ? 'USDC · Base' : 'MON · Monad Testnet'}
                    </span>
                    <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block mt-0.5">
                      {isEs ? 'Rápido, gas patrocinado' : 'Fast, low fees'}
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
                        <div className="w-6 h-6 rounded-full bg-[#2775CA] text-white flex items-center justify-center text-[10px] font-bold">
                          $
                        </div>
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
                        <div className="w-6 h-6 rounded-full bg-[#836EF9] text-white flex items-center justify-center text-[10px] font-bold">
                          M
                        </div>
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
              className="w-full py-4 rounded-full bg-[#F0DC00] text-[#171512] font-display font-black text-sm sm:text-base tracking-tight shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-[#171512] border-t-transparent rounded-full animate-spin" />
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

        {/* ============================================================== */}
        {/* 3. RECENT ACTIVITY LIST (MATCHING DESIGN REFERENCE)            */}
        {/* ============================================================== */}
        <div>
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
                    className="p-3 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-black/5 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar with Tiny Plus/Minus Micro Badge */}
                      <div className="relative w-10 h-10 rounded-full shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getAvatarUrl(user?.avatar, 80)}
                          alt={tx.userName}
                          className="w-full h-full rounded-full object-cover border border-black/10 dark:border-white/15"
                          decoding="async"
                        />
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black border border-white shadow-xs ${
                            isDeposit
                              ? 'bg-[#F0DC00] text-[#171512]'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {isDeposit ? '+' : '-'}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs sm:text-sm font-bold text-[#171512] dark:text-white block leading-tight">
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
                        <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196] block mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                          {tx.description || `${tx.amount} MON`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium block">
                        {tx.timestamp || '2m ago'}
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
              /* Fallback Social Initial Activity */
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
              ].map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-black/5 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getAvatarUrl(item.avatar, 80)}
                        alt={item.name}
                        className="w-full h-full rounded-full object-cover border border-black/10 dark:border-white/15"
                        decoding="async"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black border border-white shadow-xs ${
                          item.isAdd ? 'bg-[#F0DC00] text-[#171512]' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.isAdd ? '+' : '-'}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#171512] dark:text-white block leading-tight">
                        {item.name}{' '}
                        <span className="font-normal text-[#8E887E] dark:text-[#A8A196]">
                          {item.action}
                        </span>
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-[#8E887E] dark:text-[#A8A196] font-medium shrink-0">
                    {item.time}
                  </span>
                </div>
              ))
            )}
          </div>
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
