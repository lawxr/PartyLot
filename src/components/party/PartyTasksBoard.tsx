'use client';

import React, { useState } from 'react';
import {
  Plus,
  Coins,
  ShieldCheck,
  Check,
  Clock,
  UserCheck,
  PackageCheck,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FINANCIAL_ACTIONS_AVAILABLE, getFinancialActionsUnavailableMessage } from '@/services/treasury';
import confetti from 'canvas-confetti';

interface PartyTasksBoardProps {
  partyId: string;
}

export const PartyTasksBoard: React.FC<PartyTasksBoardProps> = ({ partyId }) => {
  const {
    parties,
    tasks,
    currentUser,
    createPartyTask,
    claimPartyTask,
    completePartyTask,
  } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const party = parties.find((p) => p.id === partyId) || parties[0];
  const partyTasks = tasks.filter((t) => t.partyId === party.id);

  const [filter, setFilter] = useState<'all' | 'open' | 'claimed' | 'verified'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [rewardAmount, setRewardAmount] = useState('5');
  const financialActionsMessage = getFinancialActionsUnavailableMessage(language);

  const filteredTasks =
    filter === 'all'
      ? partyTasks
      : filter === 'claimed'
      ? partyTasks.filter((t) => t.status === 'claimed' || t.status === 'completed')
      : partyTasks.filter((t) => t.status === filter);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(rewardAmount);
    if (!title.trim() || isNaN(val) || val <= 0) return;

    createPartyTask({
      partyId: party.id,
      title: title.trim(),
      rewardAmount: val,
    });

    setTitle('');
    setRewardAmount('5');
    setIsCreateOpen(false);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F0DC00', '#FFFFFF', '#60A5FA'],
    });
  };

  const handleClaim = (taskId: string) => {
    claimPartyTask(taskId, currentUser.id);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#F0DC00', '#10B981'],
    });
  };

  const handleComplete = (taskId: string) => {
    completePartyTask(taskId);
    confetti({
      particleCount: 45,
      spread: 55,
      origin: { y: 0.7 },
      colors: ['#F0DC00', '#A855F7'],
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Editorial Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F0DC00]">
              {isEs ? 'RECOMPENSAS POR COLABORAR' : 'CONTRIBUTION REWARDS'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-2.5 h-2.5" />
              {isEs ? 'Recompensa no pagada' : 'Reward not paid'}
            </span>
          </div>
          <h3 className="font-display font-black text-2xl text-white tracking-tight">
            {isEs ? 'MISIONES Y TAREAS' : 'BOUNTIES & TASKS'}
          </h3>
          <p className="text-xs text-white/60">
            {isEs
              ? 'Las tareas pueden organizarse aquí; las recompensas son solo propuestas y no se pagan desde la app.'
              : 'Tasks can be organized here; rewards are proposals only and are not paid by the app.'}
          </p>
        </div>

        <GlassButton
          variant="accent"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          icon={<Plus className="w-3.5 h-3.5 text-black stroke-[3]" />}
        >
          {isEs ? 'Nueva Misión' : 'Add Bounty'}
        </GlassButton>
      </div>

      <p role="status" className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
        {financialActionsMessage}
      </p>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: `${isEs ? 'Todas' : 'All'} (${partyTasks.length})` },
          { id: 'open', label: `${isEs ? 'Abiertas' : 'Open'} (${partyTasks.filter((t) => t.status === 'open').length})` },
          { id: 'claimed', label: `${isEs ? 'En Progreso' : 'In Progress'} (${partyTasks.filter((t) => t.status === 'claimed' || t.status === 'completed').length})` },
          { id: 'verified', label: `${isEs ? 'Completadas' : 'Completed'} (${partyTasks.filter((t) => t.status === 'verified').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              filter === tab.id
                ? 'bg-[#F0DC00] text-black shadow-md'
                : 'liquid-glass-card text-white/60 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isOpen = task.status === 'open';
            const isClaimed = task.status === 'claimed';
            const isCompleted = task.status === 'completed';
            const isVerified = task.status === 'verified';
            const isClaimedByMe = task.claimedById === currentUser.id;

            return (
              <GlassPanel
                key={task.id}
                level={2}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/15 hover:border-white/25 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display font-bold text-base text-white">
                      {task.title}
                    </h4>

                    {/* Status Badge */}
                    {isOpen && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Open Bounty
                      </span>
                    )}
                    {isClaimed && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Claimed
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                        <PackageCheck className="w-2.5 h-2.5" />
                        Completed · Awaiting Verification
                      </span>
                    )}
                    {isVerified && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        {isEs ? 'Completada' : 'Completed'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span>{task.createdAt}</span>
                    {task.claimedByName && (
                      <span className="flex items-center gap-1.5 text-white/70">
                        {(task.claimedByAvatar || currentUser.avatar) ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={task.claimedByAvatar || currentUser.avatar}
                            alt={task.claimedByName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold text-white">
                            {task.claimedByName ? task.claimedByName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <span>{task.claimedByName}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                  <div className="text-left sm:text-right">
                    <span className="font-display font-black text-xl text-[#F0DC00] block leading-none">
                      ${task.rewardAmount.toFixed(2)}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-white/40">
                      {isEs ? 'recompensa propuesta' : 'proposed reward'}
                    </span>
                  </div>

                  {/* Contextual Action Button */}
                  {isOpen && (
                    <GlassButton
                      variant="glass"
                      size="sm"
                      onClick={() => handleClaim(task.id)}
                      icon={<UserCheck className="w-3.5 h-3.5 text-[#F0DC00]" />}
                    >
                      Claim
                    </GlassButton>
                  )}

                  {isClaimed && isClaimedByMe && (
                    <GlassButton
                      variant="accent"
                      size="sm"
                      onClick={() => handleComplete(task.id)}
                      icon={<Check className="w-3.5 h-3.5 text-black" />}
                    >
                      Mark Done
                    </GlassButton>
                  )}

                  {isClaimed && !isClaimedByMe && (
                    <span className="text-xs text-white/40 italic">In progress</span>
                  )}

                  {isCompleted && (
                    <GlassButton
                      variant="glass"
                      size="sm"
                      disabled={!FINANCIAL_ACTIONS_AVAILABLE}
                    >
                      {isEs ? 'Pago no disponible' : 'Payment unavailable'}
                    </GlassButton>
                  )}

                  {isVerified && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </GlassPanel>
            );
          })
        ) : (
          <div className="p-8 text-center rounded-3xl liquid-glass-card border border-white/10">
            <Coins className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <p className="text-xs text-white/50">No bounties in this tab yet.</p>
          </div>
        )}
      </div>

      {/* BottomSheet: Create Task */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Party Bounty"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <p className="text-xs text-white/70">
            {isEs
              ? 'Organiza tareas y define una recompensa propuesta. La app no procesa pagos.'
              : 'Organize tasks and set a proposed reward. The app does not process payments.'}
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bring 2 bags of ice & lime, Aux cord setup..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white placeholder-white/30 text-base font-semibold outline-none border border-white/20 focus:border-[#F0DC00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
              Preset Bounty Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['3', '5', '8', '10'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRewardAmount(preset)}
                  className={`py-2.5 rounded-xl font-display font-black text-sm transition-all ${
                    rewardAmount === preset
                      ? 'bg-[#F0DC00] text-black shadow-md'
                      : 'liquid-glass-card text-white/70'
                  }`}
                >
                  +${preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
              Custom Amount ($)
            </label>
            <input
              type="number"
              step="0.50"
              required
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl liquid-glass-card text-white font-display font-black text-2xl outline-none border border-white/20 focus:border-[#F0DC00]"
            />
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              type="submit"
            >
              Post Bounty ($ {rewardAmount})
            </GlassButton>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
