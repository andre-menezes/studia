import { useI18n } from 'vue-i18n'

/** MyEnglish product surface is English-first (coach + chrome). */
export function useEnglishCoachCopy() {
  const { t } = useI18n({ useScope: 'global' })

  function tc(key: string): string {
    return t(key, {}, { locale: 'en' })
  }

  return { tc }
}
