# PartyLot Envio HyperIndex Sub-second Pipeline

This directory contains the production-grade **Envio HyperIndex** indexer for **PartyLot** on **Monad Testnet (Chain ID: 10143)**.

## Architecture

The indexer captures and aggregates onchain state across three core contracts:
- **`PartyRegistry`** (`0xce58a0cf7b9f80994eaeba0138e1525496090d25`): Parties created and guest member joins.
- **`PartyTreasury`** (`0x7e92f443c26c36e80a7f7ab8939a915dd9fbd991`): V2 vault handling pot deposits with auto-registration, role reward distributions, P2P debt settlements, expense reimbursements, pro-rata participant refunds, and emergency host closes.
- **`SocialGraph`** (`0x11ca2ef9acad94fe83d3269bdeabd2c1b627b3d2`): Crew creations, onchain gathering attestations, and pair-wise social ties.

## Key Bounty Highlights

- **Depth of Schema**: Implements multi-contract entity relational mapping (`Party`, `PartyMember`, `TreasuryDeposit`, `RewardDistribution`, `DebtSettlement`, `SocialTie`).
- **Derived & Aggregated Entities**:
  - `UserReputationSummary`: aggregates financial reliability, parties attended, and onchain contributions per wallet.
  - `GlobalMetrics`: real-time aggregate volume in MON, total memberships, and settlements executed.
  - `ActivityFeedItem`: polymorphic event timeline streaming directly to PartyLot's `ActivityView`.
- **Sub-Second Monad Pipeline**: Optimizes event ingestion from Monad Testnet block time.

## Quickstart

### Prerequisites
- Node.js >= 18
- Docker (for local Envio development database)
- pnpm or npm

### Commands
```bash
# Install Envio CLI globally if not already installed
npm install -g envio

# Run code generation for typed handlers and entities
pnpm codegen

# Start local indexer and Hasura GraphQL engine
pnpm dev

# Build TypeScript verification
pnpm build
```

## GraphQL Endpoint
- Local: `http://localhost:8080/v1/graphql`
- Envio Cloud: `https://indexer.envio.dev/v1/graphql`
