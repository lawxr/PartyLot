import type { Expense, Member, NetBalance, DebtSettlement } from '../types';

/**
 * Calculates net balance for every member in the party based on registered expenses.
 * Net balance > 0: Member should receive money back (+)
 * Net balance < 0: Member owes money (-)
 */
export function calculateNetBalances(expenses: Expense[], members: Member[]): NetBalance[] {
  const balanceMap: Record<string, number> = {};

  // Initialize all members with 0
  members.forEach((m) => {
    balanceMap[m.id] = 0;
  });

  // Accumulate paid amounts and owed shares for unsettled expenses
  expenses.forEach((exp) => {
    if (exp.isSettled) return;
    if (!exp.splitBetweenIds || exp.splitBetweenIds.length === 0) return;

    const share = exp.amount / exp.splitBetweenIds.length;

    // Credit payer
    balanceMap[exp.paidById] = (balanceMap[exp.paidById] || 0) + exp.amount;

    // Debit split participants
    exp.splitBetweenIds.forEach((participantId) => {
      balanceMap[participantId] = (balanceMap[participantId] || 0) - share;
    });
  });

  return members.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    avatar: m.avatar,
    netAmount: Math.round((balanceMap[m.id] || 0) * 100) / 100,
  }));
}

/**
 * Computes optimal debt settlements between members using a greedy matching algorithm.
 * Minimizes total number of transactions needed to settle all debts.
 */
export function computeDebtSettlements(
  netBalances: NetBalance[],
  members: Member[]
): DebtSettlement[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  netBalances.forEach((b) => {
    if (b.netAmount > 0.01) {
      creditors.push({ id: b.memberId, amount: b.netAmount });
    } else if (b.netAmount < -0.01) {
      debtors.push({ id: b.memberId, amount: -b.netAmount });
    }
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: DebtSettlement[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const settleAmount = Math.min(creditor.amount, debtor.amount);
    const roundedAmount = Math.round(settleAmount * 100) / 100;

    if (roundedAmount > 0) {
      const fromMember = memberMap.get(debtor.id);
      const toMember = memberMap.get(creditor.id);

      settlements.push({
        fromId: debtor.id,
        fromName: fromMember?.name || 'Guest',
        fromAvatar: fromMember?.avatar || '',
        toId: creditor.id,
        toName: toMember?.name || 'Guest',
        toAvatar: toMember?.avatar || '',
        amount: roundedAmount,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) cIdx++;
    if (debtor.amount < 0.01) dIdx++;
  }

  return settlements;
}
