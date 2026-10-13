/**
 * Rotate the Monad deployer / relayer key after a leak.
 *
 *   npx tsx scripts/rotate-deployer.ts            # dry run: prints what would happen
 *   npx tsx scripts/rotate-deployer.ts --execute  # generates a new key, sweeps MON to it
 *
 * Reads the CURRENT (leaked) key from MONAD_DEPLOYER_PRIVATE_KEY in .env.local.
 * Writes the NEW key to `.env.rotated.local` (gitignored by `.env*.local`) and never
 * prints it. After it finishes:
 *   1. Replace MONAD_DEPLOYER_PRIVATE_KEY / NEXT_PUBLIC_DEPLOYER_ADDRESS in .env.local
 *      and in the Vercel project with the values from .env.rotated.local.
 *   2. Redeploy contracts with the new key: `npx tsx scripts/deploy.ts --all`
 *      (PartyTreasury and SocialGraph have an immutable `owner`, so the old
 *      deployments cannot be re-owned and must be retired).
 *   3. Update the three NEXT_PUBLIC_*_ADDRESS values (env, Vercel, src/contracts/index.ts
 *      defaults, README, indexer/config.yaml) and redeploy the web app.
 * See docs/SECURITY_INCIDENT_2026-10.md.
 */
import { createPublicClient, createWalletClient, defineChain, http, formatEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import fs from 'node:fs';

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnv('.env.local');
  const execute = process.argv.includes('--execute');
  const rpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
  const chain = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
    testnet: true,
  });

  const oldKey = process.env.MONAD_DEPLOYER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!oldKey || oldKey.length !== 66) throw new Error('MONAD_DEPLOYER_PRIVATE_KEY missing in .env.local');
  const oldAccount = privateKeyToAccount(oldKey);
  const pub = createPublicClient({ chain, transport: http(rpcUrl) });

  const balance = await pub.getBalance({ address: oldAccount.address });
  const gasPrice = await pub.getGasPrice();
  const fee = gasPrice * BigInt(21000) * BigInt(2); // 2x headroom
  const sweep = balance > fee ? balance - fee : BigInt(0);

  console.log(`Leaked account : ${oldAccount.address}`);
  console.log(`Balance        : ${formatEther(balance)} MON`);
  console.log(`Will sweep     : ${formatEther(sweep)} MON`);

  if (fs.existsSync('.env.rotated.local')) {
    throw new Error('.env.rotated.local already exists — a rotation was started. Finish or move it first.');
  }
  if (!execute) {
    console.log('\nDry run. Re-run with --execute to generate the new key and sweep funds.');
    return;
  }

  const newKey = generatePrivateKey();
  const newAccount = privateKeyToAccount(newKey);
  // Persist BEFORE moving funds so the key can never be lost mid-rotation.
  fs.writeFileSync(
    '.env.rotated.local',
    `# Generated ${new Date().toISOString()} by scripts/rotate-deployer.ts\n` +
      `MONAD_DEPLOYER_PRIVATE_KEY=${newKey}\nNEXT_PUBLIC_DEPLOYER_ADDRESS=${newAccount.address}\n`,
    { mode: 0o600 },
  );
  console.log(`New account    : ${newAccount.address} (key written to .env.rotated.local)`);

  if (sweep > BigInt(0)) {
    const wallet = createWalletClient({ account: oldAccount, chain, transport: http(rpcUrl) });
    const hash = await wallet.sendTransaction({ to: newAccount.address, value: sweep, gas: BigInt(21000), gasPrice });
    const receipt = await pub.waitForTransactionReceipt({ hash });
    console.log(`Sweep tx       : ${hash} (${receipt.status})`);
  }
  console.log('\nNext: follow steps 1–3 in the header of this file.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
