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

  const displayName =
    user?.google?.name ||
    (email ? email.split('@')[0] : 'PartyMember');

  const handle = `@${displayName.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

  return {
    userId: claims.userId,
    name: displayName,
    handle,
    avatar: null,
    walletAddress: wallet,
    claims,
  };
}
