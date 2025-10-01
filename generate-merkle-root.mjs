import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import fs from 'fs';

// 1. Read the allowlist file
const allowlist = JSON.parse(fs.readFileSync('poap-drop/allowlist.json', 'utf-8'));

// 2. Create the leaf nodes
const leafNodes = allowlist.map(addr => keccak256(addr));

// 3. Create the Merkle Tree
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

// 4. Get the Merkle Root
const merkleRoot = merkleTree.getRoot().toString('hex');

console.log('Merkle Root:', merkleRoot);
