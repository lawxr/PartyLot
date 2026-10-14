import type { ActivityItem, Member } from '@/types';

export interface ActivityActor {
  name: string;
  id?: string;
  avatar?: string;
  isSystem?: boolean;
}

/**
 * Resolves the actor of an activity item reliably.
 * Prevents extracting sentence fragments as initials (e.g. "PartyMember created..." -> "PC")
 * and ensures deterministic color themes that match host/attendee avatars.
 */
export function resolveActivityActor(
  activity: ActivityItem,
  fallbackHostName?: string,
  members?: Member[],
  currentUser?: { id?: string; name?: string; avatar?: string; walletAddress?: string; email?: string }
): ActivityActor {
  // 1. Direct match by current authenticated user ID
  if (currentUser?.id && activity.userId === currentUser.id) {
    return {
      name: currentUser.name || activity.userName || 'You',
      id: currentUser.id,
      avatar: currentUser.avatar || activity.avatar,
      isSystem: false,
    };
  }

  // 2. Direct match by activity userId across known members
  if (activity.userId && members && members.length > 0) {
    const matchedById = members.find((m) => m.id === activity.userId);
    if (matchedById) {
      return {
        name: matchedById.name,
        id: matchedById.id,
        avatar: matchedById.avatar || activity.avatar,
        isSystem: false,
      };
    }
  }

  // 3. Match by activity.userName if present
  if (activity.userName && activity.userName.trim()) {
    if (currentUser?.name && activity.userName.trim().toLowerCase() === currentUser.name.toLowerCase()) {
      return {
        name: currentUser.name,
        id: currentUser.id || activity.userId,
        avatar: currentUser.avatar || activity.avatar,
        isSystem: false,
      };
    }
    const matchedMember = members?.find(
      (m) => m.name.toLowerCase() === activity.userName!.trim().toLowerCase()
    );
    return {
      name: matchedMember?.name || activity.userName.trim(),
      id: activity.userId || matchedMember?.id || activity.userName.trim(),
      avatar: matchedMember?.avatar || activity.avatar,
      isSystem: false,
    };
  }

  const raw = (activity.text || '').trim();

  // Strip leading activity icons/emojis if present (e.g. "💰 ", "💸 ", "🎯 ", "🏆 ", "🔄 ")
  const cleanText = raw.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u, '').trim();

  // 4. Check if activity was generated with currentUser's email prefix or privy default name
  if (currentUser) {
    const emailPrefix = currentUser.email?.split('@')[0]?.toLowerCase();
    const currentLowerName = currentUser.name?.toLowerCase();
    if (
      (emailPrefix && emailPrefix.length > 2 && cleanText.toLowerCase().startsWith(emailPrefix)) ||
      (currentLowerName && cleanText.toLowerCase().startsWith(currentLowerName))
    ) {
      return {
        name: currentUser.name || 'You',
        id: currentUser.id,
        avatar: currentUser.avatar || activity.avatar,
        isSystem: false,
      };
    }
  }

  // 5. Check known activity action verb patterns (English & Spanish)
  const verbMatch = cleanText.match(
    /^([^:–—\n]+?)(?:\s+(?:created the party|creó la fiesta|joined the|se unió|added expense|añadió gasto|aportó|contributed|deposited|liquidó|settled|pagada a|paid to|ganó|won|jugó|played|voted|votó|transferred|rolled over))/i
  );

  if (verbMatch && verbMatch[1]) {
    const candidateName = verbMatch[1].trim();
    // Verify candidate isn't a system event description (e.g. "Poll created" or "New mini-game")
    if (!/^(poll|encuesta|new mini-game|nuevo juego|round|ronda)/i.test(candidateName)) {
      if (currentUser?.name && candidateName.toLowerCase() === currentUser.name.toLowerCase()) {
        return {
          name: currentUser.name,
          id: currentUser.id,
          avatar: currentUser.avatar || activity.avatar,
          isSystem: false,
        };
      }
      const matchedMember = members?.find(
        (m) => m.name.toLowerCase() === candidateName.toLowerCase()
      );
      return {
        name: matchedMember?.name || candidateName,
        id: matchedMember?.id || candidateName,
        avatar: matchedMember?.avatar || activity.avatar,
        isSystem: false,
      };
    }
  }

  // 6. If text starts with a member's name directly
  if (members && members.length > 0) {
    for (const m of members) {
      if (m.name && cleanText.toLowerCase().startsWith(m.name.toLowerCase())) {
        return {
          name: m.name,
          id: m.id,
          avatar: m.avatar || activity.avatar,
          isSystem: false,
        };
      }
    }
  }

  // 7. If text mentions host or party creation
  if (/created the party|creó la fiesta/i.test(cleanText) && fallbackHostName) {
    return {
      name: fallbackHostName,
      id: fallbackHostName,
      avatar: activity.avatar,
      isSystem: false,
    };
  }

  // 8. System fallback: return first 1-2 words safely, or Partylot
  const firstWord = cleanText.split(/\s+/)[0] || 'Partylot';
  return {
    name: firstWord,
    id: firstWord,
    avatar: activity.avatar,
    isSystem: true,
  };
}

/**
 * Strips leading emojis and isolates the narrative action of an activity,
 * preventing duplicate names or stale random handle leaks.
 */
export function resolveActivityNarrative(
  activity: Partial<ActivityItem>,
  actorName: string,
  locale: 'es' | 'en' = 'es'
): string {
  let narrative = activity.verb || '';

  if (!narrative && activity.text) {
    // 1. Strip leading emojis, money bags, or confetti
    const text = activity.text.replace(/^[\p{Emoji}\s]+/u, '').trim();

    // 2. Check if a known action verb follows a subject prefix
    const verbMatch = text.match(
      /^([^:–—\n]+?)(?:\s+((?:created the party|creó la fiesta|joined the|se unió|left the party|salió de la fiesta|added expense|añadió gasto|aportó|contributed|deposited|depositó|liquidó|settled|pagada a|paid to|ganó|won|jugó|played|voted|votó|transferred|rolled over).*))/i
    );

    if (verbMatch && verbMatch[2]) {
      narrative = verbMatch[2].trim();
    } else if (actorName && text.toLowerCase().startsWith(actorName.toLowerCase())) {
      narrative = text.slice(actorName.length).trim();
    } else {
      narrative = text;
    }
  }

  if (!narrative) return '';

  // 3. Internationalization / Localized mapping
  if (locale === 'es') {
    // Left party
    if (/^left the party/i.test(narrative)) {
      return 'salió de la fiesta';
    }
    // Joined party
    if (/^joined the (?:party|crew)/i.test(narrative)) {
      return 'se unió a la fiesta';
    }
    // Created party
    if (/^created the party/i.test(narrative)) {
      return 'creó la fiesta';
    }
    // Added [CATEGORY] expense: "name" ($X.XX)
    const catExpenseMatch = narrative.match(/^added\s+\[([A-Z_]+)\]\s+expense:\s*(.*)/i);
    if (catExpenseMatch) {
      const catMap: Record<string, string> = {
        DRINKS: 'Bebidas',
        FOOD: 'Comida',
        TRANSPORT: 'Transporte',
        VENUE: 'Lugar',
        OTHER: 'Otros',
        GENERAL: 'General',
      };
      const cat = catMap[catExpenseMatch[1].toUpperCase()] || catExpenseMatch[1];
      let details = catExpenseMatch[2];
      details = details.replace(/Settlement:\s*(.*?)\s+paid\s+(.*?)\s*(\(MON\))/i, 'Liquidación: $1 le pagó a $2 $3');
      return `añadió gasto [${cat}]: ${details}`;
    }
    // Added regular expense: "name" ($X.XX)
    const expenseMatch = narrative.match(/^added\s+expense:\s*(.*)/i);
    if (expenseMatch) {
      let details = expenseMatch[1];
      if (/^"?Settlement:/i.test(details) || /Settlement:/i.test(details)) {
        details = details.replace(/Settlement:\s*(.*?)\s+paid\s+(.*?)\s*(\(MON\))/i, 'Liquidación: $1 le pagó a $2 $3');
        return `añadió liquidación: ${details}`;
      }
      return `añadió el gasto: ${details}`;
    }
    // Contributed / deposited to pot
    const potMatch = narrative.match(/^(?:contributed|deposited)\s+(.*)\s+to the pot/i);
    if (potMatch) {
      return `aportó ${potMatch[1]} al bote`;
    }
    // Voted in poll
    if (/^voted in (?:the )?poll/i.test(narrative)) {
      return 'votó en la encuesta';
    }
    // Won the game
    if (/^won the (?:game|round)/i.test(narrative)) {
      return 'ganó el minijuego';
    }
  } else if (locale === 'en') {
    // English mapping if source was in Spanish
    if (/^salió de la fiesta/i.test(narrative)) {
      return 'left the party';
    }
    if (/^se unió a la fiesta/i.test(narrative)) {
      return 'joined the party';
    }
    if (/^creó la fiesta/i.test(narrative)) {
      return 'created the party';
    }
    // Photo added
    if (/^añadió una nueva foto al álbum/i.test(narrative) || /^añadió una foto/i.test(narrative)) {
      return 'added a new photo to the album';
    }
    // Settlement
    const esSettlementMatch = narrative.match(/^(?:pago liquidado|liquidó deuda|añadió liquidación):\s*(?:.*?\s+transfirió\s+)?(.*)/i);
    if (esSettlementMatch) {
      return `settled debt: ${esSettlementMatch[1].replace(/a\s+/i, 'to ')}`;
    }
    // Expense with category
    const esCatExpMatch = narrative.match(/^añadió\s+gasto\s*\[(.*?)\]:\s*(.*)/i);
    if (esCatExpMatch) {
      return `added [${esCatExpMatch[1]}] expense: ${esCatExpMatch[2]}`;
    }
    // Regular expense
    const esExpenseMatch = narrative.match(/^añadió\s+(?:el\s+)?gasto:\s*(.*)/i);
    if (esExpenseMatch) {
      return `added expense: ${esExpenseMatch[1]}`;
    }
    // Pot deposit
    const esPotMatch = narrative.match(/^(?:aportó|depositó)\s+(.*?)\s+al\s+(?:Party Pot|bote)/i);
    if (esPotMatch) {
      return `contributed ${esPotMatch[1]} to the pot`;
    }
    // Crew members added
    const esCrewMembersMatch = narrative.match(/^añadió\s+(\d+)\s+miembros del crew\s+"(.*?)"\s+a la fiesta/i);
    if (esCrewMembersMatch) {
      return `added ${esCrewMembersMatch[1]} crew members from "${esCrewMembersMatch[2]}" to the party`;
    }
    // Tasks
    const esTaskClaim = narrative.match(/^aceptó la tarea:\s*"?([^"]*)"?/i);
    if (esTaskClaim) {
      return `accepted the task: "${esTaskClaim[1]}"`;
    }
    const esTaskDone = narrative.match(/^completó:\s*"?([^"]*)"?/i);
    if (esTaskDone) {
      return `completed: "${esTaskDone[1]}"`;
    }
    // Minigames
    const esGameWin = narrative.match(/^ganó\s+(.*?)\s+jugando a\s+(.*)/i);
    if (esGameWin) {
      return `won ${esGameWin[1]} playing ${esGameWin[2]}`;
    }
    if (/^ganó el minijuego/i.test(narrative)) {
      return 'won the minigame';
    }
    if (/^votó en la encuesta/i.test(narrative)) {
      return 'voted in the poll';
    }
    // Cheers
    const esCheers = narrative.match(/^brindó con\s+(.*)/i);
    if (esCheers) {
      return `cheered with ${esCheers[1]}`;
    }
    // Rollover
    const esRollover = narrative.match(/^(.*?)\s+transferidos para la próxima fiesta del crew/i);
    if (esRollover) {
      return `transferred ${esRollover[1]} to the next crew party`;
    }
  }

  return narrative;
}

/**
 * Localizes time strings (e.g. "Just now" -> "Hace un momento", "5m ago" -> "Hace 5m").
 */
export function formatActivityTime(time?: string, locale: 'es' | 'en' = 'es'): string {
  if (!time) return '';
  const trimmed = time.trim();
  const isEs = locale === 'es';

  if (/^(?:just now|ahora mismo)$/i.test(trimmed)) {
    return isEs ? 'Hace un momento' : 'Just now';
  }
  if (/^(?:yesterday|ayer)$/i.test(trimmed)) {
    return isEs ? 'Ayer' : 'Yesterday';
  }
  const minMatch = trimmed.match(/^(?:hace\s+)?(\d+)\s*m(?:in)?(?:\s*ago)?$/i);
  if (minMatch) {
    return isEs ? `Hace ${minMatch[1]}m` : `${minMatch[1]}m ago`;
  }
  const hrMatch = trimmed.match(/^(?:hace\s+)?(\d+)\s*h(?:our|r)?s?(?:\s*ago)?$/i);
  if (hrMatch) {
    return isEs ? `Hace ${hrMatch[1]}h` : `${hrMatch[1]}h ago`;
  }
  return trimmed;
}

export {
  deduplicateActivities,
  areActivitiesDuplicate,
  normalizeActivityText,
  extractMonetaryAmount,
} from './activityDeduplication';
