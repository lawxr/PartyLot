import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  writeContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  getClientPrivyToken: vi.fn(),
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
  MONAD_CONTRACT_ADDRESSES: {
    partyTreasury: '0x3333333333333333333333333333333333333333',
  },
  PartyTreasuryABI: [],
}));

vi.mock('@/hooks/usePrivySync', () => ({
  getClientPrivyToken: mocks.getClientPrivyToken,
}));

vi.mock('@/services/supabaseService', () => ({
  persistPartyToSupabase: vi.fn(),
  persistActivityToSupabase: vi.fn(),
  persistExpenseToSupabase: vi.fn(),
  persistPotTransactionToSupabase: vi.fn(),
}));

import {
  settleDamageOnchain,
  PartialSettlementError,
  type ConnectedUserWallet,
} from '@/services/treasury';
import { usePartyStore } from '@/store/usePartyStore';
import type { DebtSettlement, Party, Member, Expense } from '@/types';

describe('Multi-Creditor Safe Settlement Batching (MKT-06)', () => {
  const partyId = 'party-test-mkt06';
  const debtorAddress = '0x1111111111111111111111111111111111111111';
  const creditorAddress1 = '0x2222222222222222222222222222222222222222';
  const creditorAddress2 = '0x3333333333333333333333333333333333333333';
  const creditorAddress3 = '0x4444444444444444444444444444444444444444';

  const mockWallet: ConnectedUserWallet = {
    address: debtorAddress,
    chainId: 'eip155:10143',
    switchChain: vi.fn().mockResolvedValue(undefined),
    getEthereumProvider: vi.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('settleDamageOnchain Service Layer', () => {
    it('rejects zero debts with descriptive error', async () => {
      await expect(
        settleDamageOnchain(partyId, [], debtorAddress, { wallet: mockWallet })
      ).rejects.toThrow('No pending debts to settle.');
    });

    it('successfully executes a single-creditor settlement transfer', async () => {
      mocks.writeContract.mockResolvedValueOnce('0xtx-single');
      mocks.waitForTransactionReceipt.mockResolvedValueOnce({
        status: 'success',
        blockNumber: BigInt(100),
      });

      const settlements: DebtSettlement[] = [
        {
          fromId: 'debtor-user',
          fromName: 'Debtor',
          fromAvatar: '',
          toId: creditorAddress1,
          toName: 'Creditor 1',
          toAvatar: '',
          amount: 10,
        },
      ];

      const receipt = await settleDamageOnchain(partyId, settlements, debtorAddress, {
        wallet: mockWallet,
      });

      expect(receipt.success).toBe(true);
      expect(receipt.amount).toBe(10);
      expect(receipt.txHash).toBe('0xtx-single');
      expect(receipt.settledCount).toBe(1);
      expect(receipt.receipts).toHaveLength(1);
      expect(mocks.writeContract).toHaveBeenCalledTimes(1);
    });

    it('successfully executes multi-creditor settlements individually in sequence without throwing', async () => {
      mocks.writeContract
        .mockResolvedValueOnce('0xtx-batch-1')
        .mockResolvedValueOnce('0xtx-batch-2')
        .mockResolvedValueOnce('0xtx-batch-3');

      mocks.waitForTransactionReceipt
        .mockResolvedValueOnce({ status: 'success', blockNumber: BigInt(101) })
        .mockResolvedValueOnce({ status: 'success', blockNumber: BigInt(102) })
        .mockResolvedValueOnce({ status: 'success', blockNumber: BigInt(103) });

      const settlements: DebtSettlement[] = [
        {
          fromId: 'debtor-user',
          fromName: 'Debtor',
          fromAvatar: '',
          toId: creditorAddress1,
          toName: 'Creditor 1',
          toAvatar: '',
          amount: 5,
        },
        {
          fromId: 'debtor-user',
          fromName: 'Debtor',
          fromAvatar: '',
          toId: creditorAddress2,
          toName: 'Creditor 2',
          toAvatar: '',
          amount: 12.5,
        },
        {
          fromId: 'debtor-user',
          fromName: 'Debtor',
          fromAvatar: '',
          toId: creditorAddress3,
          toName: 'Creditor 3',
          toAvatar: '',
          amount: 7.5,
        },
      ];

      const confirmedProgress: Array<{ settlement: DebtSettlement; receipt: unknown }> = [];
      const receipt = await settleDamageOnchain(partyId, settlements, debtorAddress, {
        wallet: mockWallet,
        onSettlementConfirmed: async (p) => {
          confirmedProgress.push(p);
        },
      });

      expect(receipt.success).toBe(true);
      expect(receipt.amount).toBe(25);
      expect(receipt.settledCount).toBe(3);
      expect(receipt.receipts).toHaveLength(3);
      expect(confirmedProgress).toHaveLength(3);
      expect(mocks.writeContract).toHaveBeenCalledTimes(3);

      // Verify each transfer was called with its specific creditor
      expect(mocks.writeContract).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          functionName: 'settleDebt',
          args: [expect.any(String), creditorAddress1],
        })
      );
      expect(mocks.writeContract).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          functionName: 'settleDebt',
          args: [expect.any(String), creditorAddress2],
        })
      );
      expect(mocks.writeContract).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          functionName: 'settleDebt',
          args: [expect.any(String), creditorAddress3],
        })
      );
    });

    it('handles mid-batch failure: preserves confirmed receipts and throws PartialSettlementError', async () => {
      // 1st transfer succeeds
      mocks.writeContract.mockResolvedValueOnce('0xtx-mid-1');
      mocks.waitForTransactionReceipt.mockResolvedValueOnce({
        status: 'success',
        blockNumber: BigInt(201),
      });

      // 2nd transfer fails (e.g. user rejected signature in wallet)
      mocks.writeContract.mockRejectedValueOnce(new Error('User rejected the transaction in wallet'));

      const settlements: DebtSettlement[] = [
        {
          fromId: 'debtor-user',
          fromName: 'Debtor',
          fromAvatar: '',
          toId: creditorAddress1,
          toName: 'Creditor 1',
          toAvatar: '',
          amount: 10,
        },
        {
          fromId: 'debtor-user',
          fromName: 'Debtor',
          fromAvatar: '',
          toId: creditorAddress2,
          toName: 'Creditor 2',
          toAvatar: '',
          amount: 15,
        },
      ];

      const progressLog: string[] = [];
      let caughtError: unknown;

      try {
        await settleDamageOnchain(partyId, settlements, debtorAddress, {
          wallet: mockWallet,
          onSettlementConfirmed: (p) => {
            progressLog.push(p.settlement.toId);
          },
        });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(PartialSettlementError);
      const partialErr = caughtError as PartialSettlementError;
      expect(partialErr.successfulReceipts).toHaveLength(1);
      expect(partialErr.successfulReceipts[0].txHash).toBe('0xtx-mid-1');
      expect(partialErr.settledSettlements).toHaveLength(1);
      expect(partialErr.settledSettlements[0].toId).toBe(creditorAddress1);
      expect(partialErr.failedSettlement.toId).toBe(creditorAddress2);
      expect(partialErr.remainingSettlements).toHaveLength(1);
      expect(progressLog).toEqual([creditorAddress1]);
    });

    it('rejects unverified creditor addresses before making any contract calls', async () => {
      const invalidSettlements: DebtSettlement[] = [
        {
          fromId: 'debtor-user',
          fromName: 'Debtor',
          fromAvatar: '',
          toId: 'not-a-0x-address',
          toName: 'Unverified Alice',
          toAvatar: '',
          amount: 10,
        },
      ];

      await expect(
        settleDamageOnchain(partyId, invalidSettlements, debtorAddress, { wallet: mockWallet })
      ).rejects.toThrow('All creditors must have a verified wallet address');
      expect(mocks.writeContract).not.toHaveBeenCalled();
    });

    it('rejects self-settlement when debtor wallet matches creditor address', async () => {
      const selfSettlement: DebtSettlement[] = [
        {
          fromId: 'debtor-user',
          fromName: 'Debtor',
          fromAvatar: '',
          toId: debtorAddress,
          toName: 'Self',
          toAvatar: '',
          amount: 10,
        },
      ];

      await expect(
        settleDamageOnchain(partyId, selfSettlement, debtorAddress, { wallet: mockWallet })
      ).rejects.toThrow('Cannot settle debt with yourself.');
      expect(mocks.writeContract).not.toHaveBeenCalled();
    });
  });

  describe('usePartyStore.settleAllDebts Granular State & Idempotency', () => {
    const userBob: Member = {
      id: 'user-bob',
      name: 'Bob',
      avatar: '',
      walletAddress: debtorAddress,
      role: 'guest',
    };
    const userAlice: Member = {
      id: 'user-alice',
      name: 'Alice',
      avatar: '',
      walletAddress: creditorAddress1,
      role: 'host',
    };
    const userCharlie: Member = {
      id: 'user-charlie',
      name: 'Charlie',
      avatar: '',
      walletAddress: creditorAddress2,
      role: 'guest',
    };

    const initialParty: Party = {
      id: partyId,
      code: 'MKT06P',
      title: 'Party MKT06',
      date: 'Tonight',
      time: '10 PM',
      location: 'Test Location',
      description: 'Testing multi-settlement',
      coverImage: '',
      hostId: userAlice.id,
      hostName: userAlice.name,
      members: [userAlice, userBob, userCharlie],
      potBalance: 0,
      createdAt: new Date().toISOString(),
      status: 'live',
    };

    beforeEach(() => {
      usePartyStore.setState({
        currentUser: {
          id: userBob.id,
          name: userBob.name,
          handle: '@bob',
          avatar: '',
          gatheringsCount: 1,
          gamesCount: 0,
          peopleCount: 3,
          settlementsCount: 0,
          balance: 0,
          walletAddress: debtorAddress,
          isPrivyAuthenticated: true,
        },
        parties: [initialParty],
        currentPartyId: partyId,
        expenses: [],
        activities: [],
      });
    });

    it('scopes settlements to authenticated user only (ignores other members debts)', async () => {
      // Alice paid 60 split between Alice, Charlie (Bob is not involved)
      const expenseAlice: Expense = {
        id: 'exp-alice-charlie',
        partyId,
        description: 'Drinks',
        amount: 60,
        paidById: userAlice.id,
        paidByName: userAlice.name,
        paidByAvatar: '',
        splitBetweenIds: [userAlice.id, userCharlie.id],
        createdAt: 'Just now',
        isSettled: false,
      };

      usePartyStore.setState({ expenses: [expenseAlice] });

      // Bob tries to settle, but Bob owes 0!
      const result = await usePartyStore.getState().settleAllDebts(partyId, {
        wallet: mockWallet,
      });

      expect(result.status).toBe('available');
      expect(result.message).toMatch(/No pending debts to settle for your account/i);
      expect(mocks.writeContract).not.toHaveBeenCalled();
    });

    it('settles multiple creditors for current user and updates store with receipts', async () => {
      // Alice paid 40 split between Alice and Bob (Bob owes 20)
      // Charlie paid 30 split between Charlie and Bob (Bob owes 15)
      const exp1: Expense = {
        id: 'exp-1',
        partyId,
        description: 'Dinner',
        amount: 40,
        paidById: userAlice.id,
        paidByName: userAlice.name,
        paidByAvatar: '',
        splitBetweenIds: [userAlice.id, userBob.id],
        createdAt: 'Just now',
        isSettled: false,
      };
      const exp2: Expense = {
        id: 'exp-2',
        partyId,
        description: 'Taxis',
        amount: 30,
        paidById: userCharlie.id,
        paidByName: userCharlie.name,
        paidByAvatar: '',
        splitBetweenIds: [userCharlie.id, userBob.id],
        createdAt: 'Just now',
        isSettled: false,
      };

      usePartyStore.setState({ expenses: [exp1, exp2] });

      mocks.writeContract
        .mockResolvedValueOnce('0xtx-settle-alice')
        .mockResolvedValueOnce('0xtx-settle-charlie');
      mocks.waitForTransactionReceipt
        .mockResolvedValueOnce({ status: 'success', blockNumber: BigInt(301) })
        .mockResolvedValueOnce({ status: 'success', blockNumber: BigInt(302) });

      const result = await usePartyStore.getState().settleAllDebts(partyId, {
        wallet: mockWallet,
      });

      expect(result.status).toBe('available');
      expect(result.partial).toBeFalsy();
      expect(result.message).toMatch(/debts settled successfully/i);
      expect(mocks.writeContract).toHaveBeenCalledTimes(2);

      // Verify activities were added for settlements
      const state = usePartyStore.getState();
      expect(state.activities.length).toBeGreaterThan(0);
    });

    it('handles mid-batch failure: updates store for confirmed transfer and enables duplicate-free retry', async () => {
      // Alice paid 40 split [Alice, Bob] -> Bob owes Alice 20
      // Charlie paid 30 split [Charlie, Bob] -> Bob owes Charlie 15
      const exp1: Expense = {
        id: 'exp-1',
        partyId,
        description: 'Dinner',
        amount: 40,
        paidById: userAlice.id,
        paidByName: userAlice.name,
        paidByAvatar: '',
        splitBetweenIds: [userAlice.id, userBob.id],
        createdAt: 'Just now',
        isSettled: false,
      };
      const exp2: Expense = {
        id: 'exp-2',
        partyId,
        description: 'Taxis',
        amount: 30,
        paidById: userCharlie.id,
        paidByName: userCharlie.name,
        paidByAvatar: '',
        splitBetweenIds: [userCharlie.id, userBob.id],
        createdAt: 'Just now',
        isSettled: false,
      };

      usePartyStore.setState({ expenses: [exp1, exp2] });

      // Transfer 1 (to Alice) succeeds, Transfer 2 (to Charlie) fails
      mocks.writeContract
        .mockResolvedValueOnce('0xtx-alice-ok')
        .mockRejectedValueOnce(new Error('User rejected transfer to Charlie'));
      mocks.waitForTransactionReceipt.mockResolvedValueOnce({
        status: 'success',
        blockNumber: BigInt(401),
      });

      const initialResult = await usePartyStore.getState().settleAllDebts(partyId, {
        wallet: mockWallet,
      });

      // Assert explicit partial outcome
      expect(initialResult.partial).toBe(true);
      expect(initialResult.settledCount).toBe(1);
      expect(initialResult.remainingCount).toBe(1);
      expect(initialResult.message).toMatch(/partial settlement/i);

      // Verify that the store has preserved the first transfer (e.g. settlement expense added)
      const intermediateExpenses = usePartyStore.getState().expenses;
      const settledAliceExpense = intermediateExpenses.find((e) => e.txHash === '0xtx-alice-ok');
      expect(settledAliceExpense).toBeDefined();

      // RETRY SUBMISSION:
      // The user retries settling debts now.
      // Crucial test: Does Bob pay Alice again? NO! Alice is already settled!
      // Only the remaining transfer to Charlie should be executed.
      mocks.writeContract.mockReset();
      mocks.waitForTransactionReceipt.mockReset();

      mocks.writeContract.mockResolvedValueOnce('0xtx-charlie-retry-ok');
      mocks.waitForTransactionReceipt.mockResolvedValueOnce({
        status: 'success',
        blockNumber: BigInt(402),
      });

      const retryResult = await usePartyStore.getState().settleAllDebts(partyId, {
        wallet: mockWallet,
      });

      expect(retryResult.status).toBe('available');
      expect(retryResult.partial).toBeFalsy();
      expect(mocks.writeContract).toHaveBeenCalledTimes(1);
      expect(mocks.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'settleDebt',
          args: [expect.any(String), creditorAddress2], // Charlie only!
        })
      );
    });
  });
});
