import { computed } from 'vue'
import { useAuthStore } from '@/features/auth/stores/authStore'

export function can(capability: string) {
  return useAuthStore().can(capability)
}

export const limits = {
  canCreateStudy() {
    return useAuthStore().canCreateStudy()
  },
  canActivateStudy(activeCount: number) {
    return useAuthStore().canActivateStudy(activeCount)
  },
}

export function useUsage() {
  const auth = useAuthStore()
  return computed(() => auth.usage)
}
