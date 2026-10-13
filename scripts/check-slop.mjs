#!/usr/bin/env node

/**
 * CI Guard: Slop Detector
 * Checks for:
 * 1. Unsplash stock images
 * 2. Hardcoded fallback names ('Law', 'Ana', 'Carlos')
 * 3. Blockchain jargon in consumer views (\b(MON|Monad|onchain|testnet|faucet|ledger)\b)
 *    with baseline regression enforcement (scripts/slop-baseline.json)
 * 4. Decorative emojis in chrome / labels
 */

import fs from 'node:fs';
import path from 'node:path';

const isStrict = process.argv.includes('--strict');
const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const BASELINE_PATH = path.join(ROOT_DIR, 'scripts', 'slop-baseline.json');

// Baseline tracking for legacy crypto mentions in non-game consumer views
let baseline = { cryptoJargon: {} };
if (fs.existsSync(BASELINE_PATH)) {
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
  } catch {
    baseline = { cryptoJargon: {} };
  }
}

// Regex rules
// Crypto terms: MON strictly uppercase, other terms case-insensitive
const UNSPLASH_REGEX = /images\.unsplash\.com/;
const FAKE_NAMES_REGEX = /['"`](Law|Ana|Carlos)['"`]/;
const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

function isCryptoJargon(line) {
  // Matches exact uppercase MON as whole word or case-insensitive crypto jargon
  return (
    /\bMON\b/.test(line) ||
    /\b(monad|onchain|testnet|faucet|ledger|sponsored\s+gas|social\s+graph\s+reputation)\b/i.test(line)
  );
}

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        walkDir(fullPath, fileList);
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = walkDir(SRC_DIR);

const violations = {
  unsplash: [],
  fakeNames: [],
  cryptoJargon: [],
  emojis: [],
};

const cryptoCountsByFile = {};

for (const filePath of files) {
  const relPath = path.relative(ROOT_DIR, filePath);

  // Explicit documented exceptions:
  // 1. Backend API routes (handling web3 rpc/database directly)
  const isApi = relPath.startsWith('src/app/api');
  // 2. Unit and integration tests, and static test mock fixtures
  const isMock = relPath.includes('mockData') || relPath.includes('tests');
  // 3. Legal and compliance pages (Privacy Policy, Terms of Service)
  const isLegal = relPath.includes('/privacy') || relPath.includes('/terms');
  // 4. Low-level blockchain smart contracts and web3 primitives
  const isInfra =
    relPath.startsWith('src/contracts') ||
    relPath.startsWith('src/lib/web3') ||
    relPath === 'src/services/treasury.ts';

  const isMarketingSplash = relPath === 'src/components/views/SplashView.tsx';

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let insideTechnicalDetails = false;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // 1. Unsplash in user data fallbacks (excluding marketing landing showcase)
    if (!isMarketingSplash && UNSPLASH_REGEX.test(line) && !line.includes('includes(') && !line.includes('isStockPhoto')) {
      violations.unsplash.push({ file: relPath, line: lineNum, text: trimmed });
    }

    // 2. Fake names
    if (!isMock && FAKE_NAMES_REGEX.test(line)) {
      violations.fakeNames.push({ file: relPath, line: lineNum, text: trimmed });
    }

    // 3. Crypto jargon in consumer UI
    // Track technical details accordion exemption (closed by default)
    if (line.includes('<details') || line.includes('technicalDetails')) {
      insideTechnicalDetails = true;
    }
    if (insideTechnicalDetails && line.includes('</details>')) {
      insideTechnicalDetails = false;
      return;
    }
    if (insideTechnicalDetails) {
      return;
    }

    const isComment =
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*');

    if (!isApi && !isLegal && !isMock && !isInfra && !isComment && isCryptoJargon(line)) {
      violations.cryptoJargon.push({ file: relPath, line: lineNum, text: trimmed });
      cryptoCountsByFile[relPath] = (cryptoCountsByFile[relPath] || 0) + 1;
    }

    // 4. Emojis in components
    if (!isApi && !isMock && relPath.startsWith('src/components') && EMOJI_REGEX.test(line)) {
      if (!isComment) {
        violations.emojis.push({ file: relPath, line: lineNum, text: trimmed });
      }
    }
  });
}

// Compare crypto jargon counts with baseline
const baselineRegressions = [];
const baselineMatches = [];

for (const [file, count] of Object.entries(cryptoCountsByFile)) {
  const allowed = baseline.cryptoJargon?.[file] || 0;
  if (count > allowed) {
    baselineRegressions.push({
      file,
      count,
      allowed,
      diff: count - allowed,
    });
  } else {
    baselineMatches.push({ file, count, allowed });
  }
}

console.log('\n--- Partylot Slop Audit Report ---');
console.log(`Unsplash stock image usages: ${violations.unsplash.length}`);
console.log(`Fake fallback names:        ${violations.fakeNames.length}`);
console.log(`Decorative UI emojis:       ${violations.emojis.length}`);
console.log(`Crypto jargon occurrences:  ${violations.cryptoJargon.length}`);
console.log(`  └─ Baseline legacy debt:  ${baselineMatches.reduce((acc, m) => acc + m.count, 0)} (across ${baselineMatches.length} files)`);
console.log(`  └─ Baseline regressions:  ${baselineRegressions.length} files`);

if (baselineRegressions.length > 0) {
  console.error('\n❌ Crypto Slop Baseline REGRESSIONS:');
  for (const reg of baselineRegressions) {
    console.error(`   ${reg.file}: ${reg.count} occurrences (baseline allowed: ${reg.allowed}, +${reg.diff} slop added)`);
  }
}

console.log('----------------------------------\n');

const hasAbsoluteViolations =
  violations.unsplash.length > 0 ||
  violations.fakeNames.length > 0 ||
  violations.emojis.length > 0;

if (baselineRegressions.length > 0 || (hasAbsoluteViolations && isStrict)) {
  console.error('❌ Check-slop FAILED: Found regressions or strict violations.');
  process.exit(1);
} else {
  console.log('✅ Check-slop PASSED: 0 regressions, all checks within baseline.');
  process.exit(0);
}
