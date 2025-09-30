'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loader2, Medal, AlertTriangle } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { makeUmi } from '@/lib/umi/createUmiClient'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { publicKey } from '@metaplex-foundation/umi'
import { mintV2 } from '@metaplex-foundation/mpl-candy-machine'

const API = process.env.NEXT_PUBLIC_API_BASE || ''
const CANDY_MACHINE_ID = process.env.NEXT_PUBLIC_CM_ID!
const COLLECTION_MINT = process.env.NEXT_PUBLIC_COLLECTION_MINT!

export function Claim({
  enabled,
  claimToken,
  merkleProof,
  onMinted,
}: {
  enabled: boolean
  claimToken: string
  merkleProof?: string[]
  onMinted: (mint: string) => void
}) {
  const { publicKey: walletPk, wallet } = useWallet()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleClaim() {
    if (!walletPk || !wallet) return
    try {
      setBusy(true)
      setErr(null)

      // Final server-side anti-replay
      const check = await fetch(`${API}/api/claim-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimToken, wallet: walletPk.toBase58() }),
      })
      if (!check.ok) {
        const txt = await check.text()
        throw new Error(txt || 'Claim ticket refused')
      }

      // ---- UMI SETUP ----
      const umi = makeUmi()
      umi.use(walletAdapterIdentity(wallet)) // ✅ attach wallet

      // Only include allowList guard if proof is a valid array
      const hasProof =
        Array.isArray(merkleProof) &&
        merkleProof.length > 0 &&
        merkleProof.every((s) => typeof s === 'string')

      await mintV2(umi, {
        candyMachine: publicKey(CANDY_MACHINE_ID),
        collectionMint: publicKey(COLLECTION_MINT),
        guards: hasProof ? { allowList: { merkleProof } } : undefined,
      }).sendAndConfirm(umi)
      // --------------------

      // Optional: ask server to resolve mint
      const receipt = await fetch(`${API}/api/last-mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletPk.toBase58() }),
      })
        .then((r) => r.json())
        .catch(() => null)

      onMinted(receipt?.mint || '')
    } catch (e: any) {
      setErr(e.message || 'Mint failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Medal className="w-5 h-5" /> Claim NFT
        </h3>
        <Badge>{enabled ? 'Ready' : 'Locked'}</Badge>
      </div>

      <div className="mt-4">
        <button
          onClick={handleClaim}
          disabled={!enabled || busy}
          className="w-full rounded-xl px-4 py-3 text-white bg-black hover:opacity-90 disabled:opacity-50"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Minting…
            </span>
          ) : (
            'Claim My POAP'
          )}
        </button>

        {err && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {err}
          </div>
        )}
      </div>
    </Card>
  )
}
