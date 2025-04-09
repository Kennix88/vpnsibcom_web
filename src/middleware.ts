import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isTma = pathname.startsWith('/tma')
  const isWebApp = pathname.startsWith('/app')
  const isPublic = ['/'].some((route) => pathname.startsWith(route))

  if (isPublic) return NextResponse.next()

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/tma/:path*',
    '/app/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
