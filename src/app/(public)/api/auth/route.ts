import { loginUser, registerUser } from '@app/lib/demo-store'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function authCookie(token: string) {
  return {
    name: 'demo_session',
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      mode?: 'login' | 'register'
      username?: string
      password?: string
    }

    const mode = body.mode
    const username = String(body.username ?? '').trim()
    const password = String(body.password ?? '')

    if (mode !== 'login' && mode !== 'register') {
      return NextResponse.json({ error: 'BAD_MODE' }, { status: 400 })
    }

    const result =
      mode === 'login'
        ? await loginUser(username, password)
        : await registerUser(username, password)

    const res = NextResponse.json({ user: result.user })
    res.cookies.set(authCookie(result.token))
    return res
  } catch (err) {
    const code = err instanceof Error ? err.message : 'UNKNOWN_ERROR'

    const message =
      code === 'USERNAME_INVALID'
        ? 'Никнейм должен быть от 3 до 20 символов'
        : code === 'PASSWORD_SHORT'
          ? 'Пароль должен быть не короче 6 символов'
          : code === 'USERNAME_TAKEN'
            ? 'Такой ник уже занят'
            : code === 'INVALID_CREDENTIALS'
              ? 'Неверный логин или пароль'
              : 'Не удалось выполнить вход'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
