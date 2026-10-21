import { randomUUID } from 'node:crypto'
import { FREE_ENTITLEMENTS } from '../config'
import {
  authenticate,
  creationsUsed,
  db,
  recordStudyCreation,
  type Study,
  type StudyRoutine,
  type StudyStatus,
  type WeekDay,
} from '../db'
import { STUDY_STATUSES, column, place } from '../board'
import { json, problem, readJson, unauthorized, validationFailed, type Handler } from '../http'

type RoutineInput = {
  frequency?: string
  daysOfWeek?: WeekDay[]
  time?: { hour?: number; minute?: number }
  pomodoro?: { enabled?: boolean; restMinutes?: number }
  notes?: string
}

function normalizeRoutine(input: RoutineInput | undefined): StudyRoutine | null {
  if (!input?.frequency?.trim()) return null
  const routine: StudyRoutine = {
    frequency: input.frequency.trim(),
    notes: input.notes?.trim() || undefined,
  }
  if (Array.isArray(input.daysOfWeek) && input.daysOfWeek.length > 0) {
    routine.daysOfWeek = input.daysOfWeek
  }
  if (input.time != null) {
    const hour = Number(input.time.hour)
    const minute = Number(input.time.minute)
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      routine.time = {
        hour: ((Math.trunc(hour) % 24) + 24) % 24,
        minute: ((Math.trunc(minute) % 60) + 60) % 60,
      }
    }
  }
  if (input.pomodoro?.enabled && routine.time) {
    const hasDuration =
      (routine.time.hour ?? 0) > 0 || (routine.time.minute ?? 0) > 0
    if (hasDuration) {
      const rest = Number(input.pomodoro.restMinutes ?? 5)
      routine.pomodoro = {
        enabled: true,
        restMinutes: Math.min(
          60,
          Math.max(1, Number.isFinite(rest) ? Math.trunc(rest) : 5),
        ),
      }
    }
  }
  return routine
}

/** API shape: ownership stays inside the mock. */
function toApi(study: Study) {
  const { ownerId: _ownerId, ...rest } = study
  return rest
}

function startedCount(ownerId: string) {
  return db.studies.filter((s) => s.ownerId === ownerId && s.status === 'STARTED').length
}

const activeLimitReached = () =>
  problem(403, 'STUDY_ACTIVE_LIMIT_REACHED', 'Active limit reached')

export const studyRoutes: Handler = async (req, path) => {
  if (path !== '/studies' && !path.startsWith('/studies/')) return null
  const user = authenticate(req)
  if (!user) return unauthorized()

  if (req.method === 'GET' && path === '/studies') {
    const items = db.studies
      .filter((s) => s.ownerId === user.id)
      .sort((a, b) => a.position - b.position)
      .map(toApi)
    return json({ items })
  }

  if (req.method === 'POST' && path === '/studies') {
    const body = await readJson<{
      title?: string
      objective?: string
      routine?: RoutineInput
      status?: StudyStatus
    }>(req)
    const routine = normalizeRoutine(body?.routine)
    if (!body?.title?.trim() || !body.objective?.trim() || !routine) {
      return validationFailed()
    }
    if (creationsUsed(user) >= FREE_ENTITLEMENTS.limits.maxStudyCreationsPerMonth) {
      return problem(403, 'STUDY_CREATE_LIMIT_REACHED', 'Create limit reached')
    }
    const nextStatus = body.status ?? 'CREATED'
    if (
      nextStatus === 'STARTED' &&
      startedCount(user.id) >= FREE_ENTITLEMENTS.limits.maxActiveStudies
    ) {
      return activeLimitReached()
    }
    const study: Study = {
      id: randomUUID(),
      ownerId: user.id,
      title: body.title.trim(),
      objective: body.objective.trim(),
      routine,
      status: nextStatus,
      createdAt: new Date().toISOString(),
      totalStudySeconds: 0,
      position: 0,
    }
    db.studies.unshift(study)
    // New studies go on top of their column (FEATURE-0005 §3).
    column(db.studies, user.id, nextStatus, study.id).forEach((s, i) => (s.position = i + 1))
    recordStudyCreation(user)
    return json(toApi(study), { status: 201 })
  }

  const studyMatch = path.match(/^\/studies\/([^/]+)$/)
  if (!studyMatch) return null
  const study = db.studies.find((s) => s.id === studyMatch[1] && s.ownerId === user.id)
  if (!study) return problem(404, 'STUDY_NOT_FOUND', 'Not found')

  if (req.method === 'GET') return json(toApi(study))

  if (req.method === 'PATCH') {
    const body = await readJson<{
      title?: string
      objective?: string
      routine?: RoutineInput
      status?: StudyStatus
      totalStudySeconds?: number
      position?: number
    }>(req)

    const hasTitle = body?.title !== undefined
    const hasObjective = body?.objective !== undefined
    const hasRoutine = body?.routine !== undefined
    const hasStatus = body?.status !== undefined
    const hasPosition = body?.position !== undefined
    const hasTotalStudy =
      body?.totalStudySeconds !== undefined && body.totalStudySeconds !== null
    if (!hasTitle && !hasObjective && !hasRoutine && !hasStatus && !hasTotalStudy && !hasPosition) {
      return validationFailed()
    }
    // Validate everything first so a rejected PATCH never changes data.
    if (hasPosition && (!Number.isInteger(body!.position) || body!.position! < 0)) {
      return validationFailed()
    }
    if (hasStatus && !STUDY_STATUSES.includes(body!.status!)) return validationFailed()
    if (hasTitle && !body!.title?.trim()) return validationFailed()
    if (hasObjective && !body!.objective?.trim()) return validationFailed()
    const routine = hasRoutine ? normalizeRoutine(body!.routine) : null
    if (hasRoutine && !routine) return validationFailed()
    const totalStudy = Number(body?.totalStudySeconds)
    if (hasTotalStudy && (!Number.isFinite(totalStudy) || totalStudy < 0)) return validationFailed()
    const nextStatus = body?.status ?? study.status
    const starting = nextStatus === 'STARTED' && study.status !== 'STARTED'
    if (starting && startedCount(user.id) >= FREE_ENTITLEMENTS.limits.maxActiveStudies) {
      return activeLimitReached()
    }

    if (hasTitle) study.title = body!.title!.trim()
    if (hasObjective) study.objective = body!.objective!.trim()
    if (routine) study.routine = routine
    // Status change without position → top of the new column (FEATURE-0005 §2).
    const moving = nextStatus !== study.status
    if (moving || (hasPosition && nextStatus !== 'ARCHIVED')) {
      place(db.studies, study, nextStatus, body?.position ?? (moving ? 0 : study.position))
    }
    if (hasTotalStudy) study.totalStudySeconds = Math.trunc(totalStudy)
    return json(toApi(study))
  }

  return null
}
