'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loader2, Medal, AlertTriangle } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { makeUmi } from '@/lib/umi/createUmiClient'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { publicKey, generateSigner } from '@metaplex-foundation/umi'
import {
  fetchCandyMachine,
  mint as mintLegacy,
  mintV2,
} from '@metaplex-foundation/mpl-candy-machine'
import bs58 from 'bs58'

// web3.js for balance + logs
import {
  Connection,
  PublicKey as Web3PublicKey,
  LAMPORTS_PER_SOL,
  SendTransactionError,
} from '@solana/web3.js'

const API = process.env.NEXT_PUBLIC_API_BASE || ''
const RAW_CM = process.env.NEXT_PUBLIC_CM_ID
const RAW_COLLECTION = process.env.NEXT_PUBLIC_COLLECTION_MINT
const RPC = process.env.NEXT_PUBLIC_RPC || 'https://api.devnet.solana.com'

// ~0.05 SOL buffer for devnet fees/rent
const MIN_LAMPORTS = 0.05 * LAMPORTS_PER_SOL

type Props = {
  enabled: boolean
  claimToken: string
  merkleProof?: unknown
  onMinted: (mint: string) => void
}

const mask = (s: string) => (s.length <= 12 ? s : `${s.slice(0, 5)}…${s.slice(-5)}`)

function requireBase58Str(varName: string, v: unknown): string {
  if (typeof v !== 'string') throw new Error(`${varName} is undefined on client. Prefix with NEXT_PUBLIC_ and restart dev.`)
  const s = v.trim().replace(/^['"]|['"]$/g, '')
  if (!s) throw new Error(`${varName} is empty`)
  let bytes: Uint8Array
  try { bytes = bs58.decode(s) } catch (e: any) {
    throw new Error(`${varName} not valid base58 (${mask(s)}). ${e?.message || ''}`.trim())
  }
  if (bytes.length !== 32) throw new Error(`${varName} must decode to 32 bytes (${mask(s)}), got ${bytes.length}`)
  return s
}

function normalizeMerkleProof(input: unknown): Uint8Array[] {
  if (!input) return []
  if (!Array.isArray(input)) throw new Error('merkleProof must be an array')
  return input.filter((x) => x != null).map((x) => {
    if (x instanceof Uint8Array) return x
    if (Array.isArray(x)) return new Uint8Array(x as number[])
    if (typeof x === 'string') return bs58.decode(x.trim())
    throw new Error('merkleProof element must be base58 string or bytes')
  })
}

async function ensureFunds(connection: Connection, owner: string) {
  const pk = new Web3PublicKey(owner)
  const bal = await connection.getBalance(pk, 'confirmed')
  if (bal >= MIN_LAMPORTS) return

  const isDevnet = /devnet|localhost|127\.0\.0\.1/i.test(connection.rpcEndpoint)
  if (!isDevnet) {
    throw new Error(
      `Insufficient SOL on current cluster. Need ~${MIN_LAMPORTS / LAMPORTS_PER_SOL} SOL, have ${bal / LAMPORTS_PER_SOL}.`
    )
  }
  // Try 2x airdrop on devnet
  const need = Math.ceil((MIN_LAMPORTS - bal) / LAMPORTS_PER_SOL)
  for (let i = 0; i < Math.max(1, need); i++) {
    const sig = await connection.requestAirdrop(pk, 1 * LAMPORTS_PER_SOL)
    await connection.confirmTransaction(sig, 'confirmed')
  }
}

export function Claim({ enabled, claimToken, merkleProof, onMinted }: Props) {
  const { wallet, connected, publicKey: walletPk, connect } = useWallet()
  const { setVisible } = useWalletModal()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleClaim() {
    setErr(null)
    setBusy(true)
    const connection = new Connection(RPC, 'confirmed')

    try {
      // 0) Wallet connect
      if (!wallet) { setVisible(true); throw new Error('Pick a wallet to continue') }
      if (!connected) await connect()
      if (!walletPk) throw new Error('Wallet connection was cancelled')

      // 1) Resolve inputs as strings
      const cmStr = requireBase58Str('NEXT_PUBLIC_CM_ID', RAW_CM)
      const colStr = requireBase58Str('NEXT_PUBLIC_COLLECTION_MINT', RAW_COLLECTION)
      const updateAuthStr = walletPk.toBase58()
      const proof = normalizeMerkleProof(merkleProof)

      console.debug('[claim] inputs', {
        CM: mask(cmStr), COLLECTION: mask(colStr), UPDATE_AUTH: mask(updateAuthStr), proofCount: proof.length, rpc: RPC,
      })

      // 2) Ensure payer has funds (auto-airdrop on devnet)
      await ensureFunds(connection, updateAuthStr)

      // 3) Anti-replay
      const resp = await fetch(`${API}/api/claim-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimToken, wallet: updateAuthStr }),
      })
      if (!resp.ok) throw new Error((await resp.text().catch(() => '')) || 'Claim ticket refused by server')

      // 4) Umi identity + mint keypair
      const umi = makeUmi().use(walletAdapterIdentity(wallet.adapter))
      if (!umi.identity?.publicKey) throw new Error('Wallet identity not ready, reopen your wallet and try again')
      const nftMint = generateSigner(umi)

      // 5) Fetch Candy Machine to decide mint route
      const cmPk = publicKey(cmStr)
      const colPk = publicKey(colStr)
      const updPk = publicKey(updateAuthStr)

      let cm
      try {
        cm = await fetchCandyMachine(umi, cmPk)
      } catch (e) {
        throw new Error(`Candy Machine ${mask(cmStr)} not found on current cluster ${RPC}`)
      }

      // Check if the candy machine is guarded by comparing its authority to the user's wallet.
      const isGuarded = cm.authority.toString() !== walletPk.toBase58();

      if (!isGuarded) {
        console.log("Minting from an unguarded machine...");
        // Not guarded -> use legacy mint
        await mintLegacy(umi, {
          candyMachine: cmPk,
          collectionMint: colPk,
          collectionUpdateAuthority: updPk,
          nftMint,
        }).sendAndConfirm(umi);
      } else {
        console.log("Minting from a guarded machine...");
        // Guarded -> the authority is the guard address
        const guardAddr = cm.authority;
        await mintV2(umi, {
          candyMachine: cmPk,
          candyGuard: guardAddr,
          collectionMint: colPk,
          collectionUpdateAuthority: updPk,
          nftMint,
          guards: proof.length ? { allowList: { merkleProof: proof } } : undefined,
        }).sendAndConfirm(umi);
      }

      // 6) Optionally fetch newest mint for UI
      const receipt = await fetch(`${API}/api/last-mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: updateAuthStr }),
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null)

      onMinted(receipt?.mint || nftMint.publicKey.toString())
    } catch (e: any) {
      // Surface full sim logs if available
      try {
        if (e instanceof SendTransactionError && typeof e.getLogs === 'function') {
          const logs = await e.getLogs(new Connection(RPC, 'confirmed'))
          console.error('[claim logs]', logs)
        }
      } catch {}
      const m = String(e?.message || e || '')
      setErr(m || 'Claim failed')
      console.error('[claim]', e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Medal className="w-5 h-5" /> Claim POAP
        </h3>
        <Badge>{connected ? 'Wallet Connected' : 'Step 4'}</Badge>
      </div>

      <div className="mt-4">
        <button
          disabled={!enabled || busy}
          onClick={handleClaim}
          className={`w-full inline-flex items-center justify-center rounded-lg px-4 py-2 text-white ${
            !enabled || busy ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
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
