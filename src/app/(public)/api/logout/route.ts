import { revokeSession } from '@app/lib/demo-store'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('demo_session')?.value
  if (token) {
    await revokeSession(token)
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: 'demo_session',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return res
}
