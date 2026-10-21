import { describe, expect, it } from 'vitest'
import { column, place } from './board'
import type { Study, StudyStatus } from './db'

function study(id: string, status: StudyStatus, position: number, ownerId = 'u1'): Study {
  return {
    id,
    ownerId,
    title: id,
    objective: 'x',
    routine: { frequency: 'Mon' },
    status,
    createdAt: '',
    totalStudySeconds: 0,
    position,
  }
}

function board() {
  return [
    study('a', 'CREATED', 0),
    study('b', 'CREATED', 1),
    study('c', 'CREATED', 2),
    study('s', 'STARTED', 0),
    study('z', 'ARCHIVED', 0),
    study('other', 'CREATED', 0, 'u2'),
  ]
}

const ids = (studies: Study[], status: StudyStatus) =>
  column(studies, 'u1', status).map((s) => [s.id, s.position])

describe('board place (FEATURE-0005)', () => {
  it('reorders inside a column keeping it dense', () => {
    const studies = board()
    place(studies, studies[2], 'CREATED', 0)
    expect(ids(studies, 'CREATED')).toEqual([['c', 0], ['a', 1], ['b', 2]])
  })

  it('moves between columns and reindexes both', () => {
    const studies = board()
    place(studies, studies[0], 'STARTED', 1)
    expect(ids(studies, 'CREATED')).toEqual([['b', 0], ['c', 1]])
    expect(ids(studies, 'STARTED')).toEqual([['s', 0], ['a', 1]])
  })

  it('clamps an index past the end', () => {
    const studies = board()
    place(studies, studies[0], 'STARTED', 99)
    expect(ids(studies, 'STARTED')).toEqual([['s', 0], ['a', 1]])
  })

  it('puts archived studies on top whatever the index', () => {
    const studies = board()
    place(studies, studies[1], 'ARCHIVED', 5)
    expect(ids(studies, 'ARCHIVED')).toEqual([['b', 0], ['z', 1]])
  })

  it("never touches another owner's column", () => {
    const studies = board()
    place(studies, studies[2], 'CREATED', 0)
    expect(column(studies, 'u2', 'CREATED').map((s) => s.position)).toEqual([0])
  })
})
