'use client'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { Umi } from '@metaplex-foundation/umi'

export function makeUmi(): Umi {
  const endpoint = process.env.NEXT_PUBLIC_RPC!
  return createUmi(endpoint)
}
