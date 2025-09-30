# POAP Umi + Candy Machine Core Starter

Split-by-workflow Next.js repo for a QR-based attendance → NFT claim flow on Solana using **Umi** + **Candy Machine Core**.

## Features
- App Router, TypeScript, Tailwind, framer-motion, lucide-icons
- Wallet connect via wallet-adapter (Phantom, Backpack, Solflare)
- **Workflow split**: QR scan → exchange → claim-ticket → on-chain mint (Umi mintV2)
- Minimal JWT-based tokening to avoid server state
- Guard-ready (allowList via Merkle proof passthrough)

## Getting Started
```bash
pnpm i # or npm i / yarn
cp .env.example .env.local
pnpm dev
```

## ENV
See `.env.example`. Use devnet first.

## Workflows
- `src/workflows/qr-scan` camera + payload capture
- `src/workflows/verify` calls `/api/exchange` and shows status
- `src/workflows/claim` performs Umi `mintV2`
- `src/components/ui` basic building blocks
- `src/lib/umi` client factory
- `src/server/*` helpers for JWT and (placeholder) Merkle

## API
- `POST /api/exchange` → body: `{ qr, wallet }` → `{ nonce, claimToken, merkleProof? }`
- `POST /api/claim-ticket` → body: `{ claimToken, wallet }` → `{ ok: true }`
- `POST /api/last-mint` → body: `{ wallet, nonce }` → `{ mint? }` (placeholder)

> NOTE: Replace Merkle and last-mint logic with your infra (KV/DB, indexer).

## License
MIT
