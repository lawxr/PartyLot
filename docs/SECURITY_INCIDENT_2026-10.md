# Security incident: deployer key in public git history

**Status:** key rotated and contracts redeployed on 2026-10-12. Pending: update the Vercel environment (step 2) and redeploy the web app.
**Found:** 2026-10-12 during the pre-submission audit.

## What happened

`scripts/test-monad-treasury-playwright.mjs`, added on 2026-10-05 and removed later, contained the
live `MONAD_DEPLOYER_PRIVATE_KEY`. The file is gone from the current tree, but it is still present in
six commits reachable from `origin/main` on the public repo `github.com/lawxr/PartyLot`.

## Impact

The leaked account (`0xc3aD…f4be`) is:

- the `owner` of **PartyTreasury V2** `0x69c7…97c3` and **SocialGraph** `0x7e87…adf9`
  (`owner` is `immutable`, so it cannot be transferred);
- the server relayer behind `/api/treasury/action` and `/api/social-graph/attest`;
- funded with ~11.47 testnet MON at the time of the audit.

Through `onlyHostOrOwner`, anyone holding the key can call `closePartyAndWithdrawRemaining`,
`distributeReward`, `executeReimbursement` and `settleDebt` on **any** party pot, register parties
with an arbitrary host (`registerParty`), and write fake gatherings into `SocialGraph`. The treasury
held 0 MON at the time of the audit, so no user funds were lost.

This also conflicts with the Metropolis rules (§5.3: no private keys or credentials in a submission;
§10.2: no mechanisms that give unauthorized access).

## Remediation

1. **Rotate and sweep**: `npx tsx scripts/rotate-deployer.ts --execute`. It writes the new key to
   `.env.rotated.local` (gitignored) and moves the MON to the new account.
2. Put the new key and address in `.env.local` **and** in the Vercel project environment.
3. Redeploy all contracts with the new key: `npx tsx scripts/deploy.ts --all`.
4. Update the three `NEXT_PUBLIC_*_ADDRESS` values in `.env.local`, Vercel, the defaults in
   `src/contracts/index.ts`, `README.md` and `indexer/config.yaml`; redeploy the web app; make one
   real deposit and record its transaction hash in the README.
5. Mark the old contracts as retired in the README.
6. Optional: purge the file from history (`git filter-repo --path scripts/test-monad-treasury-playwright.mjs --invert-paths`)
   and force-push. This rewrites public history and needs every collaborator to re-clone. Rotation
   (steps 1–4) is what actually removes the risk; purging only reduces exposure.

## Resolution log (2026-10-12)

| Step | Result |
|---|---|
| Rotate + sweep | New owner/relayer `0x3e04…5fAb`; 11.465 MON moved in [`0x53e1cf89…6657bc`](https://testnet.monadexplorer.com/tx/0x53e1cf8950c8c32333b8b5f2288bf2a335a41c0cf3775cf5295a2d8e766657bc). Leaked account left with dust (~0.004 MON). |
| Redeploy | SocialGraph `0x11ca…b3d2`, PartyRegistry `0xce58…0d25`, PartyTreasury `0x7e92…d991`, compiled from current sources. `owner()` / `partySigner()` verified = new account. |
| Smoke test | register → deposit 0.01 MON → close & withdraw, all `success` (README). |
| Code | Addresses updated in `src/contracts/index.ts`, `.env.example`, `scripts/deploy.ts`, `indexer/config.yaml` (`start_block: 70555033`), stats and Party Pot views, README. |
| **Vercel** | **Owner action:** set `MONAD_DEPLOYER_PRIVATE_KEY`, `NEXT_PUBLIC_DEPLOYER_ADDRESS` and the three `NEXT_PUBLIC_*_ADDRESS` values to the new ones, then redeploy. Until then production still uses the old key/contracts. |
| Envio | Redeploy the indexer from `indexer/` so `/stats` follows the new addresses. |
| History purge | Not done (optional, rewrites public history). |

## Prevention

- `scripts/check-secrets.mjs` now runs first in `pnpm release:check` and fails on private keys,
  JWTs and provider tokens in tracked files (values are never printed).
- Production roadmap for the relayer (already in the README): ERC-4337 paymaster or scoped session
  keys instead of a raw server key.
