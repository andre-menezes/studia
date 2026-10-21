import { randomUUID } from 'node:crypto'
import { FREE_ENTITLEMENTS } from '../config'
import { authenticate, db, type Study, type StudyRoutine, type StudyStatus, type WeekDay } from '../db'
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
    const items = db.studies.filter((s) => s.ownerId === user.id).map(toApi)
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
    const used = db.studyCreationsUsed.get(user.id) ?? 0
    if (used >= FREE_ENTITLEMENTS.limits.maxStudyCreationsPerMonth) {
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
    }
    db.studies.unshift(study)
    db.studyCreationsUsed.set(user.id, used + 1)
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
    }>(req)

    const hasTitle = body?.title !== undefined
    const hasObjective = body?.objective !== undefined
    const hasRoutine = body?.routine !== undefined
    const hasStatus = body?.status !== undefined
    const hasTotalStudy =
      body?.totalStudySeconds !== undefined && body.totalStudySeconds !== null
    if (!hasTitle && !hasObjective && !hasRoutine && !hasStatus && !hasTotalStudy) {
      return validationFailed()
    }

    if (hasTitle) {
      if (!body!.title?.trim()) return validationFailed()
      study.title = body!.title.trim()
    }
    if (hasObjective) {
      if (!body!.objective?.trim()) return validationFailed()
      study.objective = body!.objective.trim()
    }
    if (hasRoutine) {
      const routine = normalizeRoutine(body!.routine)
      if (!routine) return validationFailed()
      study.routine = routine
    }
    if (hasStatus) {
      const nextStatus = body!.status!
      const starting = nextStatus === 'STARTED' && study.status !== 'STARTED'
      if (starting && startedCount(user.id) >= FREE_ENTITLEMENTS.limits.maxActiveStudies) {
        return activeLimitReached()
      }
      study.status = nextStatus
    }
    if (hasTotalStudy) {
      const value = Number(body!.totalStudySeconds)
      if (!Number.isFinite(value) || value < 0) return validationFailed()
      study.totalStudySeconds = Math.trunc(value)
    }
    return json(toApi(study))
  }

  return null
}
