'use client'

import { motion } from 'framer-motion'
import { Providers } from '@/providers/Providers'
import { ClaimFlow } from '@/features/claim/ClaimFlow'

export default function Page() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold tracking-tight">
          🎓 Event POAP Claim
        </motion.h1>
        <p className="text-gray-600 mt-2">Scan, verify, and mint your attendance NFT on Solana.</p>

        <Providers>
          <div className="mt-8">
            <ClaimFlow />
          </div>
        </Providers>

        <footer className="text-xs text-gray-500 mt-10">
          Built with Umi + Candy Machine Core. Make sure your guards match the server proofs.
        </footer>
      </div>
    </div>
  )
}
