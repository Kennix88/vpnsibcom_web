import { getUserFromSession } from '@app/lib/demo-store'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('demo_session')?.value
  const user = await getUserFromSession(token)
  return NextResponse.json({ user })
}
