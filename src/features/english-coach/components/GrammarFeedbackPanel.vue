<script setup lang="ts">
defineProps<{
  original: string
  correction: string
  nativeAlternative: string
  title: string
  originalLabel: string
  correctionLabel: string
  nativeLabel: string
}>()
</script>

<template>
  <aside class="me-feedback" aria-label="English improvement feedback">
    <p class="me-feedback__title">📝 {{ title }}</p>
    <dl class="me-feedback__list">
      <div>
        <dt>{{ originalLabel }}</dt>
        <dd>“{{ original }}”</dd>
      </div>
      <div>
        <dt>{{ correctionLabel }}</dt>
        <dd>“{{ correction }}”</dd>
      </div>
      <div>
        <dt>{{ nativeLabel }}</dt>
        <dd>“{{ nativeAlternative }}”</dd>
      </div>
    </dl>
  </aside>
</template>

<style scoped>
.me-feedback {
  margin-top: 0.85rem;
  padding: 0.9rem 1rem;
  border-radius: 0.85rem;
  border: 1px solid color-mix(in srgb, var(--me-gold) 35%, transparent);
  background: color-mix(in srgb, var(--me-ink-elevated) 88%, var(--me-gold) 12%);
}

.me-feedback__title {
  margin: 0 0 0.65rem;
  font-family: var(--me-font-display);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--me-gold);
}

.me-feedback__list {
  margin: 0;
  display: grid;
  gap: 0.55rem;
}

.me-feedback__list dt {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--me-muted);
}

.me-feedback__list dd {
  margin: 0.15rem 0 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--me-fg);
}
</style>
