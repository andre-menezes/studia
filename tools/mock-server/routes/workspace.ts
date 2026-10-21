import { randomUUID } from 'node:crypto'
import { db, type Note, type Study, type Task } from '../db'
import { json, noContent, problem, readJson, validationFailed } from '../http'

/** Technical ceilings, not plan limits (FEATURE-0003). */
const MAX_TASKS = 200
const MAX_NOTES = 100
const TITLE_MAX = 200
const CONTENT_MAX = 10_000

const readOnly = () => problem(409, 'STUDY_READ_ONLY', 'Study is archived')

function tasksOf(studyId: string) {
  return db.tasks.filter((t) => t.studyId === studyId).sort((a, b) => a.position - b.position)
}

/** Moves `task` to `index` and rewrites every position as 0..n-1. */
function reorder(studyId: string, task: Task, index: number) {
  const others = tasksOf(studyId).filter((t) => t.id !== task.id)
  const target = Math.min(Math.max(0, index), others.length)
  others.splice(target, 0, task)
  others.forEach((t, i) => (t.position = i))
}

function cleanTitle(value: unknown) {
  if (typeof value !== 'string') return null
  const title = value.trim()
  return title && title.length <= TITLE_MAX ? title : null
}

function cleanContent(value: unknown) {
  if (typeof value !== 'string') return null
  return value.trim() && value.length <= CONTENT_MAX ? value : null
}

async function taskRoutes(req: Request, study: Study, taskId: string | undefined) {
  if (!taskId) {
    if (req.method === 'GET') return json({ items: tasksOf(study.id) })
    if (req.method !== 'POST') return null
    if (study.status === 'ARCHIVED') return readOnly()
    const title = cleanTitle((await readJson<{ title?: unknown }>(req))?.title)
    if (!title) return validationFailed()
    const count = tasksOf(study.id).length
    if (count >= MAX_TASKS) return problem(422, 'TASK_LIMIT_REACHED', 'Task limit reached')
    const task: Task = {
      id: randomUUID(),
      studyId: study.id,
      title,
      done: false,
      position: count,
      createdAt: new Date().toISOString(),
    }
    db.tasks.push(task)
    return json(task, { status: 201 })
  }

  const task = db.tasks.find((t) => t.id === taskId && t.studyId === study.id)
  if (!task) return problem(404, 'TASK_NOT_FOUND', 'Not found')
  if (req.method !== 'PATCH' && req.method !== 'DELETE') return null
  if (study.status === 'ARCHIVED') return readOnly()

  if (req.method === 'DELETE') {
    db.tasks.splice(db.tasks.indexOf(task), 1)
    tasksOf(study.id).forEach((t, i) => (t.position = i))
    return noContent()
  }

  const body = await readJson<{ title?: unknown; done?: unknown; position?: unknown }>(req)
  if (!body || (body.title === undefined && body.done === undefined && body.position === undefined)) {
    return validationFailed()
  }
  const title = body.title === undefined ? undefined : cleanTitle(body.title)
  if (title === null) return validationFailed()
  if (body.done !== undefined && typeof body.done !== 'boolean') return validationFailed()
  if (body.position !== undefined && (!Number.isInteger(body.position) || (body.position as number) < 0)) {
    return validationFailed()
  }

  if (title !== undefined) task.title = title
  if (typeof body.done === 'boolean' && body.done !== task.done) {
    task.done = body.done
    task.completedAt = body.done ? new Date().toISOString() : undefined
  }
  if (body.position !== undefined) reorder(study.id, task, body.position as number)
  return json(task)
}

async function noteRoutes(req: Request, study: Study, noteId: string | undefined) {
  if (!noteId) {
    if (req.method === 'GET') {
      const items = db.notes
        .filter((n) => n.studyId === study.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return json({ items })
    }
    if (req.method !== 'POST') return null
    if (study.status === 'ARCHIVED') return readOnly()
    const content = cleanContent((await readJson<{ content?: unknown }>(req))?.content)
    if (!content) return validationFailed()
    if (db.notes.filter((n) => n.studyId === study.id).length >= MAX_NOTES) {
      return problem(422, 'NOTE_LIMIT_REACHED', 'Note limit reached')
    }
    const now = new Date().toISOString()
    const note: Note = { id: randomUUID(), studyId: study.id, content, createdAt: now, updatedAt: now }
    db.notes.push(note)
    return json(note, { status: 201 })
  }

  const note = db.notes.find((n) => n.id === noteId && n.studyId === study.id)
  if (!note) return problem(404, 'NOTE_NOT_FOUND', 'Not found')
  if (req.method !== 'PATCH' && req.method !== 'DELETE') return null
  if (study.status === 'ARCHIVED') return readOnly()

  if (req.method === 'DELETE') {
    db.notes.splice(db.notes.indexOf(note), 1)
    return noContent()
  }
  const content = cleanContent((await readJson<{ content?: unknown }>(req))?.content)
  if (!content) return validationFailed()
  note.content = content
  note.updatedAt = new Date().toISOString()
  return json(note)
}

/** `/studies/{id}/tasks[/{taskId}]` and `/notes[/{noteId}]` for a study the caller owns. */
export function workspaceRoutes(
  req: Request,
  study: Study,
  kind: 'tasks' | 'notes',
  itemId: string | undefined,
): Promise<Response | null> {
  return kind === 'tasks' ? taskRoutes(req, study, itemId) : noteRoutes(req, study, itemId)
}
