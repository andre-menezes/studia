import { randomUUID } from 'node:crypto'
import { db, type Study, type StudySession } from '../db'
import { json, readJson, validationFailed } from '../http'

/** Clock skew between the client's timer and its wall-clock bounds (ADR-0010 §4). */
const TOLERANCE_SECONDS = 5
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function parseInstant(value: unknown) {
  if (typeof value !== 'string') return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

/** `/studies/{id}/sessions` for a study the caller already owns. */
export async function sessionRoutes(req: Request, study: Study): Promise<Response | null> {
  if (req.method === 'GET') {
    const limit = Number(new URL(req.url).searchParams.get('limit') ?? DEFAULT_LIMIT)
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return validationFailed()
    const items = db.studySessions
      .filter((s) => s.studyId === study.id)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit)
    return json({ items })
  }

  if (req.method === 'POST') {
    const body = await readJson<{
      clientSessionId?: string
      startedAt?: string
      endedAt?: string
      studySeconds?: number
    }>(req)
    const clientSessionId = body?.clientSessionId?.trim()
    if (!clientSessionId) return validationFailed()
    // Idempotent retry: the block was already saved, so do not count it again.
    const existing = db.studySessions.find(
      (s) => s.studyId === study.id && s.clientSessionId === clientSessionId,
    )
    if (existing) return json(existing)

    const startedAt = parseInstant(body?.startedAt)
    const endedAt = parseInstant(body?.endedAt)
    const studySeconds = body?.studySeconds
    if (startedAt === null || endedAt === null || endedAt < startedAt) return validationFailed()
    if (typeof studySeconds !== 'number' || !Number.isInteger(studySeconds) || studySeconds <= 0) {
      return validationFailed()
    }
    if (studySeconds > (endedAt - startedAt) / 1000 + TOLERANCE_SECONDS) return validationFailed()

    const session: StudySession = {
      id: randomUUID(),
      clientSessionId,
      studyId: study.id,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      studySeconds,
      createdAt: new Date().toISOString(),
    }
    db.studySessions.push(session)
    study.totalStudySeconds += studySeconds
    return json(session, { status: 201 })
  }

  return null
}
