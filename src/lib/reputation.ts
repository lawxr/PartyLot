/**
 * SocialGraph Reputation & Governance Tier Engine for PartyLot
 *
 * Translates onchain attendance and shared nights into verifiable social status,
 * unlockable perks, and governance privileges on Monad Testnet.
 */

export type ReputationTier =
  | 'newcomer'
  | 'initiate'
  | 'regular'
  | 'inner_circle'
  | 'og_legend';

export type ReputationPrivilege =
  | 'view_memories'
  | 'vote_pot'
  | 'propose_parties'
  | 'og_badge';

export interface ReputationDetails {
  tier: ReputationTier;
  tierName: string;
  tierNameEs: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconName: string;
  minNights: number;
  nextTierNights: number | null;
  progressToNext: number;
  effectiveNights: number;
  score: number;
  unlockedPerks: string[];
  unlockedPerksEs: string[];
}

export const REPUTATION_TIERS: Record<ReputationTier, {
  name: string;
  nameEs: string;
  minNights: number;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconName: string;
  perks: string[];
  perksEs: string[];
}> = {
  newcomer: {
    name: 'Newcomer',
    nameEs: 'Recién Llegado',
    minNights: 0,
    badgeBg: 'bg-stone-500/10 dark:bg-stone-500/20',
    badgeBorder: 'border-stone-500/30',
    badgeText: 'text-stone-600 dark:text-stone-300',
    iconName: 'User',
    perks: ['Can RSVP to invited parties', 'Can join social minigames'],
    perksEs: ['Confirmar asistencia a fiestas', 'Participar en minijuegos'],
  },
  initiate: {
    name: 'Party Initiate',
    nameEs: 'Iniciado de Fiesta',
    minNights: 1,
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    iconName: 'Sparkles',
    perks: ['View shared crew memories & vault', 'Upload party photos'],
    perksEs: ['Ver fotos y recuerdos compartidos', 'Subir fotos a la fiesta'],
  },
  regular: {
    name: 'Crew Regular',
    nameEs: 'Habitual de la Crew',
    minNights: 3,
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-700 dark:text-blue-300',
    iconName: 'Shield',
    perks: ['Vote on Party Pot bounty distribution', 'Request expense reimbursements'],
    perksEs: ['Votar distribución del Party Pot', 'Solicitar reembolsos de gastos'],
  },
  inner_circle: {
    name: 'Inner Circle',
    nameEs: 'Círculo Íntimo',
    minNights: 5,
    badgeBg: 'bg-[#836EF9]/15 dark:bg-[#836EF9]/25',
    badgeBorder: 'border-[#836EF9]/40',
    badgeText: 'text-[#6D28D9] dark:text-[#C4B5FD]',
    iconName: 'Award',
    perks: ['Propose and schedule new parties to crew', 'Co-host private events'],
    perksEs: ['Proponer nuevas fiestas a la crew', 'Co-anfitrión de eventos'],
  },
  og_legend: {
    name: 'OG Crew Legend',
    nameEs: 'Leyenda OG',
    minNights: 10,
    badgeBg: 'bg-[#F0DC00]/20 dark:bg-[#F0DC00]/25',
    badgeBorder: 'border-[#F0DC00]/50',
    badgeText: 'text-[#927000] dark:text-[#F0DC00]',
    iconName: 'Crown',
    perks: ['VIP onchain badge on profile', 'Sponsor gas with priority relayer', 'Veto power on party governance'],
    perksEs: ['Insignia VIP en perfil', 'Gas patrocinado prioritario', 'Voto preferencial en gobernanza'],
  },
};

/**
 * Calculates user reputation based on shared nights together and gatherings attended.
 */
export function calculateReputation(
  sharedNights: number = 0,
  gatheringsAttended: number = 0
): ReputationDetails {
  const effectiveNights = Math.max(0, Math.max(sharedNights, gatheringsAttended));
  const score = effectiveNights * 120 + (gatheringsAttended > 0 ? 50 : 0);

  let currentTierKey: ReputationTier = 'newcomer';
  let nextTierNights: number | null = null;
  let progressToNext = 100;

  if (effectiveNights >= 10) {
    currentTierKey = 'og_legend';
    nextTierNights = null;
    progressToNext = 100;
  } else if (effectiveNights >= 5) {
    currentTierKey = 'inner_circle';
    nextTierNights = 10;
    progressToNext = Math.min(100, Math.round(((effectiveNights - 5) / (10 - 5)) * 100));
  } else if (effectiveNights >= 3) {
    currentTierKey = 'regular';
    nextTierNights = 5;
    progressToNext = Math.min(100, Math.round(((effectiveNights - 3) / (5 - 3)) * 100));
  } else if (effectiveNights >= 1) {
    currentTierKey = 'initiate';
    nextTierNights = 3;
    progressToNext = Math.min(100, Math.round(((effectiveNights - 1) / (3 - 1)) * 100));
  } else {
    currentTierKey = 'newcomer';
    nextTierNights = 1;
    progressToNext = 0;
  }

  const tierMeta = REPUTATION_TIERS[currentTierKey];

  return {
    tier: currentTierKey,
    tierName: tierMeta.name,
    tierNameEs: tierMeta.nameEs,
    badgeBg: tierMeta.badgeBg,
    badgeBorder: tierMeta.badgeBorder,
    badgeText: tierMeta.badgeText,
    iconName: tierMeta.iconName,
    minNights: tierMeta.minNights,
    nextTierNights,
    progressToNext,
    effectiveNights,
    score,
    unlockedPerks: tierMeta.perks,
    unlockedPerksEs: tierMeta.perksEs,
  };
}

/**
 * Checks whether a user satisfies the reputation threshold for a given gated privilege.
 */
export function hasReputationPrivilege(
  effectiveNights: number,
  privilege: ReputationPrivilege
): boolean {
  switch (privilege) {
    case 'view_memories':
      return effectiveNights >= 1;
    case 'vote_pot':
      return effectiveNights >= 3;
    case 'propose_parties':
      return effectiveNights >= 5;
    case 'og_badge':
      return effectiveNights >= 10;
    default:
      return false;
  }
}
