# Metropolis submission — compliance and launch checklist

Deadline: **Tuesday 13 Oct 2026, 23:59 ET** (version recorded at the deadline is judged).
Track: **03 — Social, Attention & Culture** (one track only, §2.5).

## 1. Compliance matrix

| Rule | Requirement | Status | Evidence / action |
|---|---|---|---|
| §4.1.1 | Public GitHub repo, full source | ✅ | `github.com/lawxr/PartyLot` is public. **Push `main`** after merging `release/metropolis`. |
| §4.1.1 | README with setup | ✅ | `README.md` → *Run it locally* |
| §4.1.1 / §7.2 | OSI license | ✅ | `LICENSE` (MIT) |
| §4.1.1 / §7.3 | Attribution of external code/assets | ✅ | `README.md` → *Credits and third-party licenses* |
| §4.1.1 | Commit history covering the build window | ✅ | first commit 2026-09-22, 160+ commits by both members |
| §4.1.4 | Pre-existing code identified | ✅ | `README.md` → *Build window and originality* (none) |
| §4.1.4 | AI tools disclosed | ✅ | `README.md` → *AI tools used* |
| §4.1.5 | Description, architecture, stack, setup | ✅ | `README.md` |
| §4.1.3 / §9.2 | Contract addresses + tx hashes, testnet | ✅ / ⏳ | New contracts + 3 deploy txs + 3 smoke-test txs in README. **Add one deposit hash from the live product** after Vercel is updated. |
| §9.2 | Why Monad | ✅ | `README.md` → *How Partylot uses Monad* |
| §5.3 / §10.2 | No private keys / credentials / backdoors | ✅ / ⏳ | Leaked key rotated, funds swept, contracts redeployed with a new owner. **Update Vercel env** (incident doc, resolution log). |
| §9.1 | Working prototype a third party can run | ✅ | `pnpm install && pnpm dev`; `pnpm release:check` green |
| §9.4 | Demo video ≤ 3 min, product in operation, Monad interactions | ⏳ owner | Script in §3 below |
| Track 03 | Pitch video ≤ 2 min | ⏳ owner | Outline in §4 below |
| Track 03 | Live product link + judge access instructions + test login | ⏳ owner | Live link ✅ (`200`). Create a Privy test account (Privy dashboard → *User management* → *Test accounts*) and paste it in the form, **not** in the repo. Fund its wallet with ~1 testnet MON. |
| Track 03 | Repo accessible to `metropolis@hackathon.monad.xyz` | ✅ (public) | Optional: also add as read collaborator. |
| Track 03 | Logo JPG/PNG/WEBP ≤ 3 MB | ✅ | `public/brand/partylot-logo-1024.png` (26 KB) |
| Track 03 | Product ad ≤ 30 s (optional) | ✅ | `trailer-film/` render (30.0 s). Upload to YouTube/Vimeo; not in the repo. |
| §7.4 | Monad/Metropolis marks used only descriptively | ✅ | README note; no Monad logo in the app UI |
| §2.4 | Team 1–5, primary contact | ⏳ owner | Register both members; set the primary contact and the USDC wallet in the form |
| §6.1 | Prize wallet | ⏳ owner | Use a fresh wallet, **not** the deployer |

## 2. Technical state at handoff (`release/metropolis`)

- `pnpm release:check`: secrets scan → slop scan → typecheck → lint → 257 tests → production build, all green.
- Next.js 16.3.6 → **16.3.8** (fixes SSRF in image optimization and cache-poisoning advisories). `ws`, `sharp`, `source-map-js` pinned above vulnerable versions. `pnpm audit --prod`: 0 high (was 4); 5 moderate remain in WalletConnect transitive deps (`uuid`, `stream-json`, `decode-uri-component`), fixable only by major upgrades upstream.
- Games: one vote per user tallied on the server (`/api/parties/games`), i18n ES/EN, light/dark stage, no nested scroll (`docs/plans/games-ui-audit.md`).
- Known non-blocking gaps (do after the deadline): crypto wording still visible in Party Pot / Party Detail / stats / SharedExperience (baseline in `scripts/slop-baseline.json`); 5 moderate transitive advisories; Envio endpoint timed out during the audit — check `/stats` before recording.

## 3. Demo video (≤ 3:00) — must show the live product and Monad

| Time | Shot | Show |
|---|---|---|
| 0:00–0:15 | Phone, group chat chaos | The problem in one line |
| 0:15–0:40 | Log in with email on the live URL | Embedded wallet created, no seed phrase |
| 0:40–1:10 | Create party, second phone joins with code | Real-time members |
| 1:10–1:40 | Who's Most Likely + This or That on two phones | One vote per person, *View result* |
| 1:40–2:20 | Party Pot: deposit 0.1 MON → confirmation → open the tx in the Monad explorer | **Monad interaction, tx hash on screen, ~1 s confirmation** |
| 2:20–2:45 | Host rewards the game winner from the pot (second tx), Recap | Participation → economic stake |
| 2:45–3:00 | `/stats` + contract addresses | Verifiable onchain record |

Record the real product (no mockups or slides, §9.4). Use the rotated contracts.

## 4. Pitch video (≤ 2:00)

1. **Team (15 s):** who you are and why you organise nights for your friends.
2. **Problem (25 s):** group chats lose the plan, the money and the history; platforms own the group.
3. **Product (30 s):** play, split, pot, recap — the group owns its pot and its graph.
4. **Why Monad (20 s):** sub-second finality for micro-actions in the room; fees fit $2–$20.
5. **Traction & go-to-market (30 s):** real test nights (how many people / parties / deposits), first community (university / house crews), next 3 months: campus ambassadors, recurring crews, recap sharing as the growth loop. *Use real numbers only.*

## 5. Launch order for the next 24 hours

1. ~~Rotate the key and redeploy contracts~~ (done). **Update the Vercel env** with the new key and addresses (values in `.env.local`) and redeploy; redeploy the Envio indexer.
2. Merge `release/metropolis` → `main`, push, wait for Vercel, smoke-test login → party → game → deposit on a phone.
3. Make a deposit from the live product; put the tx hash and the new addresses in the README; commit and push.
4. Record and upload the demo (§3) and pitch (§4); upload the 30 s ad.
5. Create the Privy test account for judges and fund it.
6. Fill the form on the hackathon website: repo, live link, access instructions + test login, videos, logo, track 03, contract addresses, tx hash. Submit well before 23:59 ET; edits are allowed until then.
