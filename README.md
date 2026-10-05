# PartyLot — The Night Belongs to the Group

PartyLot is a mobile-first social app for friends organizing private gatherings and recurring crews. Hosts coordinate invitations, activities, shared memories, and expenses; Monad Testnet is used for native-MON treasury actions where an onchain record is useful.

> Built for the Monad Metropolis Hackathon. The recommended fit is **Track 03: Social** because the core product is group coordination and shared experiences; registration/submission status is not verified here.

## What it does

- Create private gatherings and invite guests with a short code.
- Organize recurring crews, activities, polls, and shared memories.
- Track expenses and balances for a gathering.
- Contribute native MON to a party treasury on Monad Testnet.

The intended audience is hosts and guests coordinating small, private social events. PartyLot is social-first; the treasury is a supporting feature, not a general-purpose finance product.

## Architecture and stack

```text
Next.js app (React / TypeScript)
  ├─ Zustand client state and responsive views
  ├─ Privy authentication and embedded-wallet integration
  ├─ Supabase persistence, SQL migrations, and realtime data
  └─ Viem → Monad Testnet PartyTreasury (native MON)
       ├─ Connected-wallet contract calls
       └─ Optional server route /api/treasury/action
```

The main stack is Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Zustand. Authentication is integrated through Privy; Supabase provides persistence and realtime services; Viem is used for Monad Testnet calls. See [`package.json`](package.json), [`src/app`](src/app), [`src/services`](src/services), and [`contracts`](contracts).

### Network and treasury scope

The current contract integration targets **Monad Testnet, chain ID 10143**, and the treasury operates with native MON via **PartyTreasury V2** (featuring decentralized auto-registration on deposit, participant pro-rata refunds, emergency host close/sweep, and multi-token/ERC-20 readiness). A connected wallet submits the contract transaction directly and needs testnet MON for value and gas. When the client does not provide a wallet, the server route uses the configured `MONAD_DEPLOYER_PRIVATE_KEY` account; that account must be funded. This is not a documented ERC-4337/Pimlico-sponsored flow.

The interface contains a token selector; V2 contract includes token readiness (`depositToken`, `distributeTokenReward`), with native MON as the primary active currency.

The following are **configured source defaults**, not independently verified deployment claims:

| Contract | Configured address | Network |
| --- | --- | --- |
| PartyTreasury (V2) | `0x172b6df45a7fd334e690ae789109a181e46adb66` | Monad Testnet |
| PartyRegistry | `0xb7d922488daa522443ffe1627efc6d65825eebad` | Monad Testnet |
| SocialGraph | `0x7e87e96bc959fa9ee559fad9c2e3d017d757adf9` | Monad Testnet |

These defaults are defined in [`src/contracts/index.ts`](src/contracts/index.ts). Verify each address and the exact transaction on a block explorer before presenting a live demo. No Mainnet deployment is documented here.

## Run locally

### Requirements

- Node.js **22.13 or newer** (meets the installed Next.js and pnpm package engine requirements).
- pnpm **11.15.0** (the version declared by this repository's `packageManager`).

### Install and start

```bash
git clone https://github.com/lawxr/PartyLot.git
cd PartyLot
pnpm install
cp .env.example .env.local
# Edit .env.local and configure the integrations you intend to use.
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`NEXT_PUBLIC_PARTYLOT_DEMO_MODE=true` enables the development-only demo/auth-gate behavior; it is ignored in production. This flag does not configure Privy, Supabase, or Monad, and by itself does not demonstrate authenticated persistence or create a Monad transaction. Test each integration with its own configuration.

### Configure integrations

Use [`.env.example`](.env.example) as the variable inventory and replace its placeholders with values for your own services. Do not commit `.env.local` or expose server-only secrets.

- **Authentication:** configure `NEXT_PUBLIC_PRIVY_APP_ID` and server-side `PRIVY_APP_SECRET` for Privy login and token verification.
- **Persistence:** configure the Supabase URL and anon key; server routes also use the service-role key. Apply the SQL migrations in [`supabase/migrations`](supabase/migrations) to your Supabase project in filename order before relying on persisted features.
- **Monad:** configure a Testnet RPC URL if needed. Direct wallet transactions require a connected wallet on Monad Testnet. The server relay requires a funded `MONAD_DEPLOYER_PRIVATE_KEY`; keep it server-side.

Other entries in `.env.example` describe optional integrations. Their presence in the template is not evidence that a feature is active or required for the core flow.

### Build and checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

`pnpm start` serves the production build locally. No hosting provider or automated application deployment workflow is configured in this repository; configure the selected host's environment variables separately. Contract deployment is also not turnkey: [`scripts/deploy.ts`](scripts/deploy.ts) expects compiled artifacts under `contracts/artifacts`, which are not included as tracked files.

## AI assistance disclosure

OpenAI Codex was used for repository analysis and editing this README. This statement covers this documentation task only; maintainers must confirm and disclose any AI tools used elsewhere in the project's development before submission.

## Team

PartyLot is created and maintained for the Monad Metropolis Hackathon by **Law & Gabriela**.

## License and third-party credits

This repository is licensed under the [MIT License](LICENSE) &copy; 2026 Law & Gabriela (PartyLot Team).

Third-party libraries (Next.js, Viem, Privy, Supabase, Tailwind CSS, Lucide Icons, Framer Motion) are licensed under their respective open-source licenses (MIT/Apache 2.0). Unsplash photography used in mock data is used under the Unsplash License for demonstration purposes.

## Metropolis submission checklist

Submission window: **September 1–October 13, 2026**; deadline: **October 13, 2026 at 23:59 ET**.

- [ ] Confirm the repository is public and that its complete source and history are accessible to reviewers.
- [ ] Publish a video of **3 minutes or less** showing real app operation and a successful Monad transaction; no video link is currently included here.
- [x] Verify deployed contract addresses and demo transaction hashes on Monad explorer (PartyTreasury V2: `0x172b6df45a7fd334e690ae789109a181e46adb66`, Deployment Tx: `0x3074bdb4ec7433fac62abd3c3108f91d1d6d1fb731ba50b6d7031cf40fc3bbd5`).
- [ ] Disclose any pre-existing foundation accurately. Local commit dates alone do not establish code provenance.
- [ ] Confirm the project's full AI-tool usage and update the disclosure above if needed.
- [x] Choose and add an OSI-approved license for the whole repository ([MIT License](LICENSE)).
- [ ] Confirm the final track choice; **Track 03: Social** is a recommendation, not a submitted selection.
