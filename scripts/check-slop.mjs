#!/usr/bin/env node

/**
 * CI Guard: Slop Detector
 * Checks for:
 * 1. Unsplash stock images
 * 2. Hardcoded fallback names ('Law', 'Ana', 'Carlos')
 * 3. Blockchain jargon in consumer views
 * 4. Decorative emojis in chrome / labels
 */

import fs from 'node:fs';
import path from 'node:path';

const isStrict = process.argv.includes('--strict');
const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');

const CRYPTO_REGEX = /\b(monad\s+testnet|sponsored\s+gas|faucet|ledger|onchain\s+record|social\s+graph\s+reputation)\b/i;
const UNSPLASH_REGEX = /images\.unsplash\.com/;
const FAKE_NAMES_REGEX = /['"`](Law|Ana|Carlos)['"`]/;
// General emoji range: pictographs, emoticons, symbols
const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

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

for (const filePath of files) {
  const relPath = path.relative(ROOT_DIR, filePath);

  // Skip API routes, test files, mock data for certain checks
  const isApi = relPath.startsWith('src/app/api');
  const isMock = relPath.includes('mockData') || relPath.includes('tests');
  const isLegal = relPath.includes('/privacy') || relPath.includes('/terms');

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // 1. Unsplash
    if (UNSPLASH_REGEX.test(line)) {
      violations.unsplash.push({ file: relPath, line: lineNum, text: line.trim() });
    }

    // 2. Fake names
    if (!isMock && FAKE_NAMES_REGEX.test(line)) {
      violations.fakeNames.push({ file: relPath, line: lineNum, text: line.trim() });
    }

    // 3. Crypto jargon in consumer UI
    if (!isApi && !isLegal && !isMock && CRYPTO_REGEX.test(line)) {
      violations.cryptoJargon.push({ file: relPath, line: lineNum, text: line.trim() });
    }

    // 4. Emojis in components
    if (!isApi && !isMock && relPath.startsWith('src/components') && EMOJI_REGEX.test(line)) {
      // Allow comment lines
      if (!line.trim().startsWith('//') && !line.trim().startsWith('/*') && !line.trim().startsWith('*')) {
        violations.emojis.push({ file: relPath, line: lineNum, text: line.trim() });
      }
    }
  });
}

const totalViolations =
  violations.unsplash.length +
  violations.fakeNames.length +
  violations.cryptoJargon.length +
  violations.emojis.length;

console.log('\n--- Partylot Slop Audit Report ---');
console.log(`Unsplash stock image usages: ${violations.unsplash.length}`);
console.log(`Fake fallback names:        ${violations.fakeNames.length}`);
console.log(`Crypto jargon occurrences:  ${violations.cryptoJargon.length}`);
console.log(`Decorative UI emojis:       ${violations.emojis.length}`);
console.log(`Total slop occurrences:     ${totalViolations}`);
console.log('----------------------------------\n');

if (totalViolations > 0) {
  if (isStrict) {
    console.error(`❌ Check-slop FAILED: Found ${totalViolations} violations in --strict mode.`);
    process.exit(1);
  } else {
    console.warn(`⚠️  Check-slop: ${totalViolations} violations cataloged for Phase 1 cleanup.`);
    process.exit(0);
  }
} else {
  console.log('✅ Check-slop PASSED: 0 violations found. The UI is clean!');
  process.exit(0);
}
