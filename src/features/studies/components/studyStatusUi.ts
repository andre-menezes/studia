import type { AppButtonColor, AppTone } from '@/shared/ui'
import type { StudyStatus } from '../domain/study'

export function studyStatusTone(status: StudyStatus): AppTone {
  switch (status) {
    case 'CREATED':
      return 'info'
    case 'STARTED':
      return 'primary'
    case 'PAUSED':
      return 'secondary'
    case 'COMPLETED':
      return 'success'
    case 'ARCHIVED':
      return 'muted'
    default:
      return 'muted'
  }
}

export function studyStatusIcon(status: StudyStatus): string {
  switch (status) {
    case 'CREATED':
      return 'fiber_new'
    case 'STARTED':
      return 'play_circle'
    case 'PAUSED':
      return 'pause_circle'
    case 'COMPLETED':
      return 'task_alt'
    case 'ARCHIVED':
      return 'inventory_2'
    default:
      return 'label'
  }
}

export function studyStatusButtonColor(status: StudyStatus): AppButtonColor {
  switch (status) {
    case 'CREATED':
      return 'info'
    case 'STARTED':
      return 'primary'
    case 'PAUSED':
      return 'secondary'
    case 'COMPLETED':
      return 'success'
    case 'ARCHIVED':
      return 'muted'
    default:
      return 'muted'
  }
}
