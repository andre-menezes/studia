<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useEnglishCoachCopy } from '../composables/useEnglishCoachCopy'
import '../styles/myenglish.css'

const { tc: t } = useEnglishCoachCopy()
</script>

<template>
  <div class="me-shell">
    <main class="me-landing">
      <section class="me-hero" aria-labelledby="me-hero-title">
        <div class="me-hero__bleed" role="img" :aria-label="t('englishCoach.visualAlt')">
          <div class="me-hero__mesh" aria-hidden="true" />
          <div class="me-hero__grid" aria-hidden="true" />
          <div class="me-hero__orbit" aria-hidden="true" />
        </div>

        <div class="me-hero__content">
          <p class="me-brand">{{ t('englishCoach.brand') }}</p>
          <h1 id="me-hero-title" class="me-hero__title">
            {{ t('englishCoach.heroHeadline') }}
          </h1>
          <p class="me-hero__support">{{ t('englishCoach.heroSupport') }}</p>
          <div class="me-hero__cta">
            <RouterLink
              class="me-btn me-btn--primary"
              :to="{ name: 'english-practice', query: { mode: 'behavioral' } }"
            >
              {{ t('englishCoach.ctaStart') }}
            </RouterLink>
            <RouterLink
              class="me-btn me-btn--ghost"
              :to="{ name: 'english-practice', query: { mode: 'technical' } }"
            >
              {{ t('englishCoach.ctaTechnical') }}
            </RouterLink>
          </div>
        </div>
      </section>

      <nav class="me-modes" aria-label="Practice modes">
        <p class="me-modes__lead">{{ t('englishCoach.tagline') }}</p>
        <div class="me-modes__links">
          <RouterLink
            class="me-mode"
            :to="{ name: 'english-practice', query: { mode: 'behavioral' } }"
          >
            <span class="material-symbols-outlined" aria-hidden="true">forum</span>
            {{ t('englishCoach.ctaBehavioral') }}
          </RouterLink>
          <RouterLink
            class="me-mode"
            :to="{ name: 'english-practice', query: { mode: 'technical' } }"
          >
            <span class="material-symbols-outlined" aria-hidden="true">memory</span>
            {{ t('englishCoach.ctaTechnical') }}
          </RouterLink>
          <RouterLink
            class="me-mode"
            :to="{ name: 'english-practice', query: { mode: 'freeform' } }"
          >
            <span class="material-symbols-outlined" aria-hidden="true">chat</span>
            {{ t('englishCoach.ctaFreeform') }}
          </RouterLink>
        </div>
      </nav>
    </main>
  </div>
</template>

<style scoped>
.me-landing {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.me-hero {
  position: relative;
  min-height: 100svh;
  display: grid;
  align-items: end;
  overflow: hidden;
}

.me-hero__bleed {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.me-hero__mesh {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 90% 70% at 78% 28%, rgba(61, 224, 197, 0.28), transparent 55%),
    radial-gradient(ellipse 70% 55% at 18% 75%, rgba(228, 191, 112, 0.16), transparent 50%),
    radial-gradient(ellipse 55% 45% at 55% 55%, rgba(70, 120, 255, 0.18), transparent 60%),
    linear-gradient(180deg, rgba(5, 11, 22, 0.15) 0%, rgba(5, 11, 22, 0.72) 62%, #050b16 100%);
  animation: me-glow-pulse 7s ease-in-out infinite alternate;
}

.me-hero__grid {
  position: absolute;
  inset: 0;
  opacity: 0.22;
  background-image:
    linear-gradient(rgba(158, 201, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(158, 201, 255, 0.12) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 60% at 70% 35%, #000 20%, transparent 75%);
}

.me-hero__orbit {
  position: absolute;
  width: min(58vw, 34rem);
  height: min(58vw, 34rem);
  right: -6%;
  top: 8%;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--me-teal) 35%, transparent);
  box-shadow:
    inset 0 0 80px rgba(61, 224, 197, 0.08),
    0 0 60px rgba(61, 224, 197, 0.08);
  animation: me-orbit 18s linear infinite;
}

.me-hero__orbit::after {
  content: "";
  position: absolute;
  width: 70%;
  height: 70%;
  inset: 15%;
  border-radius: 50%;
  border: 1px dashed color-mix(in srgb, var(--me-gold) 40%, transparent);
}

.me-hero__content {
  position: relative;
  z-index: 1;
  max-width: 44rem;
  padding: clamp(1.5rem, 5vw, 4rem);
  padding-bottom: clamp(2rem, 6vw, 4.5rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: me-copy-in 800ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.me-brand {
  margin: 0;
  font-family: var(--me-font-display);
  font-size: clamp(2.4rem, 7vw, 4.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.95;
  background: linear-gradient(120deg, #f7fbff 10%, var(--me-teal) 62%, var(--me-gold));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: me-brand-in 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.me-hero__title {
  margin: 0;
  font-family: var(--me-font-display);
  font-size: clamp(1.55rem, 3.6vw, 2.35rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--me-fg);
}

.me-hero__support {
  margin: 0;
  max-width: 34rem;
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--me-muted-fg);
}

.me-hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.4rem;
}

.me-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.25rem;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  transition:
    transform 180ms ease,
    background 180ms ease,
    border-color 180ms ease;
}

.me-btn:hover {
  transform: translateY(-1px);
}

.me-btn--primary {
  color: #041018;
  background: linear-gradient(135deg, var(--me-teal), #8af0dd);
}

.me-btn--ghost {
  color: var(--me-fg);
  border: 1px solid color-mix(in srgb, var(--me-teal) 40%, transparent);
  background: color-mix(in srgb, var(--me-ink-elevated) 55%, transparent);
}

.me-modes {
  padding: 2rem clamp(1.25rem, 5vw, 4rem) 3rem;
  border-top: 1px solid color-mix(in srgb, var(--me-teal) 22%, transparent);
}

.me-modes__lead {
  margin: 0 0 1rem;
  color: var(--me-muted-fg);
  max-width: 36rem;
}

.me-modes__links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.me-mode {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.95rem 0;
  text-decoration: none;
  color: var(--me-fg);
  border-top: 1px solid color-mix(in srgb, var(--me-teal) 35%, transparent);
  font-weight: 600;
  transition:
    color 160ms ease,
    border-color 160ms ease;
}

.me-mode:hover {
  color: var(--me-teal);
  border-color: var(--me-teal);
}

@keyframes me-brand-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes me-copy-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes me-glow-pulse {
  from {
    transform: scale(1);
    opacity: 0.9;
  }
  to {
    transform: scale(1.03);
    opacity: 1;
  }
}

@keyframes me-orbit {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .me-modes__links {
    grid-template-columns: 1fr;
  }

  .me-hero__orbit {
    width: 70vw;
    height: 70vw;
    top: 0;
    right: -20%;
    opacity: 0.7;
  }
}

@media (prefers-reduced-motion: reduce) {
  .me-brand,
  .me-hero__content,
  .me-hero__mesh,
  .me-hero__orbit,
  .me-btn {
    animation: none;
    transition: none;
  }
}
</style>
