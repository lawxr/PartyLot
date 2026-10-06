import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// High-fidelity BigInt simulation of PartyTreasury contract state & invariants
interface PartyPot {
  host: string;
  balance: bigint;
  totalDeposited: bigint;
  totalDistributed: bigint;
  exists: boolean;
}

class SimulatedPartyTreasury {
  owner: string;
  parties: Map<string, PartyPot> = new Map();
  memberBalances: Map<string, Map<string, bigint>> = new Map();
  tokenBalances: Map<string, Map<string, bigint>> = new Map();

  constructor(ownerAddress: string) {
    this.owner = ownerAddress.toLowerCase();
  }

  registerParty(caller: string, partyId: string, host: string) {
    if (caller.toLowerCase() !== this.owner) {
      throw new Error('Only contract owner authorized');
    }
    if (!host || host === '0x0000000000000000000000000000000000000000') {
      throw new Error('Invalid host address');
    }
    if (this.parties.get(partyId)?.exists) {
      throw new Error('Party already registered');
    }

    this.parties.set(partyId, {
      host: host.toLowerCase(),
      balance: BigInt(0),
      totalDeposited: BigInt(0),
      totalDistributed: BigInt(0),
      exists: true,
    });
  }

  deposit(caller: string, partyId: string, value: bigint) {
    if (value <= BigInt(0)) throw new Error('Deposit must be > 0');
    const pot = this.parties.get(partyId);
    if (!pot || !pot.exists) {
      throw new Error('Party not registered');
    }

    pot.balance += value;
    pot.totalDeposited += value;

    if (!this.memberBalances.has(partyId)) {
      this.memberBalances.set(partyId, new Map());
    }
    const partyMembers = this.memberBalances.get(partyId)!;
    const currentMemberBal = partyMembers.get(caller.toLowerCase()) || BigInt(0);
    partyMembers.set(caller.toLowerCase(), currentMemberBal + value);
  }

  depositToken(caller: string, partyId: string, token: string, amount: bigint) {
    if (!token || token === '0x0000000000000000000000000000000000000000') {
      throw new Error('Invalid token address');
    }
    if (amount <= BigInt(0)) throw new Error('Amount must be > 0');
    const pot = this.parties.get(partyId);
    if (!pot || !pot.exists) {
      throw new Error('Party not registered');
    }

    if (!this.tokenBalances.has(partyId)) {
      this.tokenBalances.set(partyId, new Map());
    }
    const partyTokens = this.tokenBalances.get(partyId)!;
    const currentTokenBal = partyTokens.get(token.toLowerCase()) || BigInt(0);
    partyTokens.set(token.toLowerCase(), currentTokenBal + amount);
  }

  executeReimbursement(caller: string, partyId: string, amount: bigint) {
    const pot = this.parties.get(partyId);
    if (!pot || !pot.exists) throw new Error('Party does not exist');
    if (caller.toLowerCase() !== pot.host && caller.toLowerCase() !== this.owner) {
      throw new Error('Only party host or contract owner authorized');
    }
    if (amount <= BigInt(0)) throw new Error('Amount must be > 0');
    if (pot.balance < amount) throw new Error('Insufficient treasury balance');

    pot.balance -= amount;
    pot.totalDistributed += amount;
  }

  claimProRataRefund(caller: string, partyId: string): bigint {
    const pot = this.parties.get(partyId);
    if (!pot || !pot.exists) throw new Error('Party does not exist');
    if (pot.balance <= BigInt(0)) throw new Error('No remaining balance in pot');

    const partyMembers = this.memberBalances.get(partyId);
    const userDeposited = partyMembers?.get(caller.toLowerCase()) || BigInt(0);
    if (userDeposited <= BigInt(0)) throw new Error('No contribution to refund');
    if (pot.totalDeposited <= BigInt(0)) throw new Error('Zero total deposits');

    let refundAmount: bigint;
    if (userDeposited >= pot.totalDeposited) {
      refundAmount = pot.balance;
      pot.totalDeposited = BigInt(0);
    } else {
      refundAmount = (userDeposited * pot.balance) / pot.totalDeposited;
      pot.totalDeposited -= userDeposited;
    }

    if (refundAmount <= BigInt(0)) throw new Error('Refund amount too small');

    partyMembers!.set(caller.toLowerCase(), BigInt(0));
    pot.balance -= refundAmount;

    return refundAmount;
  }

  rolloverToNextParty(caller: string, fromPartyId: string, toPartyId: string) {
    if (fromPartyId === toPartyId) throw new Error('Cannot rollover to same party');
    const sourcePot = this.parties.get(fromPartyId);
    if (!sourcePot || !sourcePot.exists) throw new Error('Source party does not exist');
    if (caller.toLowerCase() !== sourcePot.host && caller.toLowerCase() !== this.owner) {
      throw new Error('Only party host or contract owner authorized');
    }
    const remaining = sourcePot.balance;
    if (remaining <= BigInt(0)) throw new Error('No funds to rollover');

    sourcePot.balance = BigInt(0);

    const destPot = this.parties.get(toPartyId);
    if (!destPot || !destPot.exists) {
      throw new Error('Destination party not registered');
    }
    if (destPot.host !== sourcePot.host && caller.toLowerCase() !== this.owner) {
      throw new Error('Destination host mismatch');
    }

    destPot.balance += remaining;
    destPot.totalDeposited += remaining;
  }
}

describe('PartyTreasury Contract Security & Pro-Rata Math (MKT-04)', () => {
  const relayerOwner = '0x1111111111111111111111111111111111111111';
  const legitimateHost = '0x2222222222222222222222222222222222222222';
  const attacker = '0x6666666666666666666666666666666666666666';
  const alice = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const bob = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
  const charlie = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';

  let treasury: SimulatedPartyTreasury;

  beforeEach(() => {
    treasury = new SimulatedPartyTreasury(relayerOwner);
  });

  describe('Solidity Source Invariants (contracts/PartyTreasury.sol)', () => {
    const contractPath = path.resolve(__dirname, '../../contracts/PartyTreasury.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    it('requires registered party on deposit and removes auto-registration', () => {
      const depositFunc = source.slice(source.indexOf('function deposit('), source.indexOf('function distributeReward('));
      expect(depositFunc).toContain('require(pot.exists, "Party not registered");');
      expect(depositFunc).not.toContain('pot.host = msg.sender');
    });

    it('requires registered party on depositToken and removes auto-registration', () => {
      const depositTokenFunc = source.slice(source.indexOf('function depositToken('), source.indexOf('function distributeTokenReward('));
      expect(depositTokenFunc).toContain('require(pot.exists, "Party not registered");');
      expect(depositTokenFunc).not.toContain('pot.host = msg.sender');
    });

    it('restricts registerParty to contract owner relayer', () => {
      const registerFunc = source.slice(source.indexOf('function registerParty('), source.indexOf('function deposit('));
      expect(registerFunc).toContain('external onlyOwner');
    });

    it('updates totalDeposited and handles last claimant in claimProRataRefund', () => {
      const refundFunc = source.slice(source.indexOf('function claimProRataRefund('), source.indexOf('function closePartyAndWithdrawRemaining('));
      expect(refundFunc).toContain('pot.totalDeposited -= userDeposited');
      expect(refundFunc).toContain('if (userDeposited >= pot.totalDeposited)');
      expect(refundFunc).toContain('refundAmount = pot.balance');
    });

    it('guards destination party registration in rolloverToNextParty', () => {
      const rolloverFunc = source.slice(source.indexOf('function rolloverToNextParty('), source.indexOf('function depositToken('));
      expect(rolloverFunc).toContain('require(destPot.exists, "Destination party not registered");');
    });
  });

  describe('Vulnerability Prevention: Host Preclaim & Authority Binding', () => {
    const partyId = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    it('reverts when attacker attempts to deposit to an unregistered party pot', () => {
      expect(() => {
        treasury.deposit(attacker, partyId, BigInt('1000000000000000000'));
      }).toThrow('Party not registered');

      expect(treasury.parties.get(partyId)).toBeUndefined();
    });

    it('reverts when attacker attempts to depositToken to an unregistered party pot', () => {
      expect(() => {
        treasury.depositToken(attacker, partyId, '0xusdc', BigInt(1000000));
      }).toThrow('Party not registered');

      expect(treasury.parties.get(partyId)).toBeUndefined();
    });

    it('reverts when attacker attempts to call registerParty directly', () => {
      expect(() => {
        treasury.registerParty(attacker, partyId, attacker);
      }).toThrow('Only contract owner authorized');
    });

    it('binds canonical host authority through relayer registration', () => {
      treasury.registerParty(relayerOwner, partyId, legitimateHost);
      const pot = treasury.parties.get(partyId)!;
      expect(pot.exists).toBe(true);
      expect(pot.host).toBe(legitimateHost.toLowerCase());

      // Attacker cannot register over it
      expect(() => {
        treasury.registerParty(relayerOwner, partyId, attacker);
      }).toThrow('Party already registered');
    });

    it('prevents rollover into an unregistered destination party pot', () => {
      const sourceParty = '0x1111111111111111111111111111111111111111111111111111111111111111';
      const destParty = '0x2222222222222222222222222222222222222222222222222222222222222222';

      treasury.registerParty(relayerOwner, sourceParty, legitimateHost);
      treasury.deposit(alice, sourceParty, BigInt(1000));

      expect(() => {
        treasury.rolloverToNextParty(legitimateHost, sourceParty, destParty);
      }).toThrow('Destination party not registered');
    });
  });

  describe('Pro-Rata Refund Math & Conservation Invariants', () => {
    const partyId = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    beforeEach(() => {
      treasury.registerParty(relayerOwner, partyId, legitimateHost);
    });

    it('conserves 100% of pot for equal 10+10 contributions with 0 spent (Alice then Bob)', () => {
      const tenMon = BigInt('10000000000000000000'); // 10 MON
      treasury.deposit(alice, partyId, tenMon);
      treasury.deposit(bob, partyId, tenMon);

      const aliceRefund = treasury.claimProRataRefund(alice, partyId);
      expect(aliceRefund).toBe(tenMon);

      const bobRefund = treasury.claimProRataRefund(bob, partyId);
      expect(bobRefund).toBe(tenMon);

      const pot = treasury.parties.get(partyId)!;
      expect(pot.balance).toBe(BigInt(0));
      expect(pot.totalDeposited).toBe(BigInt(0));
    });

    it('order independence: conserves 100% of pot for equal 10+10 contributions (Bob then Alice)', () => {
      const tenMon = BigInt('10000000000000000000');
      treasury.deposit(alice, partyId, tenMon);
      treasury.deposit(bob, partyId, tenMon);

      const bobRefund = treasury.claimProRataRefund(bob, partyId);
      expect(bobRefund).toBe(tenMon);

      const aliceRefund = treasury.claimProRataRefund(alice, partyId);
      expect(aliceRefund).toBe(tenMon);

      const pot = treasury.parties.get(partyId)!;
      expect(pot.balance).toBe(BigInt(0));
      expect(pot.totalDeposited).toBe(BigInt(0));
    });

    it('distributes 50% fair share for equal 10+10 contributions when 4 MON spent (16 MON remaining)', () => {
      const tenMon = BigInt('10000000000000000000');
      const fourMon = BigInt('4000000000000000000');
      const eightMon = BigInt('8000000000000000000');

      treasury.deposit(alice, partyId, tenMon);
      treasury.deposit(bob, partyId, tenMon);

      treasury.executeReimbursement(legitimateHost, partyId, fourMon);
      expect(treasury.parties.get(partyId)!.balance).toBe(BigInt('16000000000000000000'));

      // Alice claims first -> gets 8 MON
      const aliceRefund = treasury.claimProRataRefund(alice, partyId);
      expect(aliceRefund).toBe(eightMon);

      // Bob claims second -> gets 8 MON (previously would have gotten 4 MON due to fixed denominator bug!)
      const bobRefund = treasury.claimProRataRefund(bob, partyId);
      expect(bobRefund).toBe(eightMon);

      const pot = treasury.parties.get(partyId)!;
      expect(pot.balance).toBe(BigInt(0));
      expect(pot.totalDeposited).toBe(BigInt(0));
    });

    it('order independence on partial spend: Bob then Alice yields identical 8 MON each', () => {
      const tenMon = BigInt('10000000000000000000');
      const fourMon = BigInt('4000000000000000000');
      const eightMon = BigInt('8000000000000000000');

      treasury.deposit(alice, partyId, tenMon);
      treasury.deposit(bob, partyId, tenMon);
      treasury.executeReimbursement(legitimateHost, partyId, fourMon);

      const bobRefund = treasury.claimProRataRefund(bob, partyId);
      expect(bobRefund).toBe(eightMon);

      const aliceRefund = treasury.claimProRataRefund(alice, partyId);
      expect(aliceRefund).toBe(eightMon);

      const pot = treasury.parties.get(partyId)!;
      expect(pot.balance).toBe(BigInt(0));
      expect(pot.totalDeposited).toBe(BigInt(0));
    });

    it('handles unequal multi-participant contributions (10 + 20 + 30) with partial spend (12 spent, 48 remaining)', () => {
      const ten = BigInt(10_000_000);
      const twenty = BigInt(20_000_000);
      const thirty = BigInt(30_000_000);
      const spent = BigInt(12_000_000);

      const runPermutation = (order: string[]) => {
        const testTreasury = new SimulatedPartyTreasury(relayerOwner);
        testTreasury.registerParty(relayerOwner, partyId, legitimateHost);
        testTreasury.deposit(alice, partyId, ten);
        testTreasury.deposit(bob, partyId, twenty);
        testTreasury.deposit(charlie, partyId, thirty);
        testTreasury.executeReimbursement(legitimateHost, partyId, spent);

        const results: Record<string, bigint> = {};
        for (const user of order) {
          results[user] = testTreasury.claimProRataRefund(user, partyId);
        }

        expect(results[alice]).toBe(BigInt(8_000_000)); // 10/60 * 48 = 8
        expect(results[bob]).toBe(BigInt(16_000_000)); // 20/60 * 48 = 16
        expect(results[charlie]).toBe(BigInt(24_000_000)); // 30/60 * 48 = 24
        expect(testTreasury.parties.get(partyId)!.balance).toBe(BigInt(0));
        expect(testTreasury.parties.get(partyId)!.totalDeposited).toBe(BigInt(0));
      };

      runPermutation([alice, bob, charlie]);
      runPermutation([charlie, bob, alice]);
      runPermutation([bob, alice, charlie]);
    });

    it('refunds 100% of remaining balance to single depositor', () => {
      treasury.deposit(alice, partyId, BigInt(50_000));
      treasury.executeReimbursement(legitimateHost, partyId, BigInt(10_000));

      const refund = treasury.claimProRataRefund(alice, partyId);
      expect(refund).toBe(BigInt(40_000));
      expect(treasury.parties.get(partyId)!.balance).toBe(BigInt(0));
    });

    it('prevents double refund by same participant', () => {
      treasury.deposit(alice, partyId, BigInt(100));
      treasury.deposit(bob, partyId, BigInt(100));
      treasury.claimProRataRefund(alice, partyId);

      expect(() => {
        treasury.claimProRataRefund(alice, partyId);
      }).toThrow('No contribution to refund');
    });

    it('reverts when pot has zero remaining balance', () => {
      treasury.deposit(alice, partyId, BigInt(100));
      treasury.executeReimbursement(legitimateHost, partyId, BigInt(100));

      expect(() => {
        treasury.claimProRataRefund(alice, partyId);
      }).toThrow('No remaining balance in pot');
    });

    it('reverts when non-depositor attempts refund', () => {
      treasury.deposit(alice, partyId, BigInt(100));

      expect(() => {
        treasury.claimProRataRefund(bob, partyId);
      }).toThrow('No contribution to refund');
    });
  });
});
