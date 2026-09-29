<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import CoachChatPanel from '../components/CoachChatPanel.vue'
import { useEnglishCoachCopy } from '../composables/useEnglishCoachCopy'
import { isPracticeMode, type PracticeMode } from '../domain/coach'
import '../styles/myenglish.css'

const { tc: t } = useEnglishCoachCopy()
const route = useRoute()

const mode = computed<PracticeMode>(() =>
  isPracticeMode(route.query.mode) ? route.query.mode : 'behavioral',
)

const modes: PracticeMode[] = ['behavioral', 'technical', 'freeform']
</script>

<template>
  <div class="me-shell">
    <main class="me-practice">
      <header class="me-practice__top">
        <div>
          <RouterLink class="me-practice__back" :to="{ name: 'english-landing' }">
            <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            {{ t('englishCoach.backToLanding') }}
          </RouterLink>
          <h1 class="me-practice__brand">{{ t('englishCoach.brand') }}</h1>
        </div>

        <div class="me-practice__modes" role="tablist" aria-label="Practice modes">
          <RouterLink
            v-for="item in modes"
            :key="item"
            role="tab"
            class="me-practice__mode"
            :class="{ 'is-active': mode === item }"
            :aria-selected="mode === item"
            :to="{ name: 'english-practice', query: { mode: item } }"
          >
            {{ t(`englishCoach.modes.${item}`) }}
          </RouterLink>
        </div>
      </header>

      <CoachChatPanel :mode="mode" />
    </main>
  </div>
</template>

<style scoped>
.me-practice {
  max-width: 52rem;
  margin: 0 auto;
  padding: 1.1rem 1.1rem 2rem;
  display: grid;
  gap: 1.25rem;
  min-height: 100vh;
}

.me-practice__top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.me-practice__back {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--me-muted-fg);
  text-decoration: none;
  font-size: 0.88rem;
}

.me-practice__back:hover {
  color: var(--me-teal);
}

.me-practice__brand {
  margin: 0.35rem 0 0;
  font-family: var(--me-font-display);
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  letter-spacing: -0.03em;
  background: linear-gradient(120deg, #f4fbff, var(--me-teal));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.me-practice__modes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.me-practice__mode {
  text-decoration: none;
  color: var(--me-muted-fg);
  border: 1px solid color-mix(in srgb, var(--me-teal) 25%, transparent);
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.me-practice__mode.is-active,
.me-practice__mode:hover {
  color: #041018;
  background: var(--me-teal);
  border-color: var(--me-teal);
}
</style>
