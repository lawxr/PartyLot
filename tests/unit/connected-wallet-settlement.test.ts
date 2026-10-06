import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  writeContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  getClientPrivyToken: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createWalletClient: vi.fn(() => ({
      writeContract: mocks.writeContract,
    })),
    custom: vi.fn(() => ({})),
  };
});

vi.mock('@/lib/web3/monad', () => ({
  publicMonadClient: {
    waitForTransactionReceipt: mocks.waitForTransactionReceipt,
    readContract: vi.fn(),
  },
  getMonadExplorerTxUrl: vi.fn((hash: string) => `https://testnet.monadexplorer.com/tx/${hash}`),
  monadTestnet: { id: 10143, name: 'Monad Testnet' },
  toPartyBytes32: vi.fn(() => `0x${'a'.repeat(64)}`),
}));

vi.mock('@/hooks/usePrivySync', () => ({
  getClientPrivyToken: mocks.getClientPrivyToken,
}));

import {
  settleDamageOnchain,
  distributeBountyOnchain,
  registerPartyOnchain,
  type ConnectedUserWallet,
} from '@/services/treasury';
import { translations } from '@/lib/i18n/translations';
import type { DebtSettlement } from '@/types';

describe('Connected-Wallet Settlement Flow & Asset Alignment (MKT-05)', () => {
  const partyId = 'party-uuid-1234';
  const creditorAddress = '0x1111111111111111111111111111111111111111';
  const debtorAddress = '0x2222222222222222222222222222222222222222';

  const mockWallet: ConnectedUserWallet = {
    address: debtorAddress,
    chainId: 'eip155:10143',
    switchChain: vi.fn().mockResolvedValue(undefined),
    getEthereumProvider: vi.fn().mockResolvedValue({}),
  };

  const sampleSettlements: DebtSettlement[] = [
    {
      fromId: 'user-debtor',
      fromName: 'Debtor',
      fromAvatar: '',
      toId: creditorAddress,
      toName: 'Creditor',
      toAvatar: '',
      amount: 2.5,
    },
  ];

  beforeEach(() => {
    vi.stubGlobal('fetch', mocks.fetch);
    mocks.writeContract.mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    mocks.waitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: BigInt(65050123),
    });
    mocks.getClientPrivyToken.mockResolvedValue('test-privy-token');
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, txHash: '0x123' }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('Non-Custodial Connected-Wallet Enforcement', () => {
    it('fails closed when no connected wallet is provided', async () => {
      await expect(
        settleDamageOnchain(partyId, sampleSettlements, debtorAddress, undefined)
      ).rejects.toThrow('Connect your wallet to settle debts directly on Monad Testnet (MON).');
    });

    it('switches chain to Monad Testnet (10143) if wallet is on a different network', async () => {
      const wrongChainWallet: ConnectedUserWallet = {
        ...mockWallet,
        chainId: 'eip155:1',
      };

      await settleDamageOnchain(partyId, sampleSettlements, debtorAddress, { wallet: wrongChainWallet });

      expect(wrongChainWallet.switchChain).toHaveBeenCalledWith(10143);
    });

    it('executes settleDebt directly onchain with native MON value and recipient', async () => {
      const receipt = await settleDamageOnchain(partyId, sampleSettlements, debtorAddress, { wallet: mockWallet });

      expect(mocks.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'settleDebt',
          args: [expect.any(String), creditorAddress],
          value: expect.any(BigInt),
        })
      );
      expect(receipt.token).toBe('MON');
      expect(receipt.network).toBe('Monad Testnet');
      expect(receipt.amount).toBe(2.5);
    });
  });

  describe('Creditor and Parameter Validation', () => {
    it('rejects settlements with empty or missing list', async () => {
      await expect(
        settleDamageOnchain(partyId, [], debtorAddress, { wallet: mockWallet })
      ).rejects.toThrow('No pending debts to settle.');
    });

    it('rejects settlements with unverified creditor address', async () => {
      const invalidSettlements: DebtSettlement[] = [
        {
          ...sampleSettlements[0],
          toId: 'not-an-eth-address',
        },
      ];

      await expect(
        settleDamageOnchain(partyId, invalidSettlements, debtorAddress, { wallet: mockWallet })
      ).rejects.toThrow('All creditors must have a verified wallet address');
    });

    it('rejects self-settlement when debtor wallet matches creditor address', async () => {
      const selfSettlement: DebtSettlement[] = [
        {
          ...sampleSettlements[0],
          toId: debtorAddress,
        },
      ];

      await expect(
        settleDamageOnchain(partyId, selfSettlement, debtorAddress, { wallet: mockWallet })
      ).rejects.toThrow('Cannot settle debt with yourself.');
    });
  });

  describe('Bearer Token Inclusion on Authenticated Treasury Calls', () => {
    it('carries Authorization Bearer header when registering party onchain', async () => {
      mocks.getClientPrivyToken.mockResolvedValue('secret-bearer-token');

      await registerPartyOnchain(partyId, debtorAddress);

      expect(mocks.fetch).toHaveBeenCalledWith(
        '/api/treasury/action',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer secret-bearer-token',
          }),
        })
      );
    });

    it('carries Authorization Bearer header when distributing bounties', async () => {
      mocks.getClientPrivyToken.mockResolvedValue('host-bearer-token');

      await distributeBountyOnchain(partyId, creditorAddress, 10, 'DJ_BOUNTY');

      expect(mocks.fetch).toHaveBeenCalledWith(
        '/api/treasury/action',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer host-bearer-token',
          }),
        })
      );
    });
  });

  describe('UI & Translation Alignment (Native MON, Not USDC)', () => {
    it('aligns Spanish translations to MON for settlements', () => {
      expect(translations.es.split.settleOnMonad).toBe('Liquidar en Monad (MON)');
      expect(translations.es.split.settleTitle).toBe('Liquidación de Cuentas (MON)');
      expect(translations.es.split.settleEngineBadge).toBe('MON Split Engine · Monad Testnet');
      expect(translations.es.split.confirmSettle(2)).toContain('MON');
      expect(translations.es.split.confirmSettle(2)).not.toContain('USDC');
    });

    it('aligns English translations to MON for settlements', () => {
      expect(translations.en.split.settleOnMonad).toBe('Settle on Monad (MON)');
      expect(translations.en.split.settleEngineBadge).toBe('MON Split Engine · Monad Testnet');
      expect(translations.en.split.confirmSettle(2)).toContain('MON');
      expect(translations.en.split.confirmSettle(2)).not.toContain('USDC');
    });
  });
});
