import { describe, expect, it } from 'vitest'
import { STUDY_STATUS_ORDER, type StudyStatus } from './study'
import {
  canDropStudyOnColumn,
  canMoveStudyStatus,
  isStudyDraggable,
} from './studyStatusTransitions'

const ALLOWED: Record<StudyStatus, StudyStatus[]> = {
  CREATED: ['STARTED', 'ARCHIVED'],
  STARTED: ['PAUSED', 'COMPLETED', 'ARCHIVED'],
  PAUSED: ['STARTED', 'ARCHIVED'],
  COMPLETED: [],
  ARCHIVED: [],
}

describe('canMoveStudyStatus', () => {
  for (const from of STUDY_STATUS_ORDER) {
    for (const to of STUDY_STATUS_ORDER) {
      const expected = ALLOWED[from].includes(to)
      it(`${from} → ${to} is ${expected ? 'allowed' : 'blocked'}`, () => {
        expect(canMoveStudyStatus(from, to)).toBe(expected)
      })
    }
  }
})

describe('canDropStudyOnColumn', () => {
  it('allows reordering inside the same column', () => {
    for (const status of STUDY_STATUS_ORDER) {
      expect(canDropStudyOnColumn(status, status)).toBe(true)
    }
  })

  it('follows status transitions across columns', () => {
    expect(canDropStudyOnColumn('CREATED', 'STARTED')).toBe(true)
    expect(canDropStudyOnColumn('CREATED', 'COMPLETED')).toBe(false)
    expect(canDropStudyOnColumn('COMPLETED', 'STARTED')).toBe(false)
  })
})

describe('isStudyDraggable', () => {
  it('locks only ARCHIVED cards', () => {
    expect(isStudyDraggable('ARCHIVED')).toBe(false)
    expect(isStudyDraggable('CREATED')).toBe(true)
    expect(isStudyDraggable('COMPLETED')).toBe(true)
  })
})
