import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, keccak256, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getServerSupabase } from '@/lib/supabase/server';
import { MONAD_CONTRACT_ADDRESSES, SocialGraphABI } from '@/contracts';
import { publicMonadClient, getMonadExplorerTxUrl, monadTestnet } from '@/lib/web3/monad';

// Fallback deployer key from configuration if environment variable is not explicitly loaded
const DEPLOYER_PRIVATE_KEY =
  (process.env.MONAD_DEPLOYER_PRIVATE_KEY as `0x${string}`) ||
  '0x1d997eba6837b93fad843164844e7ed2a4dbcba34492f6d2b28c58467cc8016b';

function resolveValidAddress(rawAddress?: string | null, userId?: string | null): `0x${string}` {
  if (rawAddress && rawAddress.startsWith('0x') && rawAddress.length === 42) {
    return rawAddress as `0x${string}`;
  }
  // Deterministic fallback derived from user identifier
  const seed = userId || rawAddress || 'partylot-anon';
  const hash = keccak256(toHex(seed));
  return `0x${hash.slice(26, 66)}` as `0x${string}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { partyId, userAAddress, userBAddress, userAId, userBId, userAName, userBName } = body;

    const supabase = getServerSupabase();

    // 1. Resolve participant addresses
    let addrA = userAAddress;
    let addrB = userBAddress;

    if (!addrA && userAId) {
      const { data: userA } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', userAId)
        .single();
      if (userA?.wallet_address) addrA = userA.wallet_address;
    }

    if (!addrB && userBId) {
      const { data: userB } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', userBId)
        .single();
      if (userB?.wallet_address) addrB = userB.wallet_address;
    }

    const validAddrA = resolveValidAddress(addrA, userAId);
    const validAddrB = resolveValidAddress(addrB, userBId);

    // 2. Derive numeric party ID for the smart contract
    const partyNumericId = BigInt(
      (partyId || '404').replace(/[^0-9]/g, '').slice(0, 10) || '404'
    );

    // 3. Prepare Monad Testnet wallet client with deployer private key
    const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);
    const rpcUrl =
      process.env.NEXT_PUBLIC_MONAD_RPC_URL &&
      !process.env.NEXT_PUBLIC_MONAD_RPC_URL.includes('your-api-key')
        ? process.env.NEXT_PUBLIC_MONAD_RPC_URL
        : 'https://testnet-rpc.monad.xyz';

    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(rpcUrl),
    });

    // 4. Execute on-chain transaction on SocialGraph.sol
    const txHash = await walletClient.writeContract({
      address: MONAD_CONTRACT_ADDRESSES.socialGraph,
      abi: SocialGraphABI,
      functionName: 'recordGathering',
      args: [partyNumericId, [validAddrA, validAddrB]],
    });

    // 5. Wait for on-chain confirmation on Monad Testnet
    const receipt = await publicMonadClient.waitForTransactionReceipt({
      hash: txHash,
    });

    // 6. Query updated verified nights together from smart contract
    let nightsTogether = 1;
    try {
      const count = await publicMonadClient.readContract({
        address: MONAD_CONTRACT_ADDRESSES.socialGraph,
        abi: SocialGraphABI,
        functionName: 'getNightsTogether',
        args: [validAddrA, validAddrB],
      });
      nightsTogether = Number(count);
    } catch (readErr) {
      console.warn('Could not read nights count after tx:', readErr);
    }

    // 7. Synchronize database state in Supabase
    if (partyId) {
      // Update nights_together for both party members if registered in party
      if (userAId) {
        await supabase
          .from('party_members')
          .update({ nights_together: nightsTogether })
          .eq('party_id', partyId)
          .eq('user_id', userAId);
      }
      if (userBId) {
        await supabase
          .from('party_members')
          .update({ nights_together: nightsTogether })
          .eq('party_id', partyId)
          .eq('user_id', userBId);
      }

      // Record live feed activity for the certified bond
      const labelA = userAName || 'Member';
      const labelB = userBName || 'Member';
      await supabase.from('activities').insert({
        id: `act-social-${Date.now()}`,
        party_id: partyId,
        type: 'game',
        text: `⚡ ${labelA} y ${labelB} sincronizaron su vínculo en Monad Blockchain (${nightsTogether} noches)`,
        time: 'Just now',
      });
    }

    return NextResponse.json({
      success: true,
      txHash,
      blockNumber: Number(receipt.blockNumber),
      explorerUrl: getMonadExplorerTxUrl(txHash),
      nightsTogether,
      participants: [validAddrA, validAddrB],
    });
  } catch (error) {
    console.error('SocialGraph attest error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error recording gathering onchain',
      },
      { status: 500 }
    );
  }
}
