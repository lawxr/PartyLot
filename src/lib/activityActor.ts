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
