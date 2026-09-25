'use client';

import React, { useState } from 'react';
import {
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  Award,
  Landmark,
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassButton } from '@/components/ui/GlassButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LiquidBlob } from '@/components/ui/LiquidBlob';
import { TokenLogo, CryptoBadge } from '@/components/ui/TokenLogo';
import { PartyTasksBoard } from '@/components/party/PartyTasksBoard';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { MONAD_CONTRACT_ADDRESSES } from '@/contracts';
import confetti from 'canvas-confetti';

export const PartyPotView: React.FC = () => {
  const { parties, currentPartyId, crews, transactions, addToPot, spendFromPot, rolloverPotToCrew } =
    usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';
  const defaultParty = parties[0];
  const party = parties.find((p) => p.id === currentPartyId) || parties[0] || defaultParty;
  const partyTransactions = transactions.filter((t) => t.partyId === party?.id);

  const associatedCrew = crews.find((c) => c.id === party?.crewId);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSpendOpen, setIsSpendOpen] = useState(false);
  const [isRewardOpen, setIsRewardOpen] = useState(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);

  const [addAmount, setAddAmount] = useState('20');
  const [spendAmount, setSpendAmount] = useState('15');
  const [spendDesc, setSpendDesc] = useState('');
  const [rewardRecipient, setRewardRecipient] = useState(party.members[1]?.name || 'Ana');
  const [rewardRole, setRewardRole] = useState('OFFICIAL_DJ');
  const [rewardAmount, setRewardAmount] = useState('10');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Filter state for transactions
  const [txFilter, setTxFilter] = useState<'all' | 'add' | 'spend' | 'reward' | 'rollover'>('all');

  const filteredTransactions =
    txFilter === 'all'
      ? partyTransactions
      : partyTransactions.filter((t) => t.type === txFilter);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    try {
      const res = await addToPot(party.id, amount, `Deposit into party pot (${amount} USDC on Monad)`);
      if (res.receipt?.txHash) {
        setLastTxHash(res.receipt.txHash);
      }
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2775CA', '#836EF9', '#F0DC00'],
      });
      setIsAddOpen(false);
    } catch (err) {
      console.error('Error adding funds to pot:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(spendAmount);
    if (isNaN(amount) || amount <= 0 || !spendDesc.trim()) return;

    setIsProcessing(true);
    try {
      const res = await spendFromPot(party.id, amount, spendDesc.trim());
      if (res.receipt?.txHash) {
        setLastTxHash(res.receipt.txHash);
      }
      setIsSpendOpen(false);
      setSpendDesc('');
    } catch (err) {
      console.error('Error spending from pot:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDistributeReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(rewardAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    try {
      const res = await spendFromPot(
        party.id,
        amount,
        `Reward: ${rewardRole} for ${rewardRecipient}`
      );
      if (res.receipt?.txHash) {
        setLastTxHash(res.receipt.txHash);
      }
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#2775CA'],
      });
      setIsRewardOpen(false);
    } catch (err) {
      console.error('Error distributing reward:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRolloverConfirm = async () => {
    if (!associatedCrew || party.potBalance <= 0) return;
    setIsProcessing(true);
    try {
      const res = await rolloverPotToCrew(party.id, associatedCrew.id);
      if (res.receipt?.txHash) {
        setLastTxHash(res.receipt.txHash);
      }
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
      setIsRolloverOpen(false);
    } catch (err) {
      console.error('Error rolling over pot:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#171512] pb-32 select-none">
      <TopNav title={isEs ? 'TESORERÍA COMPARTIDA' : 'SHARED TREASURY'} />

      <main className="px-4 sm:px-6 md:px-8 max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto pt-2 w-full">
        {/* Monad Testnet Onchain Treasury Status Banner */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#836EF9]/30 bg-gradient-to-r from-[#836EF9]/10 via-[#2775CA]/10 to-transparent p-3.5 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-2.5">
            <TokenLogo token="usdc" size="md" />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#171512] dark:text-white">
                <span>USDC Treasury · Monad Testnet</span>
                <span className="px-2 py-0.5 rounded-full bg-[#836EF9]/15 text-[#674FF4] dark:text-[#C4B5FD] text-[10px] font-mono font-bold">
                  Chain 10143
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Live
                </span>
              </div>
              <span className="text-[11px] text-[#635B50] dark:text-[#A8A196]">
                {isEs
                  ? 'Gas 100% patrocinado y confirmaciones en ~400ms'
                  : '100% gas sponsored with ~400ms sub-second finality'}
              </span>
            </div>
          </div>
          <a
            href={`https://testnet.monadexplorer.com/address/${MONAD_CONTRACT_ADDRESSES.partyTreasury}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#674FF4] hover:underline"
          >
            <span>{isEs ? 'Explorador Monad' : 'Monad Explorer'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Real-time Monad Transaction Confirmation Toast */}
        {lastTxHash && (
          <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isEs ? 'Transacción confirmada en Monad Testnet' : 'Transaction confirmed on Monad Testnet'}</span>
            </div>
            <a
              href={`https://testnet.monadexplorer.com/tx/${lastTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline font-bold flex items-center gap-1 text-[#674FF4]"
            >
              <span>{lastTxHash.slice(0, 10)}...</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Editorial Header */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(35,30,22,0.08)] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#B89600]">
                {isEs ? 'POZO DEL GRUPO' : 'PARTY POT'}
              </span>
              <CryptoBadge token="usdc" network="Monad" />
            </div>
            <h2 className="font-bubble text-4xl sm:text-6xl text-[#171512] tracking-tight leading-none">
              PARTY POT
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <GlassButton
              variant="accent"
              size="md"
              onClick={() => setIsAddOpen(true)}
              icon={<Plus className="w-4 h-4 text-[#171512] stroke-[3]" />}
            >
              {isEs ? 'Aportar USDC' : 'Add USDC'}
            </GlassButton>

            <GlassButton
              variant="glass"
              size="md"
              onClick={() => setIsRewardOpen(true)}
              icon={<Award className="w-4 h-4 text-[#171512]" />}
            >
              {isEs ? 'Recompensa' : 'Reward'}
            </GlassButton>

            <GlassButton
              variant="glass"
              size="md"
              onClick={() => setIsSpendOpen(true)}
              icon={<Minus className="w-4 h-4 text-[#171512]" />}
            >
              {isEs ? 'Gasto' : 'Spend'}
            </GlassButton>

            {associatedCrew && (
              <GlassButton
                variant="glass"
                size="md"
                disabled={party.potBalance <= 0}
                onClick={() => setIsRolloverOpen(true)}
                icon={<Landmark className="w-4 h-4 text-[#171512]" />}
              >
                {isEs ? 'Transferir a Crew' : 'Transfer to Crew'}
              </GlassButton>
            )}
          </div>
        </div>

        {/* Multi-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Liquid Blob + Quick Actions (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            {/* Interactive sphere */}
            <div className="relative my-2 w-full flex justify-center">
              <LiquidBlob balance={party.potBalance} />

              {/* Balance Overlay over sphere */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex items-center justify-center drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
                  <span className="font-bubble text-5xl sm:text-6xl text-white tracking-tight">
                    ${party.potBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black text-white tracking-wide border border-white/30">
                    USDC
                  </span>
                  <span className="text-[11px] font-bold text-white/90">
                    · Monad Testnet
                  </span>
                </div>
                <span className="text-xs font-semibold text-white/80 mt-1 drop-shadow-md">
                  {isEs ? `${party.members.length} participantes` : `${party.members.length} participants`}
                </span>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="grid sm:hidden grid-cols-3 gap-2.5 w-full my-4">
              <GlassButton
                variant="accent"
                size="md"
                onClick={() => setIsAddOpen(true)}
                icon={<Plus className="w-4 h-4 text-[#171512] stroke-[3]" />}
              >
                {isEs ? 'Aportar' : 'Add'}
              </GlassButton>

              <GlassButton
                variant="glass"
                size="md"
                onClick={() => setIsRewardOpen(true)}
                icon={<Award className="w-4 h-4 text-[#171512]" />}
              >
                {isEs ? 'Premio' : 'Reward'}
              </GlassButton>

              <GlassButton
                variant="glass"
                size="md"
                onClick={() => setIsSpendOpen(true)}
                icon={<Minus className="w-4 h-4 text-[#171512]" />}
              >
                {isEs ? 'Gasto' : 'Spend'}
              </GlassButton>
            </div>

            {/* Mobile Rollover Button if Crew Associated */}
            {associatedCrew && (
              <div className="w-full sm:hidden mb-4">
                <GlassButton
                  variant="glass"
                  size="md"
                  fullWidth
                  disabled={party.potBalance <= 0}
                  onClick={() => setIsRolloverOpen(true)}
                  icon={<Landmark className="w-4 h-4 text-[#171512]" />}
                >
                  {isEs ? `Transferir a ${associatedCrew.name}` : `Transfer to ${associatedCrew.name}`}
                </GlassButton>
              </div>
            )}

            {/* Crew Treasury Link / Rollover Banner */}
            {associatedCrew && (
              <div className="w-full p-4 rounded-3xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_4px_20px_rgba(40,30,20,0.04)] mt-2 sm:mt-4 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#B89600] tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" />
                    {isEs ? 'SALDO DEL GRUPO (CREW)' : 'CREW TREASURY'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <TokenLogo token="usdc" size="xs" />
                    <span className="font-mono text-xs font-bold text-[#171512]">
                      ${(associatedCrew.treasuryBalance ?? 0).toFixed(2)} USDC
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#6F6A62] leading-relaxed">
                  {isEs ? 'Fondo soberano de ' : 'Sovereign group treasury for '}
                  <span className="text-[#171512] font-bold">{associatedCrew.name}</span>.
                  {isEs
                    ? ' Los fondos restantes se trasladan a la próxima fiesta.'
                    : ' Leftover pot balances carry over to future gatherings.'}
                </p>
                {party.potBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsRolloverOpen(true)}
                    className="mt-3 w-full py-2.5 px-3 rounded-2xl bg-[#FFF5C0] hover:bg-[#FCECA0] text-[#171512] text-xs font-bold flex items-center justify-center gap-2 border border-[#F0DC00]/50 transition-all cursor-pointer shadow-xs"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#B89600]" />
                    {isEs
                      ? `Transferir $${party.potBalance.toFixed(2)} USDC a la Crew`
                      : `Transfer $${party.potBalance.toFixed(2)} USDC to Crew`}
                  </button>
                )}
              </div>
            )}

            {/* Monad Smart Contract Card */}
            <div className="w-full p-4 rounded-3xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-[0_4px_20px_rgba(40,30,20,0.04)] mt-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#B89600] tracking-wider block">
                  CONTRATO INTELIGENTE (MONAD)
                </span>
                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {isEs ? 'Auditado' : 'Audited'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between bg-black/[0.03] p-2 rounded-xl border border-black/5">
                <span className="font-mono text-[11px] text-[#595247] truncate max-w-[190px]">
                  {MONAD_CONTRACT_ADDRESSES.partyTreasury}
                </span>
                <a
                  href={`https://testnet.monadexplorer.com/address/${MONAD_CONTRACT_ADDRESSES.partyTreasury}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#674FF4] font-bold hover:underline flex items-center gap-0.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[rgba(35,30,22,0.06)] text-[11px] text-[#8E887E]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isEs ? 'Verificable en cadena' : 'Verifiable onchain'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Verified Ledger Feed (7 cols on desktop) */}
          <div className="lg:col-span-7 w-full text-left space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: `${isEs ? 'Todos' : 'All'} (${partyTransactions.length})` },
                { id: 'add', label: isEs ? 'Aportes' : 'Deposits' },
                { id: 'spend', label: isEs ? 'Gastos' : 'Deductions' },
                { id: 'reward', label: isEs ? 'Premios' : 'Rewards' },
                { id: 'rollover', label: 'Rollover' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTxFilter(tab.id as typeof txFilter)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    txFilter === tab.id
                      ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
                      : 'bg-[#FFFDF8] text-[#6F6A62] hover:text-[#171512] border border-[rgba(35,30,22,0.08)] shadow-xs'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6F6A62] block">
                  {isEs ? 'MOVIMIENTOS EN MONAD' : 'MONAD POT TRANSACTIONS'}
                </span>
                <span className="text-xs text-[#8E887E]">
                  {isEs ? 'Liquidación instantánea en USDC' : 'Instant settlement in USDC'}
                </span>
              </div>
              <span className="text-xs text-[#8C7300] font-mono font-bold">
                {filteredTransactions.length} {isEs ? 'registros' : 'records'}
              </span>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const isAdd = tx.type === 'add';
                  const isRollover = tx.type === 'rollover';
                  const isReward = tx.type === 'reward';

                  return (
                    <div
                      key={tx.id}
                      className="p-4 sm:p-5 flex items-center justify-between bg-[#FFFDF8] border border-[rgba(35,30,22,0.07)] rounded-[20px] shadow-[0_4px_16px_rgba(40,30,20,0.03)] hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
                            isRollover
                              ? 'bg-purple-50 text-purple-600 border-purple-200'
                              : isReward
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isAdd
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}
                        >
                          {isRollover ? (
                            <Landmark className="w-5 h-5" />
                          ) : isReward ? (
                            <Award className="w-5 h-5" />
                          ) : isAdd ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-base text-[#171512]">
                              {tx.userName}
                            </h4>
                            {isRollover && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                                Crew Rollover
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6F6A62]">{tx.description}</p>
                          <a
                            href={`https://testnet.monadexplorer.com/address/${MONAD_CONTRACT_ADDRESSES.partyTreasury}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-[#674FF4] hover:underline font-mono mt-0.5"
                          >
                            <span>Monad Tx</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          <TokenLogo token="usdc" size="xs" />
                          <span
                            className={`font-display font-black text-lg sm:text-xl ${
                              isAdd
                                ? 'text-emerald-700'
                                : isRollover
                                ? 'text-purple-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {isAdd ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                          </span>
                        </div>
                        <span className="block text-[10px] text-[#8E887E] uppercase font-mono font-bold">
                          USDC · Monad
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center rounded-3xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] shadow-sm">
                  <Landmark className="w-8 h-8 text-[#999187] mx-auto mb-2" />
                  <p className="text-xs text-[#6F6A62]">
                    {isEs ? 'No hay transacciones aún en esta categoría.' : 'No transactions in this category yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Social Bounties & Tasks Board */}
        <div className="mt-12 pt-8 border-t border-[rgba(35,30,22,0.08)]">
          <PartyTasksBoard partyId={party.id} />
        </div>
      </main>

      {/* BottomSheet: Add Money */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={isEs ? 'Aportar al Party Pot (USDC)' : 'Add to Party Pot (USDC)'}
      >
        <form onSubmit={handleAddFunds} className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#2775CA]/10 to-[#836EF9]/10 border border-[#2775CA]/20">
            <div className="flex items-center gap-2">
              <TokenLogo token="usdc" size="md" />
              <div>
                <span className="text-xs font-bold text-[#171512] block">USDC on Monad</span>
                <span className="text-[10px] text-[#635B50]">
                  {isEs ? 'Gas 100% patrocinado (Cero comisiones)' : '100% gas sponsored (Zero fees)'}
                </span>
              </div>
            </div>
            <CryptoBadge token="usdc" network="Monad" showNetwork={false} />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-2">
              {isEs ? 'Seleccionar monto rápido' : 'Select Preset Amount'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['10', '20', '50', '100'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAddAmount(preset)}
                  className={`py-3 rounded-2xl font-display font-black text-base transition-all cursor-pointer ${
                    addAmount === preset
                      ? 'bg-[#F0DC00] text-[#171512] shadow-md scale-105'
                      : 'bg-[#F7F2E8] text-[#171512] border border-[rgba(35,30,22,0.08)] hover:bg-[#EFE9DF]'
                  }`}
                >
                  +${preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
              {isEs ? 'Monto personalizado ($ USDC)' : 'Custom Amount ($ USDC)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#F7F2E8] text-[#171512] font-display font-black text-2xl outline-none border border-[rgba(35,30,22,0.1)] focus:border-[#F0DC00]"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <TokenLogo token="usdc" size="sm" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing
                ? isEs ? 'Procesando en Monad...' : 'Confirming on Monad...'
                : isEs ? `Aportar $${addAmount} USDC al Pot` : `Deposit $${addAmount} USDC to Pot`}
            </GlassButton>
          </div>
        </form>
      </BottomSheet>

      {/* BottomSheet: Reward Contributor */}
      <BottomSheet
        isOpen={isRewardOpen}
        onClose={() => setIsRewardOpen(false)}
        title={isEs ? 'Recompensar Contribuidor (USDC)' : 'Reward Social Contributor'}
      >
        <form onSubmit={handleDistributeReward} className="space-y-4">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-700" />
              <span className="text-xs font-bold text-amber-900">
                {isEs ? 'Recompensa social pagada del Pot' : 'Social reward paid from shared pot'}
              </span>
            </div>
            <CryptoBadge token="usdc" network="Monad" showNetwork={false} />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
              {isEs ? 'Contribuidor' : 'Contributor'}
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {party.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRewardRecipient(m.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    rewardRecipient === m.name
                      ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
                      : 'bg-[#F7F2E8] text-[#6F6A62] border border-[rgba(35,30,22,0.08)]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
              {isEs ? 'Rol o Aporte' : 'Contribution Role'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'OFFICIAL_DJ', label: '🎧 DJ MVP' },
                { id: 'ICE_RUNNER', label: '🧊 Ice & Lime' },
                { id: 'GAME_WINNER', label: '👑 Game Winner' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRewardRole(r.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    rewardRole === r.id
                      ? 'bg-[#FFF5C0] border border-[#F0DC00] text-[#171512] shadow-xs'
                      : 'bg-[#F7F2E8] text-[#6F6A62] border border-[rgba(35,30,22,0.08)]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
              {isEs ? 'Monto de Recompensa ($ USDC)' : 'Reward Amount ($ USDC)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#F7F2E8] text-[#171512] font-display font-black text-2xl outline-none border border-[rgba(35,30,22,0.1)] focus:border-[#F0DC00]"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <TokenLogo token="usdc" size="sm" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing
                ? isEs ? 'Enviando recompensa en Monad...' : 'Sending reward on Monad...'
                : isEs ? `Pagar $${rewardAmount} USDC a ${rewardRecipient}` : `Send $${rewardAmount} USDC to ${rewardRecipient}`}
            </GlassButton>
          </div>
        </form>
      </BottomSheet>

      {/* BottomSheet: Spend Money */}
      <BottomSheet
        isOpen={isSpendOpen}
        onClose={() => setIsSpendOpen(false)}
        title={isEs ? 'Registrar Gasto del Pot' : 'Spend from Pot'}
      >
        <form onSubmit={handleSpend} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
              {isEs ? '¿Qué se compró?' : 'What did you buy?'}
            </label>
            <input
              type="text"
              required
              placeholder={isEs ? 'Ej. Hielo extra, Tacos de medianoche...' : 'e.g. Extra Ice & Lime, Midnight tacos...'}
              value={spendDesc}
              onChange={(e) => setSpendDesc(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F2E8] text-[#171512] text-base font-semibold outline-none border border-[rgba(35,30,22,0.1)] focus:border-[#F0DC00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F6A62] mb-1.5">
              {isEs ? 'Monto deducido ($ USDC)' : 'Deduction Amount ($ USDC)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#F7F2E8] text-[#171512] font-display font-black text-2xl outline-none border border-[rgba(35,30,22,0.1)] focus:border-[#F0DC00]"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <TokenLogo token="usdc" size="sm" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing
                ? isEs ? 'Registrando en Monad...' : 'Registering on Monad...'
                : isEs ? `Deducir $${spendAmount} USDC del Pot` : `Deduct $${spendAmount} USDC from Pot`}
            </GlassButton>
          </div>
        </form>
      </BottomSheet>

      {/* BottomSheet: Rollover to Crew Treasury */}
      {associatedCrew && (
        <BottomSheet
          isOpen={isRolloverOpen}
          onClose={() => {
            if (!isProcessing) setIsRolloverOpen(false);
          }}
          title={isEs ? 'Trasladar Fondo a la Crew' : 'Rollover to Crew Treasury'}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-[#171512]">
                  {isEs ? 'Crew Destino' : 'Target Treasury'}
                </span>
              </div>
              <span className="text-xs font-black text-purple-900">
                {associatedCrew.name}
              </span>
            </div>

            <p className="text-xs text-[#6F6A62] leading-relaxed">
              {isEs
                ? 'El remanente de esta fiesta se transferirá de manera verificable al contrato de la Crew en Monad para la próxima reunión.'
                : 'Leftover funds will be transferred to the Crew treasury smart contract on Monad.'}
            </p>

            <div className="p-4 rounded-2xl bg-[#F7F2E8] border border-[rgba(35,30,22,0.08)] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6F6A62]">{isEs ? 'Saldo actual del Pot' : 'Current Party Pot'}</span>
                <span className="font-mono font-bold text-[#171512]">${party.potBalance.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6F6A62]">{isEs ? 'Tesorería Crew actual' : 'Current Crew Treasury'}</span>
                <span className="font-mono font-bold text-[#171512]">
                  ${(associatedCrew.treasuryBalance ?? 0).toFixed(2)} USDC
                </span>
              </div>
              <div className="pt-2 border-t border-[rgba(35,30,22,0.08)] flex justify-between items-center text-sm font-bold">
                <span className="text-[#8C7300]">{isEs ? 'Nuevo saldo de la Crew' : 'New Crew Treasury'}</span>
                <span className="font-mono text-base text-[#8C7300]">
                  ${((associatedCrew.treasuryBalance ?? 0) + party.potBalance).toFixed(2)} USDC
                </span>
              </div>
            </div>

            <div className="pt-2">
              <GlassButton
                variant="accent"
                size="lg"
                fullWidth
                disabled={isProcessing || party.potBalance <= 0}
                onClick={handleRolloverConfirm}
                icon={<Landmark className="w-4 h-4 text-[#171512]" />}
              >
                {isProcessing
                  ? isEs ? 'Transfiriendo en Monad...' : 'Transferring on Monad...'
                  : isEs
                  ? `Confirmar transferencia de $${party.potBalance.toFixed(2)} USDC`
                  : `Confirm transfer of $${party.potBalance.toFixed(2)} USDC`}
              </GlassButton>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
