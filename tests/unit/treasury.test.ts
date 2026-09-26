import { describe, it, expect } from 'vitest';
import {
  calculateTotalContributed,
  calculateTotalSpent,
  getFinancialActionsUnavailableMessage,
  getFinancialActionUnavailableResult,
  FINANCIAL_ACTIONS_AVAILABLE,
} from '@/services/treasury';
import type { PotTransaction } from '@/types';

describe('Treasury Service', () => {
  const mockTransactions: PotTransaction[] = [
    {
      id: 'tx1',
      partyId: 'p1',
      type: 'add',
      amount: 100,
      description: 'Initial contribution',
      userName: 'Alice',
      userAvatar: '',
      timestamp: '2026-10-01T10:00:00Z',
    },
    {
      id: 'tx2',
      partyId: 'p1',
      type: 'add',
      amount: 50,
      description: 'Top-up contribution',
      userName: 'Bob',
      userAvatar: '',
      timestamp: '2026-10-01T11:00:00Z',
    },
    {
      id: 'tx3',
      partyId: 'p1',
      type: 'spend',
      amount: 60,
      description: 'Sound equipment rental',
      userName: 'Alice',
      userAvatar: '',
      timestamp: '2026-10-01T12:00:00Z',
    },
    {
      id: 'tx4',
      partyId: 'p1',
      type: 'spend',
      amount: 25,
      description: 'Ice and cups',
      userName: 'Charlie',
      userAvatar: '',
      timestamp: '2026-10-01T13:00:00Z',
    },
    {
      id: 'tx5',
      partyId: 'p1',
      type: 'reward',
      amount: 10,
      description: 'DJ bounty reward',
      userName: 'Dave',
      userAvatar: '',
      timestamp: '2026-10-01T14:00:00Z',
    },
    {
      id: 'tx6',
      partyId: 'p1',
      type: 'rollover',
      amount: 15,
      description: 'Rollover from last gathering',
      userName: 'System',
      userAvatar: '',
      timestamp: '2026-10-01T09:00:00Z',
    },
  ];

  describe('calculateTotalContributed', () => {
    it('sums only transactions of type "add"', () => {
      const total = calculateTotalContributed(mockTransactions);
      // 100 (tx1) + 50 (tx2) = 150
      expect(total).toBe(150);
    });

    it('returns 0 when there are no transactions', () => {
      expect(calculateTotalContributed([])).toBe(0);
    });
  });

  describe('calculateTotalSpent', () => {
    it('sums only transactions of type "spend"', () => {
      const total = calculateTotalSpent(mockTransactions);
      // 60 (tx3) + 25 (tx4) = 85
      expect(total).toBe(85);
    });

    it('returns 0 when there are no transactions', () => {
      expect(calculateTotalSpent([])).toBe(0);
    });
  });

  describe('Financial Action Availability Status', () => {
    it('reports availability aligned with Monad Testnet configuration', () => {
      expect(FINANCIAL_ACTIONS_AVAILABLE).toBe(true);
    });

    it('provides localized messages for Spanish and English', () => {
      const msgEs = getFinancialActionsUnavailableMessage('es');
      const msgEn = getFinancialActionsUnavailableMessage('en');

      expect(msgEs).toContain('Monad Testnet');
      expect(msgEn).toContain('Monad Testnet');
    });

    it('returns typed result object for financial action status', () => {
      const res = getFinancialActionUnavailableResult('en');
      expect(res.status).toBe('available');
      expect(res.message).toBeDefined();
    });
  });
});
