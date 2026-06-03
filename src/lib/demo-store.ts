import crypto from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

export type PublicUser = {
  id: string
  username: string
  avatar: string
  bestScore: number
  createdAt: string
}

type UserRecord = PublicUser & {
  salt: string
  passwordHash: string
}

type SessionRecord = {
  token: string
  userId: string
  expiresAt: string
}

export type LeaderboardRow = {
  rank?: number
  username: string
  avatar: string
  score: number
  updatedAt: string
}

type DB = {
  users: UserRecord[]
  sessions: SessionRecord[]
  leaderboard: LeaderboardRow[]
}

const DB_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DB_DIR, 'demo-store.json')
const COOKIE_DAYS = 14

const AVATARS = ['🪄', '✨', '🌙', '🦊', '🐉', '🧿', '⚔️', '🔮', '🦅', '🐺']

const seedLeaderboard: LeaderboardRow[] = [
  {
    username: 'Arcana',
    avatar: '🪄',
    score: 4830,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    username: 'Mira',
    avatar: '🌙',
    score: 4210,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    username: 'RuneFox',
    avatar: '🦊',
    score: 3890,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    username: 'Vega',
    avatar: '✨',
    score: 3310,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    username: 'Astra',
    avatar: '🔮',
    score: 2970,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    username: 'Kite',
    avatar: '🦅',
    score: 2610,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
  },
  {
    username: 'Nova',
    avatar: '✨',
    score: 2240,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    username: 'Luna',
    avatar: '🌙',
    score: 1910,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
]

function normalizeUsername(username: string) {
  return username.trim().replace(/\s+/g, ' ').slice(0, 20)
}

function usernameKey(username: string) {
  return normalizeUsername(username).toLowerCase()
}

function hashPassword(password: string, salt: string) {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex')
}

function makePasswordRecord(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  return {
    salt,
    passwordHash: hashPassword(password, salt),
  }
}

function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    bestScore: user.bestScore,
    createdAt: user.createdAt,
  }
}

function emptyDb(): DB {
  return {
    users: [],
    sessions: [],
    leaderboard: [...seedLeaderboard],
  }
}

async function ensureDbFile() {
  await mkdir(DB_DIR, { recursive: true })
  try {
    await readFile(DB_FILE, 'utf8')
  } catch {
    await writeFile(DB_FILE, JSON.stringify(emptyDb(), null, 2), 'utf8')
  }
}

export async function loadDb(): Promise<DB> {
  await ensureDbFile()
  const raw = await readFile(DB_FILE, 'utf8')
  const parsed = JSON.parse(raw) as DB
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    leaderboard: Array.isArray(parsed.leaderboard)
      ? parsed.leaderboard
      : [...seedLeaderboard],
  }
}

export async function saveDb(db: DB) {
  await mkdir(DB_DIR, { recursive: true })
  await writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8')
}

function newSession(userId: string): SessionRecord {
  return {
    token: crypto.randomBytes(32).toString('hex'),
    userId,
    expiresAt: new Date(
      Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString(),
  }
}

async function createSessionForUser(userId: string) {
  const db = await loadDb()
  const session = newSession(userId)
  db.sessions = db.sessions.filter(
    (s) => new Date(s.expiresAt).getTime() > Date.now(),
  )
  db.sessions.push(session)
  await saveDb(db)
  return session.token
}

export async function getUserFromSession(
  token?: string | null,
): Promise<PublicUser | null> {
  if (!token) return null

  const db = await loadDb()
  const session = db.sessions.find(
    (s) => s.token === token && new Date(s.expiresAt).getTime() > Date.now(),
  )
  if (!session) return null

  const user = db.users.find((u) => u.id === session.userId)
  return user ? publicUser(user) : null
}

export async function revokeSession(token: string) {
  const db = await loadDb()
  db.sessions = db.sessions.filter((s) => s.token !== token)
  await saveDb(db)
}

async function createOrUpdateLeaderboardEntry(user: UserRecord, score: number) {
  const db = await loadDb()

  user.bestScore = Math.max(user.bestScore, score)

  const idx = db.leaderboard.findIndex(
    (row) => usernameKey(row.username) === usernameKey(user.username),
  )
  const next: LeaderboardRow = {
    username: user.username,
    avatar: user.avatar,
    score: Math.max(score, idx >= 0 ? db.leaderboard[idx].score : 0),
    updatedAt: new Date().toISOString(),
  }

  if (idx >= 0) db.leaderboard[idx] = next
  else db.leaderboard.push(next)

  db.leaderboard.sort(
    (a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt),
  )
  db.leaderboard = db.leaderboard.slice(0, 50)

  const userIdx = db.users.findIndex((u) => u.id === user.id)
  if (userIdx >= 0) db.users[userIdx] = user

  await saveDb(db)
  return { bestScore: user.bestScore }
}

export async function registerUser(usernameInput: string, password: string) {
  const username = normalizeUsername(usernameInput)
  if (username.length < 3 || username.length > 20) {
    throw new Error('USERNAME_INVALID')
  }
  if (password.length < 6) {
    throw new Error('PASSWORD_SHORT')
  }

  const db = await loadDb()
  const exists = db.users.some(
    (u) => usernameKey(u.username) === usernameKey(username),
  )
  if (exists) throw new Error('USERNAME_TAKEN')

  const { salt, passwordHash } = makePasswordRecord(password)
  const user: UserRecord = {
    id: crypto.randomUUID(),
    username,
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    bestScore: 0,
    createdAt: new Date().toISOString(),
    salt,
    passwordHash,
  }

  db.users.push(user)
  await saveDb(db)

  const token = await createSessionForUser(user.id)
  return { user: publicUser(user), token }
}

export async function loginUser(usernameInput: string, password: string) {
  const username = normalizeUsername(usernameInput)
  const db = await loadDb()

  const user = db.users.find(
    (u) => usernameKey(u.username) === usernameKey(username),
  )
  if (!user) throw new Error('INVALID_CREDENTIALS')

  const hash = hashPassword(password, user.salt)
  if (hash !== user.passwordHash) throw new Error('INVALID_CREDENTIALS')

  const token = await createSessionForUser(user.id)
  return { user: publicUser(user), token }
}

export async function recordScoreForUser(userId: string, score: number) {
  const db = await loadDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) throw new Error('USER_NOT_FOUND')

  return createOrUpdateLeaderboardEntry(user, score)
}

export async function getLeaderboard(limit = 10) {
  const db = await loadDb()
  const sorted = [...db.leaderboard]
    .sort((a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)

  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
  }))
}
