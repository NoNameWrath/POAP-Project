'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BASE || ''

export function Verify({ qrPayload, wallet, onVerified }: {
  qrPayload: string | null
  wallet?: string
  onVerified: (out: { token: string; nonce: string; merkleProof?: string[] }) => void
}) {
  const [status, setStatus] = useState<'idle'|'verifying'|'ready'|'error'>('idle')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    async function run() {
      if (!qrPayload || !wallet) return
      try {
        setStatus('verifying'); setErr(null)
        const r = await fetch(`${API}/api/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr: qrPayload, wallet }),
        })
        if (!r.ok) throw new Error(`Exchange failed: ${r.status}`)
        const data = await r.json()
        onVerified({ token: data.claimToken, nonce: data.nonce, merkleProof: data.merkleProof })
        setStatus('ready')
      } catch (e: any) {
        setStatus('error'); setErr(e.message || 'Verification failed')
      }
    }
    run()
  }, [qrPayload, wallet])

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Verify Attendance</h3>
        <Badge>{status === 'ready' ? 'Ready' : status === 'verifying' ? 'Verifying' : 'Step 3'}</Badge>
      </div>
      <div className="mt-4 text-sm text-gray-700">
        {status === 'idle' && <p>Scan the QR to start verification.</p>}
        {status === 'verifying' && <p className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Verifying attendance…</p>}
        {status === 'ready' && <p className="text-emerald-700">Verified. You can claim now.</p>}
        {status === 'error' && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"><AlertTriangle className="w-4 h-4 inline mr-1"/> {err}</p>}
      </div>
    </Card>
  )
}
