import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'POAP Claim • Umi + Candy Machine',
  description: 'Scan, verify, and mint your attendance NFT on Solana.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
