import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCandyMachine, setMintAuthority } from '@metaplex-foundation/mpl-candy-machine';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { readFileSync } from 'fs';

// --- CONFIGURATION ---
const RPC_ENDPOINT = 'https://api.devnet.solana.com';
// IMPORTANT: Update this to the absolute path of the keypair you used to create the candy machine.
const KEYPAIR_PATH = '/Users/wrath/.config/solana/id.json';
const CANDY_MACHINE_ID = '6cmvdsPkBTWoEiFJwQFAtZRaCSUNeRSDJnevJHkhyXMn';
const NEW_CANDY_GUARD_ID = 'AECR5DupJEpW1rqCNMpDfeWs8oUeEqZsZ8BoT8YzKb9t';
// --- END CONFIGURATION ---

async function main() {
  console.log("🚀 Starting authority update script...");

  // 1. Load user's keypair
  let keypairBytes;
  try {
    keypairBytes = readFileSync(KEYPAIR_PATH);
  } catch (error) {
    console.error(`❌ Failed to load keypair from path: ${KEYPAIR_PATH}`);
    console.error("Please make sure this path is correct and you have permissions to read it.");
    return;
  }

  // 2. Create Umi instance and set identity
  const umi = createUmi(RPC_ENDPOINT).use(mplCandyMachine());
  const keypair = umi.eddsa.createKeypairFromSecretKey(keypairBytes);
  umi.use(keypairIdentity(keypair));

  console.log(`👤 Using wallet: ${umi.identity.publicKey.toString()}`);
  console.log(`🍬 Targeting Candy Machine: ${CANDY_MACHINE_ID}`);
  console.log(`🛡️ New Authority (Candy Guard): ${NEW_CANDY_GUARD_ID}`);

  // 3. Build and send the transaction
  try {
    const tx = await setMintAuthority(umi, {
        candyMachine: publicKey(CANDY_MACHINE_ID),
        authority: umi.identity,
        mintAuthority: publicKey(NEW_CANDY_GUARD_ID),
    }).sendAndConfirm(umi);

    console.log("✅ Transaction successful!");
    console.log(`✍️ Signature: ${tx.signature.toString()}`);
    console.log(`🔍 View on Explorer: https://explorer.solana.com/tx/${tx.signature.toString()}?cluster=devnet`);

  } catch (error) {
    console.error('❌ Error setting authority:', error);
  }
}

main();