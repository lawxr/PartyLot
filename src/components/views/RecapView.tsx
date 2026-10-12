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
import { Avatar } from '@/components/ui/Avatar';

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
    setCurrentView,
    goBack,
  } = usePartyStore();

  const { language } = useTranslation();
  const isEs = language === 'es';

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyExpenses = expenses.filter((e) => e.partyId === party?.id);
  const partyTransactions = transactions.filter((t) => t.partyId === party?.id);
  const partyPolls = polls.filter((p) => p.partyId === party?.id);
  const associatedCrew = crews.find((c) => c.id === party?.crewId);

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isAttesting, setIsAttesting] = useState(false);
  const [attestationTxHash, setAttestationTxHash] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement | null>(null);

  if (!party) {
    return (
      <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] flex flex-col items-center justify-center p-6 text-center transition-colors duration-200">
        <h2 className="font-display font-black text-2xl text-[#171512] dark:text-white mb-2">
          {isEs ? 'Sin fiesta seleccionada' : 'No Party Selected'}
        </h2>
        <p className="text-xs text-[#8E887E] dark:text-[#A8A196] max-w-xs mb-6 leading-relaxed">
          {isEs
            ? 'Selecciona una fiesta para ver su resumen y logros.'
            : 'Select a party to view its recap and highlights.'}
        </p>
        <button
          onClick={() => {
            if (goBack) goBack();
            else setCurrentView('home');
          }}
          className="accent-button px-6 py-3 rounded-full text-xs font-bold cursor-pointer"
        >
          {isEs ? 'Volver al Inicio' : 'Return Home'}
        </button>
      </div>
    );
  }

  const handleAttestGathering = async () => {
    if (isAttesting || attestationTxHash) return;
    setIsAttesting(true);
    try {
      const addresses = (party.members || []).map((m) => m.walletAddress || m.id);
      const receipt = await recordGatheringOnchain(party.id, addresses, {
        userAId: party.members[0]?.id,
        userBId: party.members[1]?.id || party.members[0]?.id,
        userAName: party.members[0]?.name,
        userBName: party.members[1]?.name || 'Crew Member',
      });
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
  const partyMembers = party.members || [];
  const attendeesCount = partyMembers.length;
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
  const mvpMember = partyMembers[1] || partyMembers[0];
  const gameKingMember = partyMembers[2] || partyMembers[0];
  const bountyContributor =
    tasks.find((t) => t.partyId === party.id && t.status === 'verified')?.claimedByName ||
    partyMembers[0]?.name ||
    (isEs ? 'Colaborador' : 'Contributor');

  const handleShareRecap = async () => {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F0DC00', '#FFFFFF', '#EC4899'],
    });

    const shareText = isEs
      ? `Partylot — ${party.title}\n` +
        `${party.date}${party.location ? ` · ${party.location}` : ''}\n\n` +
        `Asistentes: ${attendeesCount}\n` +
        `Gastado juntos: $${totalSharedDamage.toFixed(2)}\n` +
        (minigamesCount > 0 ? `Juegos jugados: ${minigamesCount}\n` : '') +
        (totalVotesCast > 0 ? `Votos: ${totalVotesCast}\n` : '') +
        (mvpMember?.name ? `Más votado: ${mvpMember.name}\n` : '') +
        (gameKingMember?.name ? `Ganador de juegos: ${gameKingMember.name}\n` : '') +
        `\nhttps://partylot.app/party/${party.code || party.id}`
      : `Partylot — ${party.title}\n` +
        `${party.date}${party.location ? ` · ${party.location}` : ''}\n\n` +
        `Who came: ${attendeesCount}\n` +
        `Spent together: $${totalSharedDamage.toFixed(2)}\n` +
        (minigamesCount > 0 ? `Games played: ${minigamesCount}\n` : '') +
        (totalVotesCast > 0 ? `Votes: ${totalVotesCast}\n` : '') +
        (mvpMember?.name ? `Top voted: ${mvpMember.name}\n` : '') +
        (gameKingMember?.name ? `Top player: ${gameKingMember.name}\n` : '') +
        `\nhttps://partylot.app/party/${party.code || party.id}`;

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
      drawMetricBox(560, 440, 440, 170, `$${totalSharedDamage.toFixed(0)}`, isEs ? 'GASTADO JUNTOS' : 'SPENT TOGETHER', '#F0DC00');
      drawMetricBox(80, 640, 440, 170, `${minigamesCount}`, isEs ? 'JUEGOS JUGADOS' : 'GAMES PLAYED', '#FFFFFF');
      drawMetricBox(560, 640, 440, 170, `${totalVotesCast}`, isEs ? 'VOTOS' : 'VOTES', '#FFFFFF');

      // Night Awards Card
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(80, 850, 920, 360, 32);
      ctx.fill();
      ctx.strokeStyle = 'rgba(240, 220, 0, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#F0DC00';
      ctx.font = '800 24px sans-serif';
      ctx.fillText(isEs ? 'DESTACADOS DE LA NOCHE' : 'HIGHLIGHTS OF THE NIGHT', 120, 915);

      const drawAwardLine = (y: number, title: string, name: string) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '700 28px sans-serif';
        ctx.fillText(title, 120, y);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 32px sans-serif';
        ctx.fillText(name.toUpperCase(), 780, y);
      };

      if (mvpMember?.name) {
        drawAwardLine(990, isEs ? 'MÁS VOTADO' : 'TOP VOTED', mvpMember.name);
      }
      if (gameKingMember?.name) {
        drawAwardLine(1070, isEs ? 'GANADOR DE JUEGOS' : 'TOP PLAYER', gameKingMember.name);
      }
      if (bountyContributor) {
        drawAwardLine(1150, isEs ? 'EN LA MÚSICA' : 'ON MUSIC', bountyContributor);
      }

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
                    {isEs ? 'GASTADO JUNTOS' : 'SPENT TOGETHER'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15">
                  <span className="font-display font-black text-3xl sm:text-4xl text-white block leading-none">
                    {minigamesCount}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    {isEs ? 'JUEGOS JUGADOS' : 'GAMES PLAYED'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15">
                  <span className="font-display font-black text-3xl sm:text-4xl text-white block leading-none">
                    {totalVotesCast}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    {isEs ? 'VOTOS' : 'VOTES'}
                  </span>
                </div>
              </div>

              {/* Hall of Fame Awards */}
              {(mvpMember?.name || gameKingMember?.name || bountyContributor) && (
                <div className="p-4 rounded-2xl liquid-glass-modal border border-white/20 mb-6 space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F0DC00] block">
                    {isEs ? 'DESTACADOS DE LA NOCHE' : 'HIGHLIGHTS OF THE NIGHT'}
                  </span>

                  {mvpMember?.name && (
                    <div className="flex items-center justify-between text-xs font-bold border-b border-white/10 pb-2">
                      <span className="text-white/60 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#F0DC00]" />
                        {isEs ? 'MÁS VOTADO' : 'TOP VOTED'}
                      </span>
                      <span className="text-white font-display font-black">{mvpMember.name}</span>
                    </div>
                  )}

                  {gameKingMember?.name && (
                    <div className="flex items-center justify-between text-xs font-bold border-b border-white/10 pb-2">
                      <span className="text-white/60 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        {isEs ? 'GANADOR DE JUEGOS' : 'TOP PLAYER'}
                      </span>
                      <span className="text-white font-display font-black">{gameKingMember.name}</span>
                    </div>
                  )}

                  {bountyContributor && (
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white/60 flex items-center gap-1.5">
                        <Disc className="w-3.5 h-3.5 text-sky-400" />
                        {isEs ? 'EN LA MÚSICA' : 'ON MUSIC'}
                      </span>
                      <span className="text-white font-display font-black">{bountyContributor}</span>
                    </div>
                  )}
                </div>
              )}

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
            {/* Crew History Card */}
            <div className="p-6 bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] rounded-[28px] shadow-[0_10px_30px_rgba(65,48,25,0.06)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#B8A700]" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#171512]">
                    {isEs ? 'HISTORIA DEL CREW' : 'CREW HISTORY'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F0DC00]/20 text-[#171512] font-bold">
                  {isEs ? 'MEMORIA COMPARTIDA' : 'SHARED MEMORY'}
                </span>
              </div>

              <h3 className="font-display font-black text-2xl text-[#171512] tracking-tight mb-2">
                {isEs ? 'Recuerdos de la Noche' : 'Night Memories'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6F6A62] leading-relaxed mb-4">
                {isEs ? (
                  <>La asistencia, minijuegos y gastos de <span className="text-[#171512] font-semibold">{party.title}</span> quedan guardados para todo el grupo.</>
                ) : (
                  <>Attendance, games and expenses for <span className="text-[#171512] font-semibold">{party.title}</span> are saved for the entire group.</>
                )}
              </p>

              <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-[rgba(35,30,22,0.08)] text-center mb-4">
                <div className="p-2.5 rounded-xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)]">
                  <Users className="w-4 h-4 text-[#B8A700] mx-auto mb-1" />
                  <span className="font-display font-black text-base text-[#171512] block">{attendeesCount}</span>
                  <span className="text-[9px] uppercase text-[#8E887E]">{isEs ? 'Asistieron' : 'Came'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)]">
                  <Receipt className="w-4 h-4 text-stone-600 mx-auto mb-1" />
                  <span className="font-display font-black text-base text-[#171512] block">${totalSharedDamage.toFixed(0)}</span>
                  <span className="text-[9px] uppercase text-[#8E887E]">{isEs ? 'Gastado' : 'Spent'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)]">
                  <Gamepad2 className="w-4 h-4 text-stone-600 mx-auto mb-1" />
                  <span className="font-display font-black text-base text-[#171512] block">{minigamesCount}</span>
                  <span className="text-[9px] uppercase text-[#8E887E]">{isEs ? 'Juegos' : 'Games'}</span>
                </div>
              </div>

              {/* Attestation Action */}
              {attestationTxHash ? (
                <div className="w-full py-2.5 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#171512] text-xs font-semibold flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B8A700]" />
                  <span>{isEs ? 'Guardado en la historia' : 'Saved to history'}</span>
                </div>
              ) : (
                <button
                  onClick={handleAttestGathering}
                  disabled={isAttesting}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F0DC00] hover:bg-[#E6D300] active:scale-95 text-[#171512] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#171512] stroke-[2.5]" />
                  <span>
                    {isAttesting
                      ? isEs ? 'Guardando en la historia...' : 'Saving to history...'
                      : isEs ? 'Guardar en la historia del crew' : 'Save to crew history'}
                  </span>
                </button>
              )}
            </div>

            {/* Attendees */}
            <div className="p-6 bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] rounded-[28px] shadow-[0_10px_30px_rgba(65,48,25,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#6F6A62]">
                  {isEs ? `QUIÉNES VINIERON (${party.members.length})` : `WHO CAME (${party.members.length})`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {party.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-2.5 rounded-xl bg-[#F8F3EA] flex items-center gap-2.5 border border-[rgba(35,30,22,0.08)]"
                  >
                    <Avatar user={member} size="sm" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#171512] truncate block">
                        {member.name}
                      </span>
                      <span className="text-[9px] text-[#8E887E] font-medium">
                        {member.role === 'host' ? (isEs ? 'Anfitrión' : 'Host') : (isEs ? 'Asistió' : 'Came')}
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
