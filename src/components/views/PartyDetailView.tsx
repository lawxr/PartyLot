import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Receipt,
  Coins,
  BarChart3,
  Share2,
  ArrowLeft,
  MapPin,
  Calendar,
  Sparkles,
  Plus,
  Minus,
  X,
  Loader2,
  UploadCloud,
  MoreHorizontal,
  ChevronRight,
  Check,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWallets } from '@privy-io/react-auth';
import { formatEther } from 'viem';
import { publicMonadClient } from '@/lib/web3/monad';
import { usePartyStore } from '@/store/usePartyStore';
import { PartyInviteModal } from '@/components/ui/PartyInviteModal';
import { SharedExperienceModal } from '@/components/ui/SharedExperienceModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { TokenLogo, CryptoBadge } from '@/components/ui/TokenLogo';
import { Member, PartyMemory } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { uploadImageFile } from '@/services/storageService';
import { useMonPrice } from '@/hooks/useMonPrice';

export const PartyDetailView: React.FC = () => {
  const {
    parties,
    currentPartyId,
    memories,
    activities,
    setCurrentView,
    setActiveTab,
    goBack,
    listenToActivePartyRealtime,
    loadPartyFromSupabase,
    addPartyMemory,
    addToPot,
    theme,
  } = usePartyStore();
  const { t, language } = useTranslation();
  const isEs = language === 'es';

  const defaultParty = parties[0];
  const party = parties.find((p) => p.id === currentPartyId) || parties[0] || defaultParty;
  const partyMemories = (memories || []).filter(
    (m) => m.partyId === party?.id || m.partyId === 'party_hackathon_demo' || m.partyId === 'p-404'
  );
  const partyActivities = (activities || []).filter(
    (a) =>
      a.partyId === party?.id ||
      a.partyId === 'party_hackathon_demo' ||
      a.partyId === 'p-404' ||
      !a.partyId
  );
  const partyMembers = (party?.members && party.members.length > 0)
    ? party.members
    : (defaultParty?.members || []);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PartyMemory | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [captionInput, setCaptionInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const { price: monPrice } = useMonPrice();

  // Phone 3 Party Pot Sheet state
  const { wallets } = useWallets();
  const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
  const [userBalance, setUserBalance] = useState<string | null>(null);
  const [isPotSheetOpen, setIsPotSheetOpen] = useState(false);
  const [potAmount, setPotAmount] = useState<number>(0.5);
  const [isPotSubmitting, setIsPotSubmitting] = useState(false);
  const [potError, setPotError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!activeWallet?.address) {
      return;
    }

    publicMonadClient
      .getBalance({ address: activeWallet.address as `0x${string}` })
      .then((b) => {
        if (isMounted) setUserBalance(formatEther(b));
      })
      .catch(() => {
        if (isMounted) setUserBalance(null);
      });

    return () => {
      isMounted = false;
    };
  }, [activeWallet?.address]);

  const quickActions = [
    { id: 'play', label: isEs ? 'Juegos' : 'Games', icon: Gamepad2, onClick: () => setCurrentView('games') },
    { id: 'split', label: 'Split', icon: Receipt, onClick: () => setCurrentView('split') },
    { id: 'pot', label: 'Pot', icon: Coins, onClick: () => setIsPotSheetOpen(true) },
    { id: 'poll', label: isEs ? 'Votar' : 'Poll', icon: BarChart3, onClick: () => setCurrentView('polls') },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setIsUploadModalOpen(true);
    e.target.value = '';
  };

  const handleConfirmUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const cdnUrl = await uploadImageFile(selectedFile, 'party-memories');
      await addPartyMemory({
        imageUrl: cdnUrl,
        caption: captionInput.trim() || undefined,
      });
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#A855F7', '#38BDF8', '#10B981'],
      });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaptionInput('');
    } catch (err) {
      console.error('Error uploading party photo:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddToPot = async () => {
    if (!party?.id) return;
    setIsPotSubmitting(true);
    setPotError(null);
    try {
      await addToPot(
        party.id,
        potAmount,
        `Deposit of ${potAmount} MON on Monad Testnet`,
        { wallet: activeWallet }
      );
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2775CA', '#836EF9', '#F0DC00'],
      });
      setIsPotSheetOpen(false);
      if (activeWallet?.address) {
        publicMonadClient
          .getBalance({ address: activeWallet.address as `0x${string}` })
          .then((b) => setUserBalance(formatEther(b)))
          .catch(() => {});
      }
    } catch (err) {
      console.error('Error adding to party pot:', err);
      setPotError(err instanceof Error ? err.message : 'Failed to deposit into Monad Treasury.');
    } finally {
      setIsPotSubmitting(false);
    }
  };

  const handleSponsoredDemoDeposit = async () => {
    if (!party?.id) return;
    setIsPotSubmitting(true);
    setPotError(null);
    try {
      await addToPot(
        party.id,
        potAmount,
        `Demo Sponsor deposit of ${potAmount} MON on Monad Testnet`
      );
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2775CA', '#836EF9', '#F0DC00'],
      });
      setIsPotSheetOpen(false);
    } catch (err) {
      console.error('Sponsored demo deposit error:', err);
      setPotError(err instanceof Error ? err.message : 'Failed to deposit with demo sponsor.');
    } finally {
      setIsPotSubmitting(false);
    }
  };

  useEffect(() => {
    if (party?.id) {
      loadPartyFromSupabase(party.id);
      const unsub = listenToActivePartyRealtime(party.id);
      return () => unsub();
    }
  }, [party?.id, listenToActivePartyRealtime, loadPartyFromSupabase]);

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-24 select-none relative overflow-x-hidden transition-colors duration-200">
      {/* ============================================================== */}
      {/* PHONE 2 TOP FLOATING CONTROLS (Back, Share, More)             */}
      {/* ============================================================== */}
      <header className="absolute top-0 left-0 right-0 z-40 px-4 sm:px-6 md:px-8 py-3 safe-top flex items-center justify-between pointer-events-none max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-6xl mx-auto w-full">
        <button
          onClick={() => {
            if (goBack) goBack();
            else setCurrentView('home');
          }}
          className="w-11 h-11 rounded-full glass-light flex items-center justify-center text-white border border-white/35 shadow-md pointer-events-auto active:scale-95 transition-transform cursor-pointer p-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
        </button>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsInviteOpen(true)}
            className="w-11 h-11 rounded-full glass-light flex items-center justify-center text-white border border-white/35 shadow-md active:scale-95 transition-transform cursor-pointer p-0"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4 stroke-[2.2]" />
          </button>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="w-11 h-11 rounded-full glass-light flex items-center justify-center text-white border border-white/35 shadow-md active:scale-95 transition-transform cursor-pointer p-0"
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>
      </header>

      
      <main className="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-6xl mx-auto w-full md:pt-4">
        {/* ============================================================== */}
        {/* Hero header */}
        {/* ============================================================== */}
        <div className="relative h-[60vh] sm:h-[64vh] min-h-[480px] lg:h-[440px] lg:min-h-0 w-full overflow-hidden md:rounded-[36px] md:shadow-2xl">
          {/* Background Image: Bright, Candid Party Photography */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={party?.coverImage || defaultParty.coverImage}
            alt={party?.title || defaultParty.title}
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
            decoding="async"
          />

          {/* Restrained Dark Gradient (lower half only) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

          {/* Hero details */}
          <div className="absolute bottom-16 sm:bottom-18 left-0 right-0 px-5 z-20 flex flex-col justify-end text-white">
            <h1 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight leading-none mb-2 drop-shadow-md">
              {party?.title || defaultParty.title}
            </h1>

            {/* Date & Location Row (Medellín with accent) */}
            <div className="flex items-center gap-3 text-xs sm:text-sm text-white/95 font-semibold mb-3 drop-shadow">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                {party?.date || 'Today'} · {party?.time || '9:00 PM'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                Medellín
              </span>
            </div>

            {/* Host Row */}
            <div className="flex items-center gap-2 mb-3 drop-shadow">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white shrink-0 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"
                  alt="Law"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white">
                {isEs ? `Organizado por ${party?.hostName || 'Law'}` : `Hosted by ${party?.hostName || 'Law'}`}
              </span>
            </div>

            {/* Real Attendees Avatar Stack with Social Graph Modal trigger */}
            <div className="flex items-center -space-x-1.5">
              {partyMembers.slice(0, 7).map((m, idx) => (
                <button
                  key={m.id || idx}
                  onClick={() => setSelectedMember(m)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-black/40 cursor-pointer hover:scale-115 hover:z-20 transition-transform relative group focus:outline-none"
                  title={`${m.name} · ${m.nightsTogether || 1} ${isEs ? 'noches juntos' : 'nights together'}`}
                  aria-label={`Ver vínculo social con ${m.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                    alt={m.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {partyMembers.length > 7 && (
                <div className="pl-3">
                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-sm">
                    +{partyMembers.length - 7}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* LOWER CONTENT AREA: Warm Ivory Sheet                           */}
        {/* ============================================================== */}
        <div className="relative -mt-6 md:-mt-8 z-20 rounded-t-[34px] md:rounded-none bg-[#F7F2E8] dark:bg-[#12110E] md:bg-transparent px-4 sm:px-6 md:px-0 pt-0 pb-20 shadow-[0_-12px_40px_rgba(65,48,25,0.08)] md:shadow-none transition-colors duration-200">
          {/* Quick actions */}
          <nav
            aria-label="Herramientas de la fiesta"
            className="relative -top-8 md:-top-10 h-[86px] sm:h-[90px] md:h-[96px] max-w-md sm:max-w-lg md:max-w-2xl mx-auto grid grid-cols-4 gap-2 p-2 sm:p-2.5 rounded-[36px] transition-all select-none bg-[rgba(250,248,243,0.78)] dark:bg-[rgba(28,25,22,0.88)] border border-white/90 dark:border-white/15 shadow-[0_10px_25px_rgba(71,55,35,0.12)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            {quickActions.map((action) => {
              const Icon = action.icon;
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
                      : {
                          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.48)',
                          boxShadow:
                            theme === 'dark'
                              ? '0 3px 9px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                              : '0 3px 9px rgba(74, 56, 35, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.92)',
                        }
                  }
                  className={`flex flex-col items-center justify-center gap-1 min-w-0 rounded-[26px] transition-all duration-200 cursor-pointer text-[#161514] dark:text-[#F5F1E8] ${
                    isHovered ? 'font-bold' : 'font-medium'
                  }`}
                  aria-label={action.label}
                >
                  <Icon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${isHovered ? 'stroke-[2.5]' : 'stroke-[2.2]'}`} />
                  <span className="text-[11px] sm:text-[12px] tracking-tight leading-none">
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </nav>

          {/* Desktop grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 lg:items-start -mt-5 lg:mt-0">
            {/* Party Pot Summary Card (Directly below Quick Actions on mobile, right column on desktop) */}
            <article
              aria-label={isEs ? 'Bote de la fiesta' : 'Party Pot'}
              className="lg:col-span-5 xl:col-span-4 lg:col-start-8 xl:col-start-9 lg:row-start-1 min-h-[108px] sm:min-h-[118px] grid grid-cols-[48px_1fr_auto] sm:grid-cols-[58px_1fr_auto] items-center gap-3 sm:gap-3.5 p-3.5 sm:p-4 rounded-[32px] transition-all bg-white/50 dark:bg-[#1C1A16] border border-white/75 dark:border-white/10 shadow-[0_9px_20px_rgba(66,52,32,0.09)] dark:shadow-[0_9px_20px_rgba(0,0,0,0.45)] backdrop-blur-md"
            >
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-[#24201c] dark:text-[#F0DC00] bg-[#EEE9E1] dark:bg-white/10 shadow-inner shrink-0 cursor-pointer"
              onClick={() => setCurrentView('party-pot')}
              aria-hidden="true"
            >
              <Coins className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.35]" />
            </div>
            <div
              className="min-w-0 cursor-pointer"
              onClick={() => setCurrentView('party-pot')}
            >
              <span className="text-xs sm:text-[14px] font-medium text-[#161514] dark:text-white tracking-tight block leading-none">
                {isEs ? 'Bote de la fiesta' : 'Party Pot'}
              </span>
              <div className="flex items-center gap-1.5 mt-1 mb-0.5">
                <span className="font-display font-black text-xl sm:text-[26px] text-[#161514] dark:text-white tracking-tight leading-none">
                  {(party?.potBalance ?? 0).toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-[#836EF9] bg-[#836EF9]/10 dark:bg-[#836EF9]/20 px-1.5 py-0.5 rounded-full">
                  MON
                </span>
                {monPrice && (
                  <span className="text-[11px] font-mono font-medium text-[#706B66] dark:text-[#A8A196]">
                    (≈ ${((party?.potBalance ?? 0) * monPrice).toFixed(2)} USD)
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs text-[#706B66] dark:text-[#A8A196] font-medium tracking-tight block truncate">
                {isEs ? 'Tesoreria onchain en Monad Testnet' : 'Onchain treasury on Monad Testnet'}
              </span>
            </div>

            {/* Add Button with Yellow Gradient & Black Plus Badge */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPotSheetOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 rounded-full py-2 sm:py-2.5 px-3.5 sm:px-4 text-[#1B1915] text-xs sm:text-sm font-bold shadow-[0_5px_12px_rgba(213,163,0,0.25)] cursor-pointer shrink-0"
              style={{
                background: 'linear-gradient(135deg, #FFE967, #FFCF1E)',
              }}
              aria-label={isEs ? 'Añadir dinero al bote' : 'Add money to party pot'}
            >
              <div className="w-4 h-4 rounded-full bg-[#191714] text-white flex items-center justify-center p-0.5">
                <Plus className="w-2.5 h-2.5 stroke-[3] text-white" />
              </div>
              <span>{isEs ? 'Añadir' : 'Add'}</span>
            </motion.button>
          </article>

          {/* Activity feed */}
          <section className="mt-6 lg:mt-0 lg:col-span-7 xl:col-span-8 lg:col-start-1 lg:row-start-1">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-display font-extrabold text-base text-[#171512] dark:text-white tracking-tight">
                {isEs ? 'Actividad en vivo' : 'Live activity'}
              </h3>
              <button
                onClick={() => {
                  setActiveTab('activity');
                  setCurrentView('home');
                }}
                className="text-xs font-semibold text-[#8E887E] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>{isEs ? 'Ver todo' : 'See all'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clean Activity Rows directly on warm cream background */}
            <div className="space-y-1">
              {partyActivities.length > 0 ? (
                partyActivities.slice(0, 5).map((act) => {
                  const getBadge = (type: string) => {
                    switch (type) {
                      case 'pot':
                        return { bg: 'bg-[#F0DC00]', text: 'text-[#171512]', icon: '💰' };
                      case 'game':
                        return { bg: 'bg-purple-500', text: 'text-white', icon: '🎮' };
                      case 'poll':
                        return { bg: 'bg-blue-500', text: 'text-white', icon: '📊' };
                      case 'join':
                        return { bg: 'bg-emerald-500', text: 'text-white', icon: '👤' };
                      case 'expense':
                        return { bg: 'bg-amber-500', text: 'text-white', icon: '🧾' };
                      default:
                        return { bg: 'bg-[#F0DC00]', text: 'text-[#171512]', icon: '✨' };
                    }
                  };
                  const badge = getBadge(act.type);

                  return (
                    <div
                      key={act.id}
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0 w-10 h-10">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-black/20 flex items-center justify-center">
                            {act.avatar ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={act.avatar}
                                alt="User"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#F0DC00]/30 text-[#171512] dark:text-white flex items-center justify-center font-display font-black text-sm">
                                P
                              </div>
                            )}
                          </div>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${badge.bg} ${badge.text} text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-[#1C1A16] shadow-sm`}
                          >
                            {badge.icon}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-[#171512] dark:text-[#F5F1E8] truncate font-medium">
                          {act.text}
                        </p>
                      </div>
                      <span className="text-[11px] text-[#8E887E] dark:text-[#A8A196] font-medium shrink-0 ml-2">
                        {act.time}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] text-center text-xs text-[#8E887E] dark:text-[#A8A196]">
                  {isEs
                    ? 'Sin actividad reciente todavía. ¡Sé el primero en aportar o jugar!'
                    : 'No recent activity yet. Be the first to contribute or play!'}
                </div>
              )}
            </div>
          </section>

          {/* Memories */}
          <section className="mt-8 lg:mt-6 lg:col-span-7 xl:col-span-8 lg:col-start-1 lg:row-start-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-display font-extrabold text-base text-[#171512] tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F0DC00]" />
                <span>{isEs ? 'Álbum compartido' : 'Shared album'}</span>
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-1 px-3 rounded-full bg-[#F0DC00]/20 hover:bg-[#F0DC00]/30 text-[#171512] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isEs ? 'Subir foto' : 'Add photo'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {(partyMemories.length > 0 ? partyMemories : [
                { id: '1', imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80' },
                { id: '2', imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=400&q=80' },
                { id: '3', imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80' }
              ]).slice(0, 6).map((mem, i) => (
                <div
                  key={mem.id || i}
                  onClick={() => setSelectedPhoto(mem as PartyMemory)}
                  className="h-24 sm:h-28 rounded-2xl overflow-hidden border border-black/10 shadow-sm cursor-pointer hover:scale-102 transition-transform relative group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mem.imageUrl} alt="Memory" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </section>

          {/* Desktop-only Games & Polls Shortcuts */}
          <section className="hidden lg:block lg:col-span-5 xl:col-span-4 lg:col-start-8 xl:col-start-9 lg:row-start-2 lg:mt-6 space-y-4">
            <div className="rounded-[28px] p-5 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/[0.07] dark:border-white/10 shadow-[0_4px_20px_rgba(40,30,20,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display font-bold text-sm text-[#171512] dark:text-white">
                  {isEs ? 'Mini-juegos en vivo' : 'Live Party Games'}
                </h4>
                <button
                  onClick={() => setCurrentView('games')}
                  className="text-xs font-bold text-[#836EF9] hover:underline cursor-pointer"
                >
                  {isEs ? 'Jugar' : 'Play'}
                </button>
              </div>
              <div
                onClick={() => setCurrentView('games')}
                className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎲</span>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">Who&apos;s Most Likely</span>
                    <span className="text-[10px] text-[#6F6A62] dark:text-[#A8A196]">
                      {isEs ? '4 participantes activos' : '4 active players'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E887E]" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

      {/* ============================================================== */}
      {/* PHONE 3: ADD TO THE PARTY POT BOTTOM SHEET                     */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isPotSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPotSheetOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-[10px]"
            />

            {/* Bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-md bg-[#FFFDF8] dark:bg-[#1C1A16] rounded-t-[36px] sm:rounded-[36px] p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_-14px_70px_rgba(62,43,21,0.18)] dark:shadow-[0_-14px_70px_rgba(0,0,0,0.6)] border border-white/85 dark:border-white/15 safe-bottom transition-colors duration-200"
            >
              {/* Drag Handle */}
              <div className="w-9 h-1.5 rounded-full bg-[#504437]/25 dark:bg-white/20 mb-4 shrink-0 sm:hidden" />

              {/* Close Button top-right */}
              <button
                onClick={() => setIsPotSheetOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white border border-white/60 dark:border-white/10 active:scale-90 transition-transform cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* MON Circle Icon */}
              <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center border border-white/80 dark:border-white/15 shadow-sm mb-3">
                <TokenLogo token="mon" size="lg" />
              </div>

              {/* Title & Editorial Subtitle */}
              <h3 className="font-display font-black text-2xl text-[#171512] dark:text-white tracking-tight">
                {isEs ? 'Aportar al Pozo de la Fiesta' : 'Add to the Party Pot'}
              </h3>
              <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] max-w-xs mt-1 mb-6 leading-relaxed">
                {isEs
                  ? 'Ayuda a cubrir bebidas, snacks y todo lo que haga que esta noche sea legendaria.'
                  : 'Help cover drinks, snacks and whatever makes tonight legendary.'}
              </p>

              {/* Amount Stepper (- 0.5 MON +) */}
              <div className="flex flex-col items-center justify-center mb-6 w-full">
                <div className="flex items-center justify-center gap-6">
                  {/* Minus Button */}
                  <button
                    type="button"
                    onClick={() => setPotAmount((prev) => Math.max(0.05, Number((prev - 0.1).toFixed(2))))}
                    className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 flex items-center justify-center text-2xl font-bold text-[#171512] dark:text-white active:scale-90 transition-transform cursor-pointer"
                  >
                    <Minus className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  {/* Amount Value */}
                  <div className="flex items-baseline gap-1.5 select-none">
                    <span className="font-display font-extrabold text-5xl sm:text-6xl text-[#171512] dark:text-white tracking-tight">
                      {potAmount}
                    </span>
                    <span className="font-display font-bold text-xl text-[#836EF9]">
                      MON
                    </span>
                  </div>

                  {/* Plus Button */}
                  <button
                    type="button"
                    onClick={() => setPotAmount((prev) => Number((prev + 0.1).toFixed(2)))}
                    className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 flex items-center justify-center text-2xl font-bold text-[#171512] dark:text-white active:scale-90 transition-transform cursor-pointer"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>

                {monPrice !== null && (
                  <span className="text-xs font-mono font-semibold text-[#6F6A62] dark:text-[#A8A196] mt-2">
                    ≈ ${(potAmount * monPrice).toFixed(2)} USD
                  </span>
                )}
              </div>

              {/* Preset Amounts Pills (0.1, 0.25, 0.5, 1.0 MON) */}
              <div className="grid grid-cols-4 gap-2.5 w-full mb-6">
                {[0.1, 0.25, 0.5, 1.0].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPotAmount(preset)}
                    className={`py-2 rounded-full text-xs font-display font-bold transition-all cursor-pointer ${
                      potAmount === preset
                        ? 'bg-[#F0DC00] text-[#171512] shadow-sm scale-102 font-extrabold'
                        : 'bg-black/5 dark:bg-white/10 text-[#171512] dark:text-white border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/15'
                    }`}
                  >
                    {preset} MON
                  </button>
                ))}
              </div>

              {/* Payment Source Selection Row (MON · Monad Testnet) */}
              <div className="w-full p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 flex items-center justify-between mb-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <TokenLogo token="mon" size="md" />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-xs text-[#171512] dark:text-white block">
                        MON nativo · Monad Testnet
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#836EF9]/15 text-[#674FF4] font-bold">
                        10143
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6F6A62] dark:text-[#A8A196] font-medium block">
                      {isEs ? 'Gas patrocinado · Monad Treasury' : 'Sponsored gas · Monad Treasury'}
                    </span>
                  </div>
                </div>
                <CryptoBadge token="mon" network="Monad" showNetwork={false} />
              </div>

              {/* User Connected Wallet Status Card */}
              {activeWallet ? (
                <div className="w-full p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/10 mb-4 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6F6A62] dark:text-[#A8A196]">
                      {isEs ? 'Firmando con tu billetera:' : 'Signing with your wallet:'}
                    </span>
                    <span className="font-mono font-bold text-[#171512] dark:text-white">
                      {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-black/[0.04] dark:border-white/[0.06]">
                    <span className="text-[#6F6A62] dark:text-[#A8A196]">
                      {isEs ? 'Saldo en tu wallet:' : 'Wallet balance:'}
                    </span>
                    <span className="font-mono font-bold text-[#836EF9]">
                      {userBalance !== null ? `${Number(userBalance).toFixed(4)} MON` : '...'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 text-xs text-amber-700 dark:text-amber-300 text-left">
                  {isEs
                    ? 'Inicia sesión con Privy para conectar tu billetera y firmar tus propios aportes.'
                    : 'Log in with Privy to connect your wallet and sign your own deposits.'}
                </div>
              )}

              {/* Insufficient User Balance Banner with Faucet and Demo Sponsor */}
              {userBalance !== null && Number(userBalance) < potAmount && (
                <div className="w-full p-3.5 mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs text-left leading-relaxed">
                  <p className="font-bold mb-1">
                    {isEs
                      ? `Saldo insuficiente en tu wallet (${Number(userBalance).toFixed(4)} MON)`
                      : `Insufficient balance in your wallet (${Number(userBalance).toFixed(4)} MON)`}
                  </p>
                  <p className="text-[11px] opacity-80 mb-3">
                    {isEs
                      ? 'Para firmar con tus propios fondos necesitas MON de prueba en Monad Testnet.'
                      : 'To sign with your own funds you need testnet MON on Monad.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeWallet?.address) {
                          navigator.clipboard.writeText(activeWallet.address);
                          alert(isEs ? 'Dirección copiada para el Faucet de Monad' : 'Address copied for Monad Faucet');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{isEs ? 'Copiar Dirección Faucet' : 'Copy Faucet Address'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSponsoredDemoDeposit}
                      disabled={isPotSubmitting}
                      className="px-3 py-1.5 rounded-xl bg-[#836EF9]/20 hover:bg-[#836EF9]/30 text-[#674FF4] dark:text-[#A78BFA] text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      {isEs ? 'Usar Faucet Demo (Patrocinado)' : 'Use Demo Faucet Sponsor'}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert Banner */}
              {potError && (
                <div className="w-full p-3 mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs text-left leading-relaxed">
                  <strong className="block mb-0.5">{isEs ? 'Error en la transacción:' : 'Transaction error:'}</strong>
                  {potError}
                </div>
              )}

              {/* Primary Yellow CTA Button */}
              <button
                type="button"
                onClick={handleAddToPot}
                disabled={isPotSubmitting}
                className="w-full py-4 rounded-[22px] bg-[#F0DC00] hover:bg-[#E6D300] active:scale-98 text-[#171512] font-display font-extrabold text-base shadow-[0_8px_24px_rgba(240,220,0,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isPotSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#171512]" />
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    <span>{isEs ? 'Aportar al pozo' : 'Add to pot'}</span>
                  </>
                )}
              </button>

              {/* Micro-copy footer */}
              <p className="text-[11px] text-[#6F6A62] dark:text-[#A8A196] mt-3 font-medium">
                {isEs ? 'Reparto justo. Más noches juntos. 🎉' : 'Split fairly. More nights together. 🎉'}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Social & Viral Modals */}
      <PartyInviteModal
        party={party}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      <SharedExperienceModal
        member={selectedMember}
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
      />

      {/* Lightbox Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative w-full max-w-lg rounded-3xl overflow-hidden border border-white/20 bg-black/80 shadow-2xl z-10"
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="max-h-[70vh] overflow-hidden bg-black flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.caption || 'Party memory'}
                  className="w-full h-full object-contain max-h-[70vh]"
                />
              </div>
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  {selectedPhoto.caption && (
                    <p className="text-sm font-bold text-white mb-1">
                      {selectedPhoto.caption}
                    </p>
                  )}
                  <span className="text-xs text-white/50">
                    {language === 'es' ? 'Subido por' : 'Uploaded by'}{' '}
                    <strong className="text-white">{selectedPhoto.uploadedByName}</strong> ·{' '}
                    {selectedPhoto.createdAt}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Memory Modal */}
      <AnimatePresence>
        {isUploadModalOpen && previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isUploading) {
                  setIsUploadModalOpen(false);
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative w-full max-w-sm rounded-[28px] liquid-glass-card border border-white/20 p-5 shadow-2xl text-white z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-black text-base uppercase tracking-wider text-white">
                  {t.partyDetail.uploadMemory}
                </h3>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmUpload} className="space-y-4">
                <div className="h-48 rounded-2xl overflow-hidden border border-white/15 bg-black/50 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-white/60 uppercase block mb-1.5">
                    {language === 'es' ? 'Descripción o pie de foto (opcional)' : 'Caption (optional)'}
                  </label>
                  <input
                    type="text"
                    value={captionInput}
                    onChange={(e) => setCaptionInput(e.target.value)}
                    placeholder={
                      language === 'es'
                        ? 'Ej: El mejor momento de la noche...'
                        : 'E.g., Peak party vibes...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-[#F0DC00]"
                    disabled={isUploading}
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <GlassButton
                    type="button"
                    variant="glass"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                  >
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    variant="accent"
                    size="sm"
                    disabled={isUploading}
                    icon={
                      isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5 text-black" />
                      )
                    }
                  >
                    {isUploading
                      ? language === 'es'
                        ? 'Subiendo...'
                        : 'Uploading...'
                      : language === 'es'
                      ? 'Publicar Foto'
                      : 'Post Photo'}
                  </GlassButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
