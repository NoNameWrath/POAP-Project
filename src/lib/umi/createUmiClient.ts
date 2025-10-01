'use client'

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import type { Umi } from '@metaplex-foundation/umi'
import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'

export function makeUmi(): Umi {
  const endpoint = process.env.NEXT_PUBLIC_RPC
  if (!endpoint) {
    throw new Error('Config error: set NEXT_PUBLIC_RPC in .env.local')
  }
  return createUmi(endpoint)
    .use(mplCandyMachine())
    .use(mplTokenMetadata())
}
