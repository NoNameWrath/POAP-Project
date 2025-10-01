import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fetchCandyMachine, publicKey } from '@metaplex-foundation/mpl-candy-machine';

const RPC_ENDPOINT = 'https://api.devnet.solana.com';
const CANDY_MACHINE_ID = '6cmvdsPkBTWoEiFJwQFAtZRaCSUNeRSDJnevJHkhyXMn';

async function main() {
  console.log(`Fetching data for Candy Machine: ${CANDY_MACHINE_ID}`);
  const umi = createUmi(RPC_ENDPOINT);
  const cm = await fetchCandyMachine(umi, publicKey(CANDY_MACHINE_ID));
  console.log("--- On-Chain Candy Machine Data ---");
  console.log(cm);
  console.log("-------------------------------------");
  console.log(`Reported Candy Guard Address: ${cm.candyGuard}`);
}

main();
