import { createWalletClient, http, defineChain, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';

const rpcUrl =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL &&
  !process.env.NEXT_PUBLIC_MONAD_RPC_URL.includes('your-api-key')
    ? process.env.NEXT_PUBLIC_MONAD_RPC_URL
    : 'https://testnet-rpc.monad.xyz';

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  testnet: true,
});

async function main() {
  const privateKey = (process.env.MONAD_DEPLOYER_PRIVATE_KEY || process.argv[2]) as `0x${string}`;

  if (!privateKey || !privateKey.startsWith('0x') || privateKey.length !== 66) {
    console.error('Error: Please provide a valid private key in MONAD_DEPLOYER_PRIVATE_KEY or as argument.');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log(`Deploying from account: ${account.address}`);

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(rpcUrl),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Account balance: ${balance} wei (${Number(balance) / 1e18} MON)`);

  if (balance === BigInt(0)) {
    console.error('Error: Account has 0 MON. Fund it via faucet before deploying.');
    process.exit(1);
  }

  const artifactsDir = path.join(process.cwd(), 'contracts', 'artifacts');
  const deployAll = process.argv.includes('--all');

  let socialGraphAddress = process.env.NEXT_PUBLIC_SOCIAL_GRAPH_ADDRESS || '0x7e87e96bc959fa9ee559fad9c2e3d017d757adf9';
  let registryAddress = process.env.NEXT_PUBLIC_PARTY_REGISTRY_ADDRESS || '0xb7d922488daa522443ffe1627efc6d65825eebad';

  if (deployAll) {
    // 1. Deploy SocialGraph
    console.log('Deploying SocialGraph...');
    const socialGraphBin = fs.readFileSync(path.join(artifactsDir, 'contracts_SocialGraph_sol_SocialGraph.bin'), 'utf-8').trim();
    const socialGraphAbi = JSON.parse(fs.readFileSync(path.join(artifactsDir, 'contracts_SocialGraph_sol_SocialGraph.abi'), 'utf-8'));
    const socialGraphHash = await walletClient.deployContract({
      abi: socialGraphAbi,
      bytecode: `0x${socialGraphBin}`,
      args: [],
    });
    console.log(`SocialGraph deployment tx: ${socialGraphHash}`);
    const socialGraphReceipt = await publicClient.waitForTransactionReceipt({ hash: socialGraphHash });
    socialGraphAddress = socialGraphReceipt.contractAddress!;
    console.log(`SocialGraph deployed at: ${socialGraphAddress}`);

    // 2. Deploy PartyRegistry
    console.log('Deploying PartyRegistry...');
    const registryBin = fs.readFileSync(path.join(artifactsDir, 'contracts_PartyRegistry_sol_PartyRegistry.bin'), 'utf-8').trim();
    const registryAbi = JSON.parse(fs.readFileSync(path.join(artifactsDir, 'contracts_PartyRegistry_sol_PartyRegistry.abi'), 'utf-8'));
    const registryHash = await walletClient.deployContract({
      abi: registryAbi,
      bytecode: `0x${registryBin}`,
      args: [account.address],
    });
    console.log(`PartyRegistry deployment tx: ${registryHash}`);
    const registryReceipt = await publicClient.waitForTransactionReceipt({ hash: registryHash });
    registryAddress = registryReceipt.contractAddress!;
    console.log(`PartyRegistry deployed at: ${registryAddress}`);
  }

  // 3. Deploy PartyTreasury Vault (Multi-Party Native MON)
  console.log('Deploying PartyTreasury Vault...');
  const treasuryBin = fs.readFileSync(path.join(artifactsDir, 'contracts_PartyTreasury_sol_PartyTreasury.bin'), 'utf-8').trim();
  const treasuryAbi = JSON.parse(fs.readFileSync(path.join(artifactsDir, 'contracts_PartyTreasury_sol_PartyTreasury.abi'), 'utf-8'));
  const treasuryHash = await walletClient.deployContract({
    abi: treasuryAbi,
    bytecode: `0x${treasuryBin}`,
    args: [],
  });
  console.log(`PartyTreasury deployment tx: ${treasuryHash}`);
  const treasuryReceipt = await publicClient.waitForTransactionReceipt({ hash: treasuryHash });
  const treasuryAddress = treasuryReceipt.contractAddress!;
  console.log(`PartyTreasury deployed at: ${treasuryAddress}`);

  console.log('\n--- DEPLOYMENT SUCCESSFUL ---');
  console.log(`NEXT_PUBLIC_PARTY_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`NEXT_PUBLIC_PARTY_TREASURY_ADDRESS=${treasuryAddress}`);
  console.log(`NEXT_PUBLIC_SOCIAL_GRAPH_ADDRESS=${socialGraphAddress}`);

  return {
    registryAddress,
    treasuryAddress,
    socialGraphAddress,
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
