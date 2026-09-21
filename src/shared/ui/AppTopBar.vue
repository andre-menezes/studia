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
            'bg-surface/80 px-4 py-3.5 backdrop-blur-sm sm:py-4',
            bordered ? 'border-b border-border' : '',
          ],
    ]"
  >
    <div
      class="pointer-events-auto mx-auto flex items-center justify-between gap-4"
      :class="[
        maxWidthClass,
        floating
          ? 'rounded-[20px] bg-surface/90 px-4 py-3.5 shadow-card backdrop-blur-md sm:px-5 sm:py-4'
          : '',
      ]"
    >
      <div class="flex min-w-0 items-center gap-3">
        <div class="min-w-0">
          <div class="truncate">
            <slot name="brand" />
          </div>
          <div v-if="$slots.meta" class="truncate text-xs text-muted">
            <slot name="meta" />
          </div>
        </div>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
