# PARTYLOT — The Night Belongs to the Group

> **Social-first, verifiable private group party application on Monad.**  
> Built for the **Monad Metropolis Hackathon**.

PARTYLOT is a mobile-first social party app designed for real-world private gatherings, house parties, and recurring crews. Inspired by Apple iOS 27, visionOS **Liquid Glass**, and candid night/flash photography, Partylot completely removes Web3 friction while providing real, verifiable onchain ownership.

---

## ⚡ Product Thesis: Social First, Blockchain Second

Most Web3 social applications fail because they build crypto dashboards masquerading as consumer apps. 

In PARTYLOT:
1. **Nobody needs to know what Monad, a seed phrase, gas, or a transaction hash is.**
2. **Silent Embedded Wallets via Privy + Pimlico**: Users tap *"Continue with Apple"* or *"Continue with Google"*. In the background, an ERC-4337 Smart Account is provisioned with passkey authorization.
3. **100% Sponsored Gas**: Pimlico acts as the Paymaster on Monad testnet. Every deposit, vote, game payout, and reimbursement has zero gas fees for guests.
4. **Human Language for Financial Actions**:
   - `Add $10 to Party Pot` (not `approve() + transfer()`)
   - `Pay Ana $8.40` (not `call(0x18...)`)
   - `Reward DJ Law $10` (not `mintReward()`)

---

## 💎 The Onchain Primitives: Verifiable Ownership

The blockchain is only invoked where economic ownership, transparency, and portability truly matter:

```
┌────────────────────────────────────────────────────────┐
│                   ONCHAIN BOUNDARY                     │
├──────────────────────────┬─────────────────────────────┤
│ ONCHAIN (Monad Testnet)  │ OFFCHAIN (Private / Fast)   │
├──────────────────────────┼─────────────────────────────┤
│ • Crew & Party Treasury  │ • Fullscreen Party Photos   │
│ • Economic Contributions │ • Ephemeral Chat / Messages │
│ • Contribution Rewards   │ • Exact Secret Addresses    │
│ • Pairwise Settlements   │ • Ephemeral Game Questions  │
│ • Rollover Balances      │ • Real-time Typing States   │
│ • Shared-Experience Graph│ • 4-Letter Short Codes (8F4K│
└──────────────────────────┴─────────────────────────────┘
```

### 1. `PartyTreasury.sol` — Social Participation $\rightarrow$ Economic Stake
A shared group treasury contract where members pool funds for food, drinks, and rides.
- **Sponsored Reimbursements**: Instant payback for members who fronted cash (e.g. `$82 Sourdough Pizza`).
- **Contribution Rewards**: Direct bounties from the pot for social contributions:
  - `OFFICIAL_DJ` ($10 prize for non-stop aux mastery)
  - `ICE_RUNNER` ($5 prize for saving the ice supply)
  - `GAME_WINNER` ($10 reward for crew trivia victory)
- **Automatic Rollover**: Leftover pot automatically rolls over to the next gathering's treasury.

### 2. `PartyRegistry.sol` — EIP-712 Cryptographic Invite Permits
- **Brute-Force Protection**: Short 4-character codes (`8F4K`) have only $36^4 \approx 1.67\text{M}$ combinations and can be brute-forced in seconds on high-throughput chains like Monad (10,000 TPS).
- **Architecture**: `8F4K` is strictly an offchain human UX shortcut. An authorized relayer maps it to a high-entropy secret and signs a typed **EIP-712 permit** with expiration and nonce. Guests execute `joinPartyWithPermit()` via sponsored UserOp without ever exposing or checking codes onchain.

### 3. `SocialGraph.sol` — Shared-Experience Graph
- **No Vanity Follower Counts**: Replaces follow/unfollow dynamics with verifiable co-presence:
  - `Ana: 12 nights together`
  - `Carlos: 9 nights together`
  - `71 lifetime settlements completed`
- **Portable Crew Reputation**: Crews retain their shared history, game records, and treasury lineage even if Partylot frontend changes.

---

## 🚀 Deployed Smart Contracts (Monad Testnet)

All smart contracts are compiled, deployed, and live on **Monad Testnet (Chain ID: 10143)**:

| Contract | Address | Explorer Link |
|---|---|---|
| **SocialGraph** | `0x7e87e96bc959fa9ee559fad9c2e3d017d757adf9` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x7e87e96bc959fa9ee559fad9c2e3d017d757adf9) |
| **PartyRegistry** | `0xb7d922488daa522443ffe1627efc6d65825eebad` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0xb7d922488daa522443ffe1627efc6d65825eebad) |
| **PartyTreasury** | `0x838ef69f8904af767e3ec8d04737417106225e6a` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x838ef69f8904af767e3ec8d04737417106225e6a) |
| **Deployer** | `0xc3aDb792001E9bd82ff54D4E226eC5882017f4be` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0xc3aDb792001E9bd82ff54D4E226eC5882017f4be) |

---

## 🛠️ Metropolis Infrastructure Stack

We leverage official Metropolis hackathon partner infrastructure:

- **QuickNode (Build Plan)**: High-performance Monad Testnet RPC endpoint and stream listeners.
- **Tenderly Pro**: Pre-execution transaction simulation engine ensuring 0% reverts before submitting sponsored UserOps to the Paymaster.
- **Envio (HyperIndex)**: Sub-second event indexer pipeline ingesting `Deposited`, `RewardDistributed`, and `GatheringRecorded` events to power the live activity feed without RPC polling.
- **Privy & Pimlico**: Embedded passkey smart accounts and ERC-4337 transaction sponsorship.

---

## 📱 Visual Design: Apple iOS 27 Liquid Glass

- **Tier 1 (Navigation & Bars)**: `liquid-glass-nav` with `backdrop-filter: blur(28px) saturate(190%)` and specular top border highlights.
- **Tier 2 (Cards & Actions)**: `liquid-glass-card` with dynamic inner reflections and ambient blur.
- **Tier 3 (Modals & Sheets)**: `liquid-glass-modal` with tactile drag handles, spring physics, and safe-area padding.
- **Display Typography**: Google Fonts `Fredoka` & `Syne` for chunky, rounded, retro editorial poster titles.
- **UI Typography**: `Plus Jakarta Sans` for clean data, amounts, and dates.
- **Color Discipline**: Base obsidian (`#050505`), warm flash photography, and accent lime (`#E9FF32`) reserved strictly for active states and confirmed actions.

---

## 🕹️ 3 Fully Playable Minigames

1. **Who's Most Likely**: Anonymous avatar voting for group members with animated progress bars, real-time percentages, and crown spotlight.
2. **This or That**: Split-screen duel choices with live ratio bar animations.
3. **Crew Lore Trivia**: 5-round customizable trivia quiz with timer, lore check explanations, and winner podium screen.

---

## 🏃 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- pnpm (recommended) or npm

### Installation
```bash
git clone https://github.com/lawxr/PartyLot.git
cd PartyLot
pnpm install
```

### Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) on your mobile browser or emulator (iPhone dimensions 393 x 852 recommended).

### Production Build
```bash
pnpm build
```

---

## 🏆 Real Partylot Night — Pilot Validation Plan

For the 20% Traction criterion:
- Host an authentic **Partylot Night** with 10–20 friends in Medellín.
- Real flow tested:
  1. Host generates private room with code `8F4K`.
  2. 14 friends join via Apple/Google login (zero gas paid).
  3. Crew plays 3 rounds of trivia and votes on midnight food order.
  4. Pool $186 in Party Pot; payout $10 bounty to DJ Law.
  5. Settle pizza bill via greedy two-pointer damage calculator.
  6. Generate and export the official **Event Recap Dossier**.
