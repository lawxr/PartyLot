import type { Expense, Member, NetBalance, DebtSettlement } from '../types';

const MON_SCALE = 10_000;

function toMonUnits(amount: number): number {
  return Math.round(amount * MON_SCALE);
}

function fromMonUnits(units: number): number {
  return units / MON_SCALE;
}

export function formatMonAmount(amount: number): string {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })} MON`;
}

/**
 * Calculates net balances in 0.0001 MON units so allocation and settlement
 * preserve every supported unit instead of rounding each participant to cents.
 */
export function calculateNetBalances(expenses: Expense[], members: Member[]): NetBalance[] {
  const balanceUnits: Record<string, number> = {};
  const metaMap: Record<string, { name: string; avatar?: string }> = {};

  members.forEach((member) => {
    balanceUnits[member.id] = 0;
    metaMap[member.id] = { name: member.name, avatar: member.avatar };
  });

  expenses.forEach((expense) => {
    if (expense.isSettled) return;

    // A repeated participant ID is one person, not an extra weighted share.
    const participants = [...new Set(expense.splitBetweenIds || [])];
    if (participants.length === 0) return;

    if (expense.paidById && !metaMap[expense.paidById]) {
      metaMap[expense.paidById] = {
        name: expense.paidByName || 'Former Member',
        avatar: expense.paidByAvatar,
      };
    }

    const amountUnits = toMonUnits(expense.amount);
    const shareUnits = Math.floor(amountUnits / participants.length);
    const remainderUnits = amountUnits % participants.length;

    balanceUnits[expense.paidById] = (balanceUnits[expense.paidById] || 0) + amountUnits;

    participants.forEach((participantId, index) => {
      const allocatedUnits = shareUnits + (index < remainderUnits ? 1 : 0);
      balanceUnits[participantId] = (balanceUnits[participantId] || 0) - allocatedUnits;
      if (!metaMap[participantId]) {
        metaMap[participantId] = { name: 'Former Member', avatar: '' };
      }
    });
  });

  const result: NetBalance[] = [];
  const visited = new Set<string>();

  members.forEach((member) => {
    visited.add(member.id);
    result.push({
      memberId: member.id,
      memberName: member.name,
      avatar: member.avatar,
      netAmount: fromMonUnits(balanceUnits[member.id] || 0),
    });
  });

  Object.keys(balanceUnits).forEach((id) => {
    if (visited.has(id) || balanceUnits[id] === 0) return;
    result.push({
      memberId: id,
      memberName: metaMap[id]?.name || 'Former Member',
      avatar: metaMap[id]?.avatar || '',
      netAmount: fromMonUnits(balanceUnits[id]),
    });
  });

  return result;
}

/** Computes a compact settlement plan using exact 0.0001 MON integer units. */
export function computeDebtSettlements(
  netBalances: NetBalance[],
  members: Member[]
): DebtSettlement[] {
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const creditors: { id: string; units: number }[] = [];
  const debtors: { id: string; units: number }[] = [];

  netBalances.forEach((balance) => {
    const units = toMonUnits(balance.netAmount);
    if (units > 0) creditors.push({ id: balance.memberId, units });
    else if (units < 0) debtors.push({ id: balance.memberId, units: -units });
  });

  creditors.sort((a, b) => b.units - a.units);
  debtors.sort((a, b) => b.units - a.units);

  const settlements: DebtSettlement[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const settleUnits = Math.min(creditor.units, debtor.units);

    const fromMember = memberMap.get(debtor.id);
    const toMember = memberMap.get(creditor.id);
    settlements.push({
      fromId: debtor.id,
      fromName: fromMember?.name || 'Guest',
      fromAvatar: fromMember?.avatar || '',
      toId: creditor.id,
      toName: toMember?.name || 'Guest',
      toAvatar: toMember?.avatar || '',
      amount: fromMonUnits(settleUnits),
    });

    creditor.units -= settleUnits;
    debtor.units -= settleUnits;
    if (creditor.units === 0) creditorIndex++;
    if (debtor.units === 0) debtorIndex++;
  }

  return settlements;
}
