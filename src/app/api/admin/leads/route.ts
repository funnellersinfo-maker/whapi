import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const ADMIN_KEY = process.env.ADMIN_KEY ?? 'WHAPI2027'

function isAuthorized(request: Request): boolean {
  return request.headers.get('x-admin-key') === ADMIN_KEY
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
}

function parseLimit(raw: string | null): number {
  if (raw === null) return 500
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed)) return 500
  return Math.min(1000, Math.max(1, parsed))
}

function parseQuiz(raw: string | null): unknown {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

interface RawLeadRow {
  id: string
  status: string
  name: string | null
  whatsapp: string | null
  email: string | null
  country: string | null
  sessionDate: string | null
  sessionTime: string | null
  waMessage: string | null
  quiz: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized()
  }
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseLimit(searchParams.get('limit'))

    // Raw SQL (instead of db.lead.findMany) so the recently added `country`
    // column is always selected, even if the dev-server process still holds a
    // Prisma client generated before that column existed.
    const rows = await db.$queryRaw<RawLeadRow[]>`
      SELECT id, status, name, whatsapp, email, country, sessionDate,
             sessionTime, waMessage, quiz, createdAt, updatedAt
      FROM Lead
      ORDER BY createdAt DESC
      LIMIT ${limit}
    `

    return NextResponse.json({
      ok: true,
      leads: rows.map((lead) => ({
        id: lead.id,
        status: lead.status,
        name: lead.name,
        whatsapp: lead.whatsapp,
        email: lead.email,
        country: lead.country,
        sessionDate: lead.sessionDate,
        sessionTime: lead.sessionTime,
        waMessage: lead.waMessage,
        quiz: parseQuiz(lead.quiz),
        createdAt: new Date(lead.createdAt).toISOString(),
        updatedAt: new Date(lead.updatedAt).toISOString(),
      })),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized()
  }
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || !id.trim()) {
      return NextResponse.json({ ok: false, error: 'invalid_id' }, { status: 400 })
    }

    await db.lead.delete({ where: { id: id.trim() } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
