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
const CANDY_MACHINE_ID = process.env.NEXT_PUBLIC_CM_ID
const COLLECTION_MINT = process.env.NEXT_PUBLIC_COLLECTION_MINT

function safePk(label: string, v?: string) {
  try {
    if (!v || typeof v !== 'string' || v.trim() === '') throw new Error(`${label} missing`)
    return publicKey(v.trim())
  } catch (e: any) {
    throw new Error(`${label} invalid: ${e?.message || 'bad value'}`)
  }
}

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
  const { wallet, connected, publicKey: walletPk } = useWallet()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleClaim() {
    try {
      setBusy(true)
      setErr(null)

      // 0) Ensure a wallet adapter exists and is initialized
      if (!wallet) throw new Error('No wallet adapter selected')
      if (!connected) {
        // user gesture path, safe to call inside a click handler
        await wallet.connect()
      }
      if (!wallet.publicKey) throw new Error('Wallet failed to connect')

      // 1) Normalize inputs
      const cmPk = safePk('NEXT_PUBLIC_CM_ID', CANDY_MACHINE_ID)
      const colPk = safePk('NEXT_PUBLIC_COLLECTION_MINT', COLLECTION_MINT)
      const proof: string[] = Array.isArray(merkleProof) ? merkleProof.filter(Boolean) : []
      const hasProof = proof.length > 0

      // 2) Anti-replay with server
      const check = await fetch(`${API}/api/claim-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimToken, wallet: wallet.publicKey.toBase58() }),
      })
      if (!check.ok) throw new Error((await check.text().catch(() => '')) || 'Claim ticket refused')

      // 3) Umi client + identity (after connect)
      const umi = makeUmi()
      umi.use(walletAdapterIdentity(wallet))
      const idPk = umi.identity?.publicKey
      if (!idPk) throw new Error('Wallet identity not ready, reconnect your wallet')

      // 4) Mint — pass collectionUpdateAuthority explicitly
      await mintV2(umi, {
        candyMachine: cmPk,
        collectionMint: colPk,
        collectionUpdateAuthority: idPk,
        guards: hasProof ? { allowList: { merkleProof: proof } } : undefined,
      }).sendAndConfirm(umi)

      // 5) Resolve last mint (optional)
      const receipt = await fetch(`${API}/api/last-mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: wallet.publicKey.toBase58() }),
      })
        .then((r) => r.json())
        .catch(() => null)

      onMinted(receipt?.mint || '')
    } catch (e: any) {
      // common adapter errors to surface nicely
      if (e?.name === 'WalletNotReadyError') {
        setErr('Selected wallet is not ready. Open the wallet app/extension and try again.')
      } else if (e?.message?.toLowerCase?.().includes('user rejected')) {
        setErr('Wallet connection rejected.')
      } else {
        setErr(e?.message || 'Mint failed')
      }
      console.error('Claim error:', e)
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
