#!/usr/bin/env node
/**
 * CI guard: secrets in tracked files.
 *
 * Fails if any git-tracked file contains something that looks like a private key,
 * a service-role JWT, or a provider API token. Runs in `pnpm release:check`.
 *
 * Why this exists: a funded Monad deployer key was committed once (scripts/
 * test-monad-treasury-playwright.mjs, Oct 5 2026) and is still in public history.
 * See docs/SECURITY_INCIDENT_2026-10.md.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((f) => !/(^|\/)(pnpm-lock\.yaml|package-lock\.json)$/.test(f))
  .filter((f) => !f.startsWith('contracts/artifacts/'))
  .filter((f) => !/\.(png|jpe?g|webp|gif|ico|mp4|mp3|wav|ogg|glb|ttf|woff2?|pdf)$/i.test(f));

// Obvious placeholders that are allowed to look like keys.
const PLACEHOLDER = /^0x(0{64}|1{64}|2{64}|a{64}|b{64}|f{64})$|1234567890abcdef|abcdef1234567890/i;

const RULES = [
  // 32-byte hex next to a key-ish name (private keys, mnemonics-as-hex, signer keys)
  {
    name: 'hex private key',
    re: /(private[_-]?key|secret|signer|deployer|mnemonic|wallet(Address)?)\W{0,40}(0x)?[0-9a-fA-F]{64}\b/gi,
    value: (m) => (m.match(/(0x)?[0-9a-fA-F]{64}/) || [''])[0],
  },
  { name: 'PEM private key', re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Supabase service-role / JWT', re: /eyJhbGciOi[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
  { name: 'Privy app secret', re: /privy_app_secret_[A-Za-z0-9]{20,}/g },
  { name: 'Pimlico key', re: /\bpim_[A-Za-z0-9]{20,}\b/g },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/g },
];

const hits = [];
for (const file of files) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const rule of RULES) {
    for (const m of text.matchAll(rule.re)) {
      const value = rule.value ? rule.value(m[0]) : m[0];
      if (PLACEHOLDER.test(value)) continue;
      const line = text.slice(0, m.index).split('\n').length;
      hits.push(`${file}:${line}  ${rule.name}`);
    }
  }
}

if (hits.length) {
  console.error('\n✗ check-secrets: possible secrets in tracked files (values not printed):');
  for (const h of hits) console.error('  ' + h);
  console.error('\nMove them to .env.local / the host secret store, rotate the leaked value, and re-run.\n');
  process.exit(1);
}
console.log(`✓ check-secrets: ${files.length} tracked files clean`);
