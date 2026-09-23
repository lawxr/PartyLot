import { EIP712InvitePermit } from './types';

/**
 * Offchain Private Code Resolver & EIP-712 Permit Generator.
 *
 * CRITICAL SECURITY INVARIANT:
 * Short codes like '8F4K' have only ~1.67M combinations and would be trivially
 * brute-forced if stored or checked directly onchain.
 *
 * Instead:
 * 1. '8F4K' maps offchain to a high-entropy secret and specific party ID.
 * 2. An authorized relayer/host signs a typed EIP-712 permit for the guest's smart account.
 * 3. Only the permit + signature are submitted onchain via sponsored UserOp.
 */

// Simulated secure offchain code mapping (in production, stored in encrypted Redis/KV)
const SECRET_CODE_MAP: Record<string, { partyId: number; title: string; expiresAt: number }> = {
  '8F4K': { partyId: 404, title: '404 HOUSE', expiresAt: Date.now() + 86400000 },
  '9X2M': { partyId: 405, title: 'Rooftop Sessions', expiresAt: Date.now() + 86400000 },
  '7W1P': { partyId: 406, title: 'After Midnight Crew', expiresAt: Date.now() + 86400000 },
};

export async function resolveInviteCodeToPermit(
  code: string,
  guestAddress: string
): Promise<{ success: boolean; permit?: EIP712InvitePermit; message?: string }> {
  // Simulate rapid API response
  await new Promise((resolve) => setTimeout(resolve, 200));

  const normalized = code.trim().toUpperCase();
  const partyInfo = SECRET_CODE_MAP[normalized];

  if (!partyInfo) {
    return {
      success: false,
      message: 'Invalid invite code or expired party room.',
    };
  }

  // Generate 65-byte cryptographic ECDSA signature simulation
  const sigHex =
    '0x' +
    Array.from({ length: 130 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

  const permit: EIP712InvitePermit = {
    guest: guestAddress,
    partyId: partyInfo.partyId,
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour validity
    nonce: Math.floor(Math.random() * 1000),
    signature: sigHex,
  };

  return {
    success: true,
    permit,
  };
}
