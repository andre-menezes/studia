<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    icon?: string;
    bordered?: boolean;
    headingLevel?: "h2" | "h3";
  }>(),
  {
    icon: "menu_book",
    bordered: true,
    headingLevel: "h2",
  },
);
</script>

<template>
  <div
    class="flex flex-col items-center gap-4 px-6 py-16 text-center sm:py-20"
    :class="
      bordered
        ? 'rounded-[24px] bg-surface/90 shadow-card backdrop-blur-sm'
        : ''
    "
  >
    <div
      class="flex size-14 items-center justify-center rounded-2xl bg-accent-variant text-accent"
      aria-hidden="true"
    >
      <span class="material-symbols-outlined text-[32px] leading-none">
        {{ icon }}
      </span>
    </div>

    <component
      :is="headingLevel"
      v-if="title"
      class="text-lg font-semibold text-foreground"
    >
      {{ title }}
    </component>

    <div
      v-if="$slots.default || description"
      class="max-w-md text-base text-muted"
    >
      <slot>
        <p>{{ description }}</p>
      </slot>
    </div>

    <div v-if="$slots.actions" class="mt-2 flex flex-wrap justify-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
