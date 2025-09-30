import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { signClaim } from '@/server/jwt'
import { getMerkleProofForWallet } from '@/server/merkle'

const schema = z.object({ qr: z.string().min(1), wallet: z.string().min(32) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { qr, wallet } = schema.parse(body)

    // TODO: validate `qr` against your rotating QR issuer (time-bound, HMAC, etc.)
    // Minimal: derive an eventId from QR or default to 'default-event'
    const eventId = 'default-event'
    const nonce = crypto.randomUUID()

    const claimToken = signClaim({ nonce, wallet, eventId })
    const merkleProof = await getMerkleProofForWallet(eventId, wallet)

    return NextResponse.json({ nonce, claimToken, merkleProof })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad Request' }, { status: 400 })
  }
}
