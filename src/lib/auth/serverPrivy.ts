import { PrivyClient, AuthTokenClaims, User as PrivyUser } from '@privy-io/server-auth';

let privyClientInstance: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
  if (privyClientInstance) {
    return privyClientInstance;
  }

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Privy credentials (NEXT_PUBLIC_PRIVY_APP_ID or PRIVY_APP_SECRET) are missing.');
  }

  privyClientInstance = new PrivyClient(appId, appSecret);
  return privyClientInstance;
}

export interface VerifiedPrivyProfile {
  userId: string;
  name: string;
  handle: string;
  avatar: string | null;
  walletAddress: string | null;
  claims: AuthTokenClaims;
}

/**
 * Cryptographically verifies a Privy auth token and resolves user profile metadata.
 */
export async function verifyPrivyToken(authToken: string): Promise<VerifiedPrivyProfile> {
  const privy = getPrivyClient();
  const claims = await privy.verifyAuthToken(authToken);

  let user: PrivyUser | null = null;
  try {
    user = await privy.getUser(claims.userId);
  } catch (err) {
    console.warn('Privy getUser lookup fallback:', err);
  }

  const email =
    user?.email?.address ||
    user?.google?.email ||
    user?.apple?.email ||
    (user?.phone?.number ? `sms:${user.phone.number}` : null);

  const wallet =
    user?.wallet?.address ||
    user?.linkedAccounts?.find((a) => a.type === 'wallet')?.address ||
    null;

  let displayName =
    user?.google?.name ||
    (email ? email.split('@')[0] : 'PartyMember');

  let handle = `@${displayName.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
  let avatar: string | null = null;

  // Enrich with user's customized profile stored in Supabase users table
  try {
    const { getServerSupabase } = await import('@/lib/supabase/server');
    const supabase = getServerSupabase();
    const { data: dbUser } = await supabase
      .from('users')
      .select('name, handle, avatar')
      .eq('id', claims.userId)
      .maybeSingle();

    if (dbUser) {
      if (dbUser.name && dbUser.name.trim() && dbUser.name !== 'PartyMember' && dbUser.name !== 'Guest') {
        displayName = dbUser.name.trim();
      }
      if (dbUser.handle && dbUser.handle.trim()) {
        handle = dbUser.handle.trim();
      }
      if (dbUser.avatar && dbUser.avatar.trim()) {
        avatar = dbUser.avatar.trim();
      }
    }
  } catch {
    // Graceful fallback to Privy profile when Supabase is unreachable or not configured
  }

  return {
    userId: claims.userId,
    name: displayName,
    handle,
    avatar,
    walletAddress: wallet,
    claims,
  };
}
