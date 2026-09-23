<script setup lang="ts">
withDefaults(
  defineProps<{
    sticky?: boolean;
    /** Full-bleed bar with bottom edge (legacy). Prefer floating on canvas layouts. */
    bordered?: boolean;
    /** Pill/panel floating over the page canvas (no section divider). */
    floating?: boolean;
    maxWidthClass?: string;
  }>(),
  {
    sticky: true,
    bordered: false,
    floating: true,
    maxWidthClass: "max-w-3xl",
  },
);
</script>

<template>
  <header
    :class="[
      sticky ? 'sticky top-0 z-40' : '',
      floating
        ? 'pointer-events-none px-4 pt-4 sm:px-6 sm:pt-5'
        : [
            'bg-surface/80 px-4 py-3.5 backdrop-blur-md sm:py-4',
            bordered ? 'border-b border-border' : '',
          ],
    ]"
  >
    <div
      class="pointer-events-auto mx-auto flex items-center justify-between gap-3 sm:gap-4"
      :class="[
        maxWidthClass,
        floating
          ? [
              'rounded-2xl border border-border/50 bg-surface/85 px-3.5 py-2.5',
              'shadow-card backdrop-blur-xl sm:rounded-[20px] sm:px-5 sm:py-3',
            ]
          : '',
      ]"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
        <div class="min-w-0 shrink truncate">
          <slot name="brand" />
        </div>
        <template v-if="$slots.meta">
          <span
            class="hidden h-5 w-px shrink-0 bg-border/70 sm:block"
            aria-hidden="true"
          />
          <div class="min-w-0 truncate text-sm text-muted">
            <slot name="meta" />
          </div>
        </template>
      </div>
      <div
        v-if="$slots.actions"
        class="flex shrink-0 items-center gap-3 sm:gap-5"
      >
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
