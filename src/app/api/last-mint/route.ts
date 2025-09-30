import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({ wallet: z.string().min(32) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wallet } = schema.parse(body)

    // TODO: query your indexer / RPC to find the newest mint by this wallet for this event.
    // For now, return empty. Frontend will still show success via UI state.
    return NextResponse.json({ mint: null })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad Request' }, { status: 400 })
  }
}
