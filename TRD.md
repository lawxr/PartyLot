# Partylot — TRD.md

> **Document type:** Technical Requirements Document  
> **Project:** Partylot  
> **Primary track:** Social, Attention & Culture  
> **Primary goal:** Ship a real, mobile-first social product where private groups can gather, play, split expenses, manage shared money, and build persistent shared history without exposing blockchain complexity.

---

# 1. Product Summary

Partylot is a private social app for real-world groups.

The product revolves around persistent **Crews** and individual **Parties / Gatherings**.

Users can:
- authenticate with a familiar login method,
- create or join a private party,
- join through a short invite code,
- see who is attending,
- play group games,
- vote in polls,
- split shared expenses,
- contribute to a shared Party Pot,
- settle balances,
- reward contributions,
- see live group activity,
- generate an afterparty recap,
- return to the same Crew later.

The app should feel like a premium consumer social product. Blockchain is used only where it creates ownership, verifiability, settlement, portability, or shared economic state.

---

# 2. Technical Principles

## 2.1 Consumer-first

Users should not need to understand gas, RPCs, chain IDs, seed phrases, bridges, smart contracts, or transaction hashes.

Use language such as:

```text
Join party
Add to pot
Settle up
Reward Ana
You're in
Paid
```

Avoid:

```text
Connect wallet
Sign transaction
Switch network
Broadcast transaction
```

## 2.2 Onchain only when necessary

### Onchain
- Crew ownership where needed
- selected membership records
- Party Pot / treasury
- deposits
- reimbursements
- settlements
- contribution rewards
- selected treasury decisions
- portable participation attestations if implemented

### Offchain
- photos
- comments
- invite-code lookup
- party descriptions
- live presence
- transient game state
- non-economic polls
- recap rendering
- notifications
- most social activity metadata

## 2.3 Real functionality only

No visible core interaction may pretend to be implemented.

Forbidden:
- fake payment success
- fake realtime updates
- hardcoded balances presented as real
- buttons that only trigger a toast
- random fake users
- placeholder activity presented as production data

A feature must be either functional, clearly disabled, or clearly marked as development/demo data.

---

# 3. Recommended Stack

## Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Serwist / PWA
- viem

## Authentication / Wallet
- Privy
- Embedded EVM wallet
- Smart account where configured
- Sponsored transactions if available

## Backend
- Supabase
- PostgreSQL
- Supabase Realtime or equivalent

## Blockchain
- Monad
- Solidity
- viem

## Indexing
- Envio HyperIndex / HyperSync / HyperRPC

## Cross-chain funding
- Aurora Intents
- Intents Connect preferred

## Observability
- Tenderly
- QuickNode or equivalent RPC

---

# 4. Core Domain Model

## 4.1 User

```ts
type User = {
  id: string;
  privyUserId: string;
  walletAddress: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  locationLabel?: string;
  createdAt: string;
  updatedAt: string;
};
```

## 4.2 Crew

```ts
type Crew = {
  id: string;
  name: string;
  coverUrl?: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
};
```

## 4.3 CrewMember

```ts
type CrewMember = {
  id: string;
  crewId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
};
```

## 4.4 Party

```ts
type Party = {
  id: string;
  crewId: string;
  hostUserId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  locationLabel?: string;
  startsAt: string;
  endsAt?: string;
  status: "draft" | "scheduled" | "live" | "ended" | "cancelled";
  createdAt: string;
};
```

## 4.5 PartyMember

```ts
type PartyMember = {
  id: string;
  partyId: string;
  userId: string;
  status: "invited" | "going" | "maybe" | "declined";
  joinedAt?: string;
};
```

## 4.6 Invite

```ts
type PartyInvite = {
  id: string;
  partyId: string;
  shortCode: string;
  secureTokenHash: string;
  expiresAt?: string;
  maxUses?: number;
  uses: number;
  revokedAt?: string;
  createdByUserId: string;
};
```

Requirements:
- short code is UX, not the only security primitive,
- expiry,
- revocation,
- usage limits,
- rate limiting,
- auditable usage.

## 4.7 Expense

```ts
type Expense = {
  id: string;
  partyId: string;
  description: string;
  amount: string;
  paidByUserId: string;
  currency: string;
  createdAt: string;
};
```

## 4.8 ExpenseShare

```ts
type ExpenseShare = {
  id: string;
  expenseId: string;
  userId: string;
  amountOwed: string;
  amountSettled: string;
};
```

Invariant:

```text
sum(amountOwed) == expense.amount
```

with deterministic rounding.

## 4.9 Settlement

```ts
type Settlement = {
  id: string;
  partyId: string;
  fromUserId: string;
  toUserId: string;
  amount: string;
  currency: string;
  status: "pending" | "confirmed" | "failed";
  transactionHash?: string;
  createdAt: string;
};
```

## 4.10 Party Pot

```ts
type PartyPot = {
  partyId: string;
  contractAddress?: string;
  assetAddress?: string;
  assetSymbol?: string;
};
```

The displayed balance must derive from actual chain/indexed state.

## 4.11 Contribution

```ts
type Contribution = {
  id: string;
  partyId: string;
  title: string;
  description?: string;
  rewardAmount?: string;
  rewardCurrency?: string;
  claimedByUserId?: string;
  verifiedByUserId?: string;
  status: "open" | "claimed" | "completed" | "verified" | "paid";
};
```

## 4.12 Poll

```ts
type Poll = {
  id: string;
  partyId: string;
  question: string;
  type: "single" | "multiple";
  closesAt?: string;
  createdByUserId: string;
};
```

```ts
type PollOption = {
  id: string;
  pollId: string;
  label: string;
};
```

```ts
type PollVote = {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
};
```

Default invariant:

```text
one user = one vote per single-choice poll
```

unless revoting is intentionally supported.

## 4.13 GameSession

```ts
type GameSession = {
  id: string;
  partyId: string;
  gameType: "most_likely" | "this_or_that" | "crew_trivia";
  status: "waiting" | "active" | "finished";
  currentRound: number;
  createdAt: string;
};
```

## 4.14 Activity

```ts
type ActivityItem = {
  id: string;
  partyId?: string;
  crewId?: string;
  actorUserId?: string;
  type:
    | "member_joined"
    | "poll_created"
    | "poll_voted"
    | "expense_added"
    | "pot_deposit"
    | "settlement_confirmed"
    | "game_won"
    | "reward_paid";
  metadata: Record<string, unknown>;
  createdAt: string;
};
```

Activity must be generated from real events.

---

# 5. Smart Contract Architecture

## 5.1 PartyFactory

Responsibilities:
- create/register party references,
- associate owner,
- register PartyVault,
- authorize managers where needed.

Possible interface:

```solidity
function createParty(
    bytes32 partyId,
    address owner,
    address asset
) external returns (address vault);
```

## 5.2 PartyVault

Responsibilities:
- deposits,
- reimbursements,
- rewards,
- withdrawals,
- duplicate execution protection,
- event emission.

Potential interface:

```solidity
function deposit(uint256 amount) external;

function depositFor(
    address member,
    uint256 amount
) external;

function reimburse(
    bytes32 reimbursementId,
    address recipient,
    uint256 amount
) external;

function reward(
    bytes32 rewardId,
    address recipient,
    uint256 amount
) external;

function withdraw(
    address recipient,
    uint256 amount
) external;
```

Security requirements:
- access control,
- replay protection,
- duplicate reimbursement protection,
- duplicate reward protection,
- safe ERC-20 transfers,
- no arbitrary caller-controlled payouts.

## 5.3 Participation Registry

Optional for MVP.

Purpose:
- portable participation attestations,
- aggregate shared-experience signals.

Never store private party content.

---

# 6. Contract Events

Minimum recommended events:

```solidity
event PartyCreated(...);
event MemberRegistered(...);
event PotDeposited(...);
event Reimbursed(...);
event RewardPaid(...);
event SettlementRecorded(...);
```

Events should be stable before Envio indexing.

---

# 7. Privy Requirements

Privy must go beyond login.

## Authentication

Expected flow:

```text
Open app
→ Continue with Google / Apple / Email
→ Privy auth
→ embedded wallet created/recovered
→ Home
```

## Wallet requirements
- same authenticated user recovers same wallet,
- logout/login must not create duplicates,
- wallet maps to one Partylot user,
- signing state must be handled correctly.

## Transaction UX

User sees:

```text
Add $10
Pay
Settle up
Reward
```

Internally:

```text
construct
→ sign
→ broadcast
→ confirm
→ reconcile UI
```

UI states:

```text
idle
loading
confirmed
failed
```

No fake confirmations.

---

# 8. Aurora Intents Requirements

Optional but recommended.

Primary flow:

```text
Any supported asset / source chain
→ Aurora Intents
→ route / swap
→ Monad
→ PartyVault.depositFor(...)
```

Preferred:
**Intents Connect**

Success criteria:
- real source asset,
- real cross-chain flow,
- actual arrival on Monad,
- actual Partylot contract execution,
- failure/refund handling,
- no mocked completion.

User-facing wording:

```text
Add $10
```

not:

```text
Bridge USDC from Base to Monad
```

---

# 9. Envio Requirements

Preferred architecture:

```text
Monad contract event
→ Envio
→ indexed normalized data
→ Partylot activity / chain-derived UI
```

Examples:
- pot deposit,
- settlement,
- reimbursement,
- reward.

Do not maintain a second fake chain activity feed in parallel.

---

# 10. Information Architecture

Primary tabs:

```text
Home
Crews
Tonight
Profile
```

Party actions:

```text
Play
Split
Pot
Poll
```

---

# 11. App Flow

## 11.1 First-Time User

```text
Launch
↓
Onboarding
↓
Google / Apple / Email
↓
Privy authentication
↓
Embedded wallet created/recovered
↓
Create profile
↓
Home
```

Acceptance:
- session persists,
- profile persists,
- wallet persists,
- reload preserves auth.

## 11.2 Create Party

```text
Home
↓
Create
↓
Choose/create Crew
↓
Party title
↓
Date/time
↓
Location
↓
Optional cover
↓
Create
↓
Generate private invite
↓
Party Detail
```

Acceptance:
- party persists,
- host becomes member,
- Home/Tonight update,
- invite works.

## 11.3 Join Party

```text
Join with code
↓
Enter code
↓
Resolve secure invite
↓
Validate active / expiry / usage / revocation
↓
Join
↓
Membership created
↓
Party Detail
```

Acceptance:
- invalid code rejected,
- expired rejected,
- revoked rejected,
- duplicate join prevented.

## 11.4 Party Detail

```text
Party Detail
├── attendees
├── metadata
├── Play
├── Split
├── Pot
├── Poll
└── Activity
```

Acceptance:
- attendee count is real,
- activity is real,
- pot balance is real,
- every visible action works.

## 11.5 Game Flow

```text
Party
↓
Play
↓
Choose game
↓
Create/join session
↓
Round
↓
Vote/answer
↓
Result
↓
Next round
↓
Finish
↓
Optional reward
↓
Activity
```

Acceptance:
- only party members participate,
- state persists,
- at least one game works end-to-end,
- reward executes once.

## 11.6 Poll Flow

```text
Party
↓
Poll
↓
Create poll
↓
Members vote
↓
Realtime results
↓
Close
↓
Persist
```

Acceptance:
- percentages derive from votes,
- no hardcoded percentages,
- duplicate vote behavior defined.

## 11.7 Add Expense

```text
Party
↓
Split
↓
Add expense
↓
Description
↓
Amount
↓
Payer
↓
Participants
↓
Split strategy
↓
Validate
↓
Save
↓
Balances recompute
```

Acceptance:
- all shares reconcile,
- rounding deterministic,
- refresh persists.

## 11.8 Settlement

```text
Split
↓
Select debt
↓
Settle up
↓
Confirm
↓
Privy
↓
Monad
↓
Confirmation
↓
Settlement record
↓
Balances recompute
↓
Activity
```

Acceptance:
- failed transaction does not mark paid,
- confirmed tx is idempotent,
- cannot settle more than outstanding debt unless explicitly supported.

## 11.9 Party Pot

```text
Party
↓
Pot
↓
Real balance
↓
Add money
↓
Choose amount
↓
Choose funding source
↓
Privy / Aurora if used
↓
PartyVault
↓
Confirmation
↓
Balance update
↓
Activity update
```

Acceptance:
- displayed balance matches indexed/onchain balance,
- failed deposit does not update balance,
- duplicate events do not double-count.

## 11.10 Contribution Reward

```text
Create task
↓
Member claims
↓
Complete
↓
Host/admin verifies
↓
PartyVault.reward()
↓
Confirmed
↓
Contribution paid
↓
Activity
```

Acceptance:
- correct permissions,
- one payout only,
- insufficient funds handled.

## 11.11 Tonight

```text
Tonight
↓
Live party
↓
Quick actions
↓
Live activity
↓
Happening next
```

The screen answers:
- what is happening now?
- what can I do now?
- what happens next?

## 11.12 Crew

```text
Crews
↓
Crew
↓
Members
↓
Past gatherings
↓
Upcoming gatherings
↓
Shared history
↓
Shared economic history where relevant
```

No follower model.

## 11.13 Profile

```text
Profile
├── nights
├── crews
├── games
├── photos
└── your people
```

Metrics must be derived from actual data.

## 11.14 Recap

```text
Party ends
↓
Aggregate real metrics
↓
Generate recap
↓
Share/save
↓
Persist to Crew history
```

Never invent recap metrics.

---

# 12. State Management

Use one canonical source of truth per domain.

Avoid duplicate local copies of:
- member count,
- balances,
- poll totals,
- profile stats.

Prefer:
- TanStack Query / equivalent,
- Supabase Realtime for social state,
- indexed chain state for blockchain-derived data,
- optimistic UI only with reconciliation.

---

# 13. Realtime Requirements

Realtime candidates:
- member joined,
- RSVP changed,
- poll vote,
- game state,
- expense added,
- activity,
- indexed Party Pot update.

Realtime must be genuine.

Forbidden in production:

```ts
setTimeout(() => fakeUpdate(), 1500)
```

---

# 14. Error Handling

Every async action needs:

```text
idle
loading
success
error
```

Example:

Good:

```text
We couldn't add your money to the pot.
Nothing was charged.
```

Bad:

```text
execution reverted
```

---

# 15. Empty States

Examples:

### No parties

```text
Nothing planned yet.
Create your first night.
```

### No expenses

```text
No damage yet.
Add the first expense.
```

### Empty Party Pot

```text
The pot is empty.
Start it with the first contribution.
```

---

# 16. Security Requirements

## Invite security
- secure backing token,
- short code only as human alias,
- rate limit attempts,
- expiry,
- revocation,
- usage limit.

## Treasury security
- authorization,
- duplicate payout prevention,
- safe transfers,
- explicit event IDs,
- no arbitrary payout targets.

## Backend
- server-side authorization,
- authenticated writes,
- row-level privacy,
- never trust frontend role labels.

## Privacy
Never put private party content or exact personal activity onchain by default.

---

# 17. Non-Functional Requirements

## Performance
- fast perceived interaction,
- optimized images,
- minimal duplicate queries,
- restrained Liquid Glass,
- avoid excess client components,
- avoid duplicate subscriptions.

## Mobile
Primary:
- 390×844
- 430×932

Also:
- 768×1024
- 1440×900

## Accessibility
- 44px targets,
- semantic buttons,
- form labels,
- focus states,
- reduced motion,
- alt text,
- sufficient contrast.

## PWA
- valid manifest,
- icons,
- standalone layout,
- safe areas,
- theme color,
- installability.

---

# 18. Testing Strategy

Testing exists at four levels:

```text
Unit
Integration
Contract
End-to-End
```

---

# 19. Unit Tests

Recommended:
- Vitest/Jest
- React Testing Library

## Expense math
Test:
- equal split,
- manual split,
- odd cents,
- one participant,
- payer handling,
- large groups,
- zero/negative amount rejection,
- precision.

All shares must sum exactly to the expense total after deterministic rounding.

## Poll logic
Test:
- vote,
- revote policy,
- percentages,
- no votes,
- closed poll,
- invalid option.

## Invite validation
Test:
- valid,
- expired,
- revoked,
- max uses,
- unknown,
- duplicate join.

## Activity formatting
Test:
- actor,
- amount,
- timestamp,
- metadata fallback.

## Derived stats
Test:
- nights,
- crews,
- games,
- relationship counts.

---

# 20. Smart Contract Tests

Use Foundry.

## Deposits
- valid deposit,
- zero deposit rejected,
- transfer failure.

## Reimbursement
- authorized succeeds,
- unauthorized fails,
- duplicate reimbursement ID fails,
- insufficient balance fails.

## Reward
- valid succeeds,
- duplicate reward ID fails,
- unauthorized fails.

## Withdraw
- authorized succeeds,
- unauthorized fails,
- insufficient balance fails.

## Events
Verify expected fields and indexed parameters.

---

# 21. Integration Tests

## Auth

```text
login
→ user record
→ wallet association
→ reload
```

## Invite

```text
A creates party
→ invite
→ B joins
→ A receives realtime update
```

## Expense

```text
add expense
→ persist
→ all members see same values
→ balances recompute
```

## Party Pot

```text
deposit
→ chain confirmation
→ indexer
→ UI balance
→ activity
```

---

# 22. End-to-End Tests

Use Playwright.

## E2E-01 — New User

```text
open
login
profile created
home loads
refresh
still logged in
```

## E2E-02 — Create Party

```text
create
verify Home
verify Tonight
open detail
verify data
```

## E2E-03 — Join Party

Use two browser contexts.

```text
A creates party
A gets code
B logs in
B joins
A sees B
B sees party
```

## E2E-04 — Poll

```text
A creates poll
B votes
A sees update
refresh
vote persists
```

## E2E-05 — Game

```text
A starts game
B joins
B votes
round progresses
result persists
```

At least one game must pass full E2E.

## E2E-06 — Expense

```text
A adds $82 pizza
8 participants
shares reconcile
B sees debt
refresh
debt persists
```

## E2E-07 — Settlement

```text
B settles
Privy signs
tx confirms
debt updates
activity updates
```

## E2E-08 — Party Pot

```text
A deposits
tx confirms
balance updates
B sees same balance
activity updates
```

## E2E-09 — Invalid Invite

Test:
- expired,
- revoked,
- unknown,
- max uses.

## E2E-10 — Recap

```text
party has real activity
end party
generate recap
metrics match source data
```

---

# 23. Visual Regression Testing

Use Playwright screenshots.

Required widths:

```text
390
430
768
1440
```

Screens:
- Home
- Party Detail
- Party Pot
- Game
- Crews
- Tonight
- Profile
- Create Party
- Join Party

Check:
- overflow,
- clipped text,
- broken glass effects,
- safe-area issues,
- bottom-nav overlap,
- image distortion.

---

# 24. Liquid Glass Testing

Specifically test:
- Safari backdrop-filter,
- fallback when unsupported,
- text contrast,
- no excessive layering,
- scroll FPS,
- sheet animation smoothness,
- bottom-nav performance.

Test on a real iPhone if possible.

---

# 25. Data Integrity Tests

Required consistency assertions:

```text
Home member count == real membership count

Party Pot displayed balance == indexed/onchain balance

Poll percentages == real votes

Profile nights == attended gatherings

Crew count == actual memberships

Expense total == sum(shares)

Outstanding debt == owed - settled
```

---

# 26. Failure Tests

Explicitly test:
- offline network,
- backend unavailable,
- RPC unavailable,
- transaction rejected,
- transaction reverted,
- duplicate transaction submission,
- stale indexer data,
- expired auth,
- upload failure,
- deleted party while open,
- removed member while viewing.

---

# 27. Concurrency Tests

Test:
- simultaneous joins,
- simultaneous votes,
- simultaneous expenses,
- duplicate reimbursement attempt,
- two devices using same account.

Backend and contracts must remain safe.

---

# 28. Test Data Strategy

Recommended:

```text
/tests/fixtures
/tests/e2e
/dev/seed
```

Fixture data must never silently appear as production data.

---

# 29. Environment Strategy

Use separate:

```text
development
staging/testnet
production/mainnet
```

Each with:
- backend config,
- contract addresses,
- Privy config,
- RPC config.

Never point local development at real production money by accident.

---

# 30. CI Requirements

On every PR:

```text
lint
typecheck
unit tests
contract tests
build
selected E2E smoke tests
```

Before release:

```text
full E2E
visual regression
manual mobile QA
contract verification
```

---

# 31. Manual QA Checklist

## Auth
- login
- logout
- reload
- wallet persistence

## Home
- current party
- real Crew data
- navigation

## Create
- validation
- persistence
- invite

## Join
- valid
- invalid
- expired
- revoked

## Party
- members
- actions
- activity

## Games
- at least one full game

## Poll
- real vote updates

## Split
- correct math

## Pot
- real balance
- real deposit
- failure behavior

## Profile
- derived stats
- no fake values

## Responsive
- small iPhone
- large iPhone
- tablet
- desktop

---

# 32. Hackathon Demo Acceptance Test

Use two real devices or two isolated browser contexts.

```text
1. Law signs in with Privy.
2. Law creates 404 House.
3. Law receives an invite code.
4. Ana joins with the code.
5. Both users appear.
6. They interact in a real game or poll.
7. Someone adds money to Party Pot.
8. Pot balance updates from real state.
9. A shared expense is created.
10. A settlement or reward executes.
11. Activity reflects real events.
12. Recap shows real metrics.
```

No mocks in this sequence.

---

# 33. Bounty Acceptance Criteria

## Privy

Must demonstrate:

```text
authentication
+
embedded wallet
+
real signing / transaction
```

Login-only is not enough.

## Envio

Must power a real feature:

```text
chain event
→ Envio
→ real UI state
```

## Aurora Intents

If submitted:

```text
real source chain
→ Aurora
→ Monad
→ Partylot contract
```

No mocked bridge.

---

# 34. Definition of Done

A feature is done only when:

```text
UI exists
+
logic works
+
data persists
+
error state works
+
mobile works
+
tests exist where appropriate
```

A screen looking finished is not enough.

---

# 35. MVP Definition

Partylot MVP is complete when two independent users can:

```text
authenticate
→ create/join same party
→ see each other
→ interact socially
→ create a shared expense
→ move money through Monad
→ see consistent activity
→ return after refresh
```

At least one game and one poll must be real.

---

# 36. Post-MVP Priorities

1. Contribution rewards
2. Better recap sharing
3. Aurora any-chain funding
4. Shared-experience graph
5. Push notifications
6. Photo albums
7. Better Crew history
8. Additional games

---

# 37. Non-Goals

Do not prioritize:
- public feed,
- follower system,
- creator marketplace,
- custom token,
- NFT marketplace,
- full chat replacement,
- complex DAO governance,
- dozens of games,
- cross-chain before Party Pot works on Monad.

---

# 38. Technical North Star

> **Every important state shown to the user should have a real source of truth, every core interaction should actually work, and every blockchain interaction should disappear behind normal consumer language.**

---

# 39. Final Release Gate

Do not submit until:

- [ ] build succeeds
- [ ] typecheck succeeds
- [ ] no major console errors
- [ ] no fake core buttons
- [ ] no hardcoded production balances
- [ ] invite flow works
- [ ] two-user party works
- [ ] poll works
- [ ] at least one game works
- [ ] split math is correct
- [ ] Party Pot uses real state
- [ ] Privy signs a real action
- [ ] Envio is real if bounty selected
- [ ] Aurora is real if bounty selected
- [ ] mobile tested
- [ ] desktop tested
- [ ] main flows survive refresh
- [ ] failure states tested
- [ ] demo completes without developer intervention
