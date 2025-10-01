import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { readFileSync } from 'fs';

const KEYPAIR_PATH = '/Users/wrath/.config/solana/id.json';

const umi = createUmi('https://api.devnet.solana.com');

let keypairBytes;
try {
  const keypairFileContent = readFileSync(KEYPAIR_PATH, { encoding: 'utf-8' });
  keypairBytes = new Uint8Array(JSON.parse(keypairFileContent));
} catch (error) {
  console.error(`❌ Failed to read or parse keypair from path: ${KEYPAIR_PATH}`);
  console.error("Please make sure this path is correct and the file is a valid Solana keypair JSON file.");
}

if (keypairBytes) {
  const keypair = umi.eddsa.createKeypairFromSecretKey(keypairBytes);
  console.log("The connected wallet address is:");
  console.log(keypair.publicKey.toString());
}