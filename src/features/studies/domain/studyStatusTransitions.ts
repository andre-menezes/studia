import type { StudyStatus } from './study'

/** ARCHIVED cards are fixed; all other statuses can drag (cross-column or reorder). */
export function isStudyDraggable(status: StudyStatus): boolean {
  return status !== 'ARCHIVED'
}

/**
 * Allowed status transitions for the home Kanban board.
 * COMPLETED and ARCHIVED cannot leave their column.
 */
export function canMoveStudyStatus(
  from: StudyStatus,
  to: StudyStatus,
): boolean {
  if (from === to) return false
  switch (from) {
    case 'CREATED':
      return to === 'STARTED' || to === 'ARCHIVED'
    case 'STARTED':
      return to === 'PAUSED' || to === 'COMPLETED' || to === 'ARCHIVED'
    case 'PAUSED':
      return to === 'STARTED' || to === 'ARCHIVED'
    default:
      return false
  }
}

/** Drop allowed when reordering in the same column or moving to an allowed status. */
export function canDropStudyOnColumn(
  from: StudyStatus,
  to: StudyStatus,
): boolean {
  return from === to || canMoveStudyStatus(from, to)
}
