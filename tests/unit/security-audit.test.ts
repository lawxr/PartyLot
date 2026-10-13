import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as recordDepositHandler } from '@/app/api/treasury/record-deposit/route';
import { POST as uploadHandler } from '@/app/api/upload/route';
import { POST as profileHandler } from '@/app/api/users/profile/route';
import { MONAD_CONTRACT_ADDRESSES } from '@/contracts';

// Mock server auth and supabase
vi.mock('@/lib/auth/serverPrivy', () => ({
  verifyPrivyToken: vi.fn().mockResolvedValue({
    userId: 'user-audit-123',
    name: 'Auditor',
    handle: '@auditor',
    avatar: null,
    walletAddress: '0x1111111111111111111111111111111111111111',
  }),
}));

const mockSupabase = {
  from: vi.fn(),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'uploads/user-audit-123/test.jpg' },
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/partylot-media/uploads/user-audit-123/test.jpg' },
      }),
    }),
  },
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: vi.fn(() => mockSupabase),
}));

vi.mock('@/lib/web3/monad', () => ({
  publicMonadClient: {
    waitForTransactionReceipt: vi.fn(),
  },
  monadTestnet: {},
  getMonadExplorerTxUrl: vi.fn((tx) => `https://testnet.monadexplorer.com/tx/${tx}`),
}));

describe('Security Audit Defenses (Cloudflare Audit Standard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Treasury Record Deposit Route (Replay & Destination Verification)', () => {
    it('rejects transactions whose destination contract is not PartyTreasury (CWE-284)', async () => {
      const { publicMonadClient } = await import('@/lib/web3/monad');
      vi.mocked(publicMonadClient.waitForTransactionReceipt).mockResolvedValueOnce({
        status: 'success',
        to: '0x9999999999999999999999999999999999999999' as `0x${string}`, // Attacker contract, not PartyTreasury
        blockNumber: BigInt(123456),
      } as never);

      const request = new NextRequest('http://localhost:3000/api/treasury/record-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-test-token',
        },
        body: JSON.stringify({
          partyId: 'party-1',
          txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          amount: 5,
        }),
      });

      const response = await recordDepositHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_RECIPIENT_CONTRACT');
      expect(data.message).toContain('PartyTreasury');
    });

    it('prevents double-spending balance inflation on duplicate txHash submission (CWE-307 / CWE-799)', async () => {
      const { publicMonadClient } = await import('@/lib/web3/monad');
      vi.mocked(publicMonadClient.waitForTransactionReceipt).mockResolvedValueOnce({
        status: 'success',
        to: MONAD_CONTRACT_ADDRESSES.partyTreasury,
        blockNumber: BigInt(123456),
      } as never);

      // Mock database returning party and an existing transaction for this txHash
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'parties') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'party-1', pot_balance: 100 },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'pot_transactions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'pot-tx-abcdef12345678' }, // Already exists!
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const request = new NextRequest('http://localhost:3000/api/treasury/record-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-test-token',
        },
        body: JSON.stringify({
          partyId: 'party-1',
          txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          amount: 50,
        }),
      });

      const response = await recordDepositHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.duplicate).toBe(true);
      // Pot balance must remain unchanged ($100, NOT $150)
      expect(data.updatedBalance).toBe(100);
    });
  });

  describe('Upload Route (Extension Spoofing Defense)', () => {
    it('forces clean MIME-based extension and ignores disguised filename extension (CWE-434)', async () => {
      let uploadedFileName = '';
      mockSupabase.storage.from.mockReturnValueOnce({
        upload: vi.fn().mockImplementation((name: string) => {
          uploadedFileName = name;
          return Promise.resolve({
            data: { path: name },
            error: null,
          });
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://test.supabase.co/image.png' },
        }),
      });

      const formData = new FormData();
      // Disguised file with html name but image/png MIME type
      const fakeImage = new File(['fake-png-content'], 'exploit.html', { type: 'image/png' });
      formData.append('file', fakeImage);
      formData.append('folder', 'avatars');

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-test-token',
        },
        body: formData,
      });

      const response = await uploadHandler(request);
      expect(response.status).toBe(200);
      // Must be saved with .png, NOT .html
      expect(uploadedFileName.endsWith('.png')).toBe(true);
      expect(uploadedFileName.endsWith('.html')).toBe(false);
    });
  });

  describe('Profile Route (Information Disclosure Defense)', () => {
    it('returns sanitized error response on database permission error without leaking migration names (CWE-209)', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: '42501', message: 'permission denied for function update_user_profile' },
      });

      const request = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-test-token',
        },
        body: JSON.stringify({
          name: 'New Name',
          handle: '@newhandle',
        }),
      });

      const response = await profileHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('PERMISSION_DENIED');
      // Must NOT leak migration file or environment variable names
      expect(data.message).not.toContain('migration');
      expect(data.message).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(data.message).toContain('Service temporarily unavailable');
    });
  });
});
