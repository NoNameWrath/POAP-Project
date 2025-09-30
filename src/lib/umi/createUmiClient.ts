'use client'

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import type { Umi } from '@metaplex-foundation/umi'
import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine' // ✅ v6 plugin

export function makeUmi(): Umi {
  const endpoint = process.env.NEXT_PUBLIC_RPC!
  return createUmi(endpoint)
    .use(mplCandyMachine()) // ✅ registers Candy Machine + Candy Guard programs for the cluster
}
