import {
  getLeaderboard,
  getUserFromSession,
  recordScoreForUser,
} from '@app/lib/demo-store'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const limitRaw = Number(url.searchParams.get('limit') ?? 10)
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 10

  const leaderboard = await getLeaderboard(limit)
  return NextResponse.json({ leaderboard })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('demo_session')?.value
  const user = await getUserFromSession(token)

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as { score?: unknown }
  const score = Number(body.score)

  if (!Number.isFinite(score) || score < 0) {
    return NextResponse.json({ error: 'BAD_SCORE' }, { status: 400 })
  }

  const result = await recordScoreForUser(user.id, Math.floor(score))
  const leaderboard = await getLeaderboard(10)

  return NextResponse.json({
    ok: true,
    bestScore: result.bestScore,
    leaderboard,
  })
}
