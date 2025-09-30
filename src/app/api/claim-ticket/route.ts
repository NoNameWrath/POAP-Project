import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyClaim } from '@/server/jwt'

const schema = z.object({ claimToken: z.string().min(10), wallet: z.string().min(32) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { claimToken, wallet } = schema.parse(body)
    const payload = verifyClaim(claimToken)
    if (payload.wallet !== wallet) throw new Error('Wallet mismatch')

    // TODO: attach nonce consumption in KV/DB if you want strict single-use.
    // With short JWT exp, replay exposure is small but not zero.

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 })
  }
}
