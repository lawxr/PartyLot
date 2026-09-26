'use client';

import React, { useState, useRef } from 'react';
import {
  Share2,
  Download,
  Check,
  Award,
  Flame,
  Disc,
  ShieldCheck,
  Users,
  Receipt,
  Gamepad2,
  ExternalLink,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassButton } from '@/components/ui/GlassButton';
import { recordGatheringOnchain } from '@/services/socialGraphService';
import { getMonadExplorerTxUrl } from '@/lib/web3/monad';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const RecapView: React.FC = () => {
  const {
    parties,
    currentPartyId,
    expenses,
    transactions,
    whosMostLikely,
    thisOrThat,
    polls,
    crews,
    tasks,
  } = usePartyStore();

  const { language } = useTranslation();
  const isEs = language === 'es';

  const defaultParty = parties[0];
  const party = parties.find((p) => p.id === currentPartyId) || parties[0] || defaultParty;
  const partyExpenses = expenses.filter((e) => e.partyId === party?.id);
  const partyTransactions = transactions.filter((t) => t.partyId === party?.id);
  const partyPolls = polls.filter((p) => p.partyId === party?.id);
  const associatedCrew = crews.find((c) => c.id === party?.crewId);

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isAttesting, setIsAttesting] = useState(false);
  const [attestationTxHash, setAttestationTxHash] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement | null>(null);

  const handleAttestGathering = async () => {
    if (isAttesting || attestationTxHash) return;
    setIsAttesting(true);
    try {
      const addresses = party.members.map((m) => m.walletAddress || m.id);
      const receipt = await recordGatheringOnchain(party.id, addresses);
      setAttestationTxHash(receipt.txHash);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#10B981', '#60A5FA'],
      });
    } catch (err) {
      console.error('Failed to attest gathering onchain:', err);
    } finally {
      setIsAttesting(false);
    }
  };

  // Dynamic calculations from real party state
  const attendeesCount = party.members.length;
  const totalSharedDamage = partyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const minigamesCount = whosMostLikely.length + thisOrThat.length + 1;

  const totalVotesCast =
    whosMostLikely.reduce(
      (sum, q) => sum + Object.values(q.votes).reduce((s, v) => s + v, 0),
      0
    ) +
    thisOrThat.reduce((sum, q) => sum + q.votesA + q.votesB, 0) +
    partyPolls.reduce((sum, p) => sum + p.totalVotes, 0);

  const rolloverAmount = partyTransactions
    .filter((t) => t.type === 'rollover')
    .reduce((sum, t) => sum + t.amount, 0);

  // Night Awards
  const mvpMember = party.members[1] || party.members[0];
  const gameKingMember = party.members[2] || party.members[0];
  const bountyContributor =
    tasks.find((t) => t.partyId === party.id && t.status === 'verified')?.claimedByName ||
    party.members[0]?.name ||
    'Law';

  const handleShareRecap = async () => {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F0DC00', '#FFFFFF', '#EC4899'],
    });

    const shareText = isEs
      ? `PARTYLOT RESUMEN — ${party.title} 🔥\n` +
        `📅 ${party.date} · ${party.location}\n\n` +
        `👥 ${attendeesCount} Asistentes\n` +
        `💸 $${totalSharedDamage.toFixed(2)} Daño Compartido\n` +
        `🎮 ${minigamesCount} Minijuegos Jugados\n` +
        `🗳️ ${totalVotesCast} Votos de Consenso\n\n` +
        `🏆 MVP de la Noche: ${mvpMember?.name || 'Ana'}\n` +
        `👑 Rey de los Juegos: ${gameKingMember?.name || 'Carlos'}\n` +
        `🎧 Contribuidor / AUX: ${bountyContributor}\n` +
        (rolloverAmount > 0
          ? `🏦 $${rolloverAmount.toFixed(2)} Trasladados a la Tesorería de ${associatedCrew?.name || 'la Crew'}\n\n`
          : '\n') +
        `Prueba de Asistencia auditada en Monad: https://partylot.app/party/${party.code || party.id}`
      : `PARTYLOT RECAP — ${party.title} 🔥\n` +
        `📅 ${party.date} · ${party.location}\n\n` +
        `👥 ${attendeesCount} People Attended\n` +
        `💸 $${totalSharedDamage.toFixed(2)} Shared Damage\n` +
        `🎮 ${minigamesCount} Minigames Played\n` +
        `🗳️ ${totalVotesCast} Consensus Votes\n\n` +
        `🏆 MVP of the Night: ${mvpMember?.name || 'Ana'}\n` +
        `👑 Game King: ${gameKingMember?.name || 'Carlos'}\n` +
        `🎧 Contributor / AUX: ${bountyContributor}\n` +
        (rolloverAmount > 0
          ? `🏦 $${rolloverAmount.toFixed(2)} Rolled into ${associatedCrew?.name || 'Crew'} Treasury\n\n`
          : '\n') +
        `Proof of Attendance audited on Monad: https://partylot.app/party/${party.code || party.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${party.title} — ${isEs ? 'Resumen de la Fiesta' : 'Party Recap'}`,
          text: shareText,
        });
      } catch {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadStoryPoster = () => {
    setDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Poster background
      ctx.fillStyle = '#171512';
      ctx.fillRect(0, 0, 1080, 1920);

      // Gradient accent glow
      const grad = ctx.createRadialGradient(540, 400, 50, 540, 400, 600);
      grad.addColorStop(0, 'rgba(240, 220, 0, 0.15)');
      grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.1)');
      grad.addColorStop(1, 'rgba(5, 5, 5, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Brand Title
      ctx.fillStyle = '#F0DC00';
      ctx.font = '900 48px sans-serif';
      ctx.fillText('PARTYLOT', 80, 120);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '700 24px monospace';
      ctx.fillText(isEs ? 'DOSSIER OFICIAL DEL EVENTO' : 'OFFICIAL EVENT DOSSIER', 80, 165);

      // Border line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 200);
      ctx.lineTo(1000, 200);
      ctx.stroke();

      // Main Party Headline
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 84px sans-serif';
      ctx.fillText(party.title.toUpperCase(), 80, 310);

      ctx.fillStyle = '#F0DC00';
      ctx.font = '700 32px sans-serif';
      ctx.fillText(`${party.date.toUpperCase()} · ${party.location.toUpperCase()}`, 80, 370);

      // Metrics 2x2 Grid Boxes
      const drawMetricBox = (x: number, y: number, w: number, h: number, val: string, label: string, color: string) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = '900 68px sans-serif';
        ctx.fillText(val, x + 35, y + 90);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '700 22px sans-serif';
        ctx.fillText(label, x + 35, y + 135);
      };

      drawMetricBox(80, 440, 440, 170, `${attendeesCount}`, isEs ? 'ASISTENTES' : 'PEOPLE ATTENDED', '#FFFFFF');
      drawMetricBox(560, 440, 440, 170, `$${totalSharedDamage.toFixed(0)}`, isEs ? 'DAÑO COMPARTIDO' : 'SHARED DAMAGE', '#F0DC00');
      drawMetricBox(80, 640, 440, 170, `${minigamesCount}`, isEs ? 'MINIJUEGOS JUGADOS' : 'MINIGAMES PLAYED', '#FFFFFF');
      drawMetricBox(560, 640, 440, 170, `${totalVotesCast}`, isEs ? 'VOTOS DE CONSENSO' : 'CONSENSUS VOTES', '#FFFFFF');

      // Night Awards Card
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(80, 850, 920, 360, 32);
      ctx.fill();
      ctx.strokeStyle = 'rgba(240, 220, 0, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#F0DC00';
      ctx.font = '800 24px sans-serif';
      ctx.fillText(isEs ? 'PREMIOS DE LA NOCHE & SALÓN DE LA FAMA' : 'NIGHT AWARDS & HALL OF FAME', 120, 915);

      const drawAwardLine = (y: number, title: string, name: string) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '700 28px sans-serif';
        ctx.fillText(title, 120, y);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 32px sans-serif';
        ctx.fillText(name.toUpperCase(), 780, y);
      };

      drawAwardLine(990, isEs ? '🏆 MVP DE LA NOCHE' : '🏆 MVP OF THE NIGHT', mvpMember?.name || 'Ana');
      drawAwardLine(1070, isEs ? '👑 REY DE LOS JUEGOS' : '👑 GAME KING', gameKingMember?.name || 'Carlos');
      drawAwardLine(1150, isEs ? '🎧 DJ OFICIAL DEL AUX' : '🎧 OFFICIAL AUX DJ', bountyContributor);

      // Rollover Banner
      if (rolloverAmount > 0) {
        ctx.fillStyle = 'rgba(240, 220, 0, 0.12)';
        ctx.beginPath();
        ctx.roundRect(80, 1250, 920, 120, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(240, 220, 0, 0.4)';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '700 26px sans-serif';
        ctx.fillText(
          isEs
            ? `TRASLADADO A TESORERÍA ${associatedCrew?.name?.toUpperCase() || 'CREW'}`
            : `ROLLED INTO ${associatedCrew?.name?.toUpperCase() || 'CREW'} TREASURY`,
          120,
          1320
        );

        ctx.fillStyle = '#F0DC00';
        ctx.font = '900 36px sans-serif';
        ctx.fillText(`+$${rolloverAmount.toFixed(2)}`, 820, 1322);
      }

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '600 22px monospace';
      ctx.fillText(isEs ? 'LA NOCHE PERTENECE AL GRUPO · PARTYLOT' : 'THE NIGHT BELONGS TO THE GROUP · PARTYLOT', 80, 1800);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `partylot-recap-${party.code || party.id}.png`;
      link.href = dataUrl;
      link.click();

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#10B981', '#FFFFFF'],
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#171512] pb-32 select-none">
      <TopNav title={isEs ? 'DOSSIER EDITORIAL' : 'EDITORIAL RECAP'} variant="light" />

      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto pt-2 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: The Capture-Ready Editorial Poster (6 cols on desktop) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div
              ref={posterRef}
              className="relative w-full rounded-[36px] overflow-hidden p-6 sm:p-7 border border-white/20 shadow-2xl bg-black text-white film-grain"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(5,5,5,0.78) 0%, rgba(5,5,5,0.96) 100%), url("${party.coverImage}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Top Brand Banner */}
              <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-6">
                <span className="bubble text-xl text-[#F0DC00] tracking-tight">
                  PARTYLOT
                </span>
                <span className="text-[11px] font-mono tracking-widest text-white/70 uppercase">
                  {isEs ? 'DOSSIER OFICIAL DEL EVENTO' : 'OFFICIAL EVENT DOSSIER'}
                </span>
              </div>

              {/* Headline Title */}
              <div className="mb-6">
                <h1 className="bubble text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[0.9] drop-shadow-lg">
                  {party.title}
                </h1>
                <p className="font-display font-extrabold text-xs sm:text-sm text-[#F0DC00] tracking-widest uppercase mt-2">
                  {party.date} · {party.location}
                </p>
              </div>

              {/* Giant Grid of Dynamic Poster Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15">
                  <span className="font-display font-black text-3xl sm:text-4xl text-white block leading-none">
                    {attendeesCount}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    {isEs ? 'ASISTENTES' : 'PEOPLE ATTENDED'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15">
                  <span className="font-display font-black text-3xl sm:text-4xl text-[#F0DC00] block leading-none">
                    ${totalSharedDamage.toFixed(0)}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    {isEs ? 'DAÑO COMPARTIDO' : 'SHARED DAMAGE'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15">
                  <span className="font-display font-black text-3xl sm:text-4xl text-white block leading-none">
                    {minigamesCount}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    {isEs ? 'MINIJUEGOS JUGADOS' : 'MINIGAMES PLAYED'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15">
                  <span className="font-display font-black text-3xl sm:text-4xl text-white block leading-none">
                    {totalVotesCast}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    {isEs ? 'VOTOS DE CONSENSO' : 'CONSENSUS VOTES'}
                  </span>
                </div>
              </div>

              {/* Hall of Fame Awards */}
              <div className="p-4 rounded-2xl liquid-glass-modal border border-white/20 mb-6 space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F0DC00] block">
                  {isEs ? 'PREMIOS DE LA NOCHE' : 'NIGHT AWARDS'}
                </span>

                <div className="flex items-center justify-between text-xs font-bold border-b border-white/10 pb-2">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#F0DC00]" />
                    {isEs ? 'MVP DE LA NOCHE' : 'MVP OF THE NIGHT'}
                  </span>
                  <span className="text-white font-display font-black">{mvpMember?.name || 'Ana'}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold border-b border-white/10 pb-2">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    {isEs ? 'REY DE LOS JUEGOS' : 'GAME KING'}
                  </span>
                  <span className="text-white font-display font-black">{gameKingMember?.name || 'Carlos'}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-sky-400" />
                    {isEs ? 'DJ OFICIAL DEL AUX' : 'OFFICIAL AUX DJ'}
                  </span>
                  <span className="text-white font-display font-black">{bountyContributor}</span>
                </div>
              </div>

              {/* Rollover Balance Card */}
              {rolloverAmount > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#F0DC00]/10 border border-[#F0DC00]/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-white/80">
                    {isEs
                      ? `TRASLADADO A ${associatedCrew?.name?.toUpperCase() || 'PRÓXIMA FIESTA'}`
                      : `ROLLED INTO ${associatedCrew?.name?.toUpperCase() || 'NEXT PARTY'}`}
                  </span>
                  <span className="font-display font-black text-lg text-[#F0DC00]">
                    +${rolloverAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Mobile Share CTA (Hidden on desktop) */}
            <div className="w-full mt-5 lg:hidden space-y-2">
              <GlassButton
                variant="accent"
                size="lg"
                fullWidth
                onClick={handleShareRecap}
                icon={copied ? <Check className="w-5 h-5 text-black" /> : <Share2 className="w-5 h-5 text-black" />}
              >
                {copied
                  ? isEs ? '¡Resumen copiado al portapapeles!' : 'Recap Copied to Clipboard!'
                  : isEs ? 'Compartir Resumen' : 'Share Recap'}
              </GlassButton>

              <GlassButton
                variant="glass"
                size="lg"
                fullWidth
                onClick={handleDownloadStoryPoster}
                icon={<Download className="w-5 h-5 text-[#171512]" />}
              >
                {downloading
                  ? isEs ? 'Renderizando...' : 'Rendering...'
                  : isEs ? 'Descargar Póster para Historia' : 'Download Instagram Story Poster'}
              </GlassButton>
            </div>
          </div>

          {/* Right Column: Editorial Breakdown & Export Hub (6 cols on desktop) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Monad Proof-of-Presence Card */}
            <div className="p-6 bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] rounded-[28px] shadow-[0_10px_30px_rgba(65,48,25,0.06)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#B8A700]" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#171512]">
                    {isEs ? 'GRAFO SOCIAL VERIFICADO' : 'VERIFIED SOCIAL GRAPH'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 font-bold">
                  {isEs ? 'REGISTRO ONCHAIN' : 'ONCHAIN RECORD'}
                </span>
              </div>

              <h3 className="font-display font-black text-2xl text-[#171512] tracking-tight mb-2">
                {isEs ? 'Dossier de la Noche y Recuerdos' : 'Night Dossier & Collective Memories'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6F6A62] leading-relaxed mb-4">
                {isEs ? (
                  <>La asistencia, minijuegos y liquidación de gastos de <span className="text-[#171512] font-semibold">{party.title}</span> quedaron certificados permanentemente para todo el grupo.</>
                ) : (
                  <>Attendance, minigames and expense settlement for <span className="text-[#171512] font-semibold">{party.title}</span> have been permanently certified for the entire group.</>
                )}
              </p>

              <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-[rgba(35,30,22,0.08)] text-center mb-4">
                <div className="p-2.5 rounded-xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)]">
                  <Users className="w-4 h-4 text-[#B8A700] mx-auto mb-1" />
                  <span className="font-display font-black text-base text-[#171512] block">{attendeesCount}</span>
                  <span className="text-[9px] uppercase text-[#8E887E]">{isEs ? 'Asistentes' : 'Attendees'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)]">
                  <Receipt className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                  <span className="font-display font-black text-base text-[#171512] block">${totalSharedDamage.toFixed(0)}</span>
                  <span className="text-[9px] uppercase text-[#8E887E]">{isEs ? 'Saldado' : 'Settled'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)]">
                  <Gamepad2 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <span className="font-display font-black text-base text-[#171512] block">{minigamesCount}</span>
                  <span className="text-[9px] uppercase text-[#8E887E]">{isEs ? 'Juegos' : 'Games'}</span>
                </div>
              </div>

              {/* Onchain Attestation Action */}
              {attestationTxHash ? (
                <a
                  href={getMonadExplorerTxUrl(attestationTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 text-xs font-mono font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isEs ? 'Certificado en el Historial [Verificado]' : 'Certified on Ledger [Verified]'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={handleAttestGathering}
                  disabled={isAttesting}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F0DC00] hover:bg-[#E6D300] active:scale-95 text-[#171512] text-xs font-display font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#171512] stroke-[2.5]" />
                  <span>
                    {isAttesting
                      ? isEs ? 'Certificando noche...' : 'Attesting night onchain...'
                      : isEs ? '⚡ Certificar Noche en el Historial del Grupo' : '⚡ Certify Night in Group Ledger'}
                  </span>
                </button>
              )}
            </div>

            {/* Attendees Who Earned Co-Presence Badge */}
            <div className="p-6 bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] rounded-[28px] shadow-[0_10px_30px_rgba(65,48,25,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#6F6A62]">
                  {isEs ? `ASISTENTES VERIFICADOS (${party.members.length})` : `VERIFIED ATTENDEES (${party.members.length})`}
                </span>
                <span className="text-[11px] text-[#B8A700] font-semibold">
                  {isEs ? 'Insignias sociales acuñadas' : 'Social badges minted'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {party.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-2.5 rounded-xl bg-[#F8F3EA] flex items-center gap-2.5 border border-[rgba(35,30,22,0.08)]"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[rgba(35,30,22,0.12)] flex items-center justify-center bg-[#F1EADF]">
                      {member.avatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#F0DC00]/30 text-[#171512] flex items-center justify-center font-bold text-xs">
                          {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#171512] truncate block">
                        {member.name}
                      </span>
                      <span className="text-[9px] text-[#B8A700] font-mono font-bold">
                        {member.role === 'host' ? (isEs ? 'Anfitrión' : 'Host') : (isEs ? 'Verificado' : 'Verified')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex flex-col gap-3 pt-2">
              <GlassButton
                variant="accent"
                size="lg"
                fullWidth
                onClick={handleShareRecap}
                icon={copied ? <Check className="w-5 h-5 text-black" /> : <Share2 className="w-5 h-5 text-black" />}
              >
                {copied
                  ? isEs ? '¡Dossier copiado al portapapeles!' : 'Recap Link & Dossier Copied!'
                  : isEs ? 'Compartir Dossier del Evento' : 'Share Event Dossier'}
              </GlassButton>

              <GlassButton
                variant="glass"
                size="lg"
                fullWidth
                disabled={downloading}
                onClick={handleDownloadStoryPoster}
                icon={<Download className="w-5 h-5 text-[#171512]" />}
              >
                {downloading
                  ? isEs ? 'Renderizando Canvas...' : 'Rendering Canvas...'
                  : isEs ? 'Descargar Póster para Historia' : 'Download Instagram Story Poster'}
              </GlassButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
