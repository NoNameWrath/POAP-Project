import { readFileSync } from 'fs';
import bs58 from 'bs58';

const KEYPAIR_PATH = '/Users/wrath/.config/solana/id.json';

console.log("🔑 Exporting private key...");

try {
  const keypairFileContent = readFileSync(KEYPAIR_PATH, { encoding: 'utf-8' });
  const keypairBytes = new Uint8Array(JSON.parse(keypairFileContent));

  // The private key for import is the base58 encoding of the full 64-byte keypair array.
  const privateKey = bs58.encode(keypairBytes);

  console.log("✅ Success! Here is your private key to import into Phantom:");
  console.log(privateKey);
} catch (error) {
  console.error(`❌ Failed to read or parse keypair from path: ${KEYPAIR_PATH}`);
  console.error("Please make sure this path is correct and the file is a valid Solana keypair JSON file.");
}
