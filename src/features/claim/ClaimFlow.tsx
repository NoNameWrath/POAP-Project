'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Stepper } from '@/components/ui/Stepper'
import { QrScan } from '@/workflows/qr-scan/QrScan'
import { Verify } from '@/workflows/verify/Verify'
import { Claim } from '@/workflows/claim/Claim'
import { CheckCircle, Ticket, Clock, MapPin, ShieldCheck } from 'lucide-react'

const EVENT = {
  title: process.env.NEXT_PUBLIC_EVENT_TITLE || 'Event',
  subtitle: process.env.NEXT_PUBLIC_EVENT_SUBTITLE || 'POAP',
  when: process.env.NEXT_PUBLIC_EVENT_WHEN,
  where: process.env.NEXT_PUBLIC_EVENT_WHERE,
  image: '/poap-cover.png',
  description: 'Scan the rotating QR at the entrance to verify your presence, then mint your commemorative NFT. One per wallet.',
}

export function ClaimFlow() {
  const { publicKey, connected } = useWallet()
  const [step, setStep] = useState(connected ? 1 : 0)
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [claimToken, setClaimToken] = useState<string | null>(null)
  const [nonce, setNonce] = useState<string | null>(null)
  const [merkleProof, setMerkleProof] = useState<string[] | undefined>(undefined)
  const [mintAddress, setMintAddress] = useState<string | null>(null)

  useEffect(() => { if (connected) setStep((s) => Math.max(s, 1)) }, [connected])

  return (
    <div className="max-w-4xl mx-auto">
      <Stepper step={step} />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 via-pink-100 to-amber-100 opacity-70" />
          <div className="relative flex items-center gap-4">
            <img src={EVENT.image} alt="event" className="w-20 h-20 rounded-2xl object-cover" />
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Ticket className="w-5 h-5" /> {EVENT.title}
              </h2>
              {EVENT.subtitle && <p className="text-sm text-gray-600">{EVENT.subtitle}</p>}
              <div className="flex gap-2 mt-2 flex-wrap">
                {EVENT.when && (<Badge><Clock className="w-3 h-3" /> {EVENT.when}</Badge>)}
                {EVENT.where && (<Badge><MapPin className="w-3 h-3" /> {EVENT.where}</Badge>)}
                <Badge className="bg-emerald-100 text-emerald-700"><ShieldCheck className="w-3 h-3" /> 1 × per wallet</Badge>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-4">{EVENT.description}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your Wallet</h3>
            <Badge className={connected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'}>
              {connected ? 'Connected' : 'Not connected'}
            </Badge>
          </div>
          <div className="mt-3">
            <WalletMultiButton className="!rounded-xl !bg-black !text-white !px-4 !py-2" />
          </div>
          <ul className="text-sm text-gray-600 mt-4 list-disc pl-5 space-y-1">
            <li>Connect your wallet to start.</li>
            <li>Scan the event QR to prove attendance.</li>
            <li>Claim your POAP NFT, forever on-chain.</li>
          </ul>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <QrScan
          enabled={connected && step <= 2}
          onScanned={(payload) => { setQrPayload(payload); setStep(2) }}
        />
        <Verify
          qrPayload={qrPayload}
          wallet={publicKey?.toBase58()}
          onVerified={({ token, nonce, merkleProof }) => { setClaimToken(token); setNonce(nonce); setMerkleProof(merkleProof); setStep(3) }}
        />
      </div>

      <div className="mt-6">
        <Claim
          enabled={!!claimToken && step >= 3}
          claimToken={claimToken ?? ''}
          merkleProof={merkleProof}
          onMinted={(mint) => { setMintAddress(mint); setStep(4) }}
        />
        {mintAddress && (
          <div className="mt-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <CheckCircle className="w-5 h-5" /> Mint complete!{' '}
            <a className="underline" href={`https://explorer.solana.com/address/${mintAddress}?cluster=devnet`} target="_blank" rel="noreferrer">View on Explorer</a>
          </div>
        )}
      </div>
    </div>
  )
}
