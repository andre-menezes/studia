<script setup lang="ts">
import { computed } from "vue";
import {
  toneOutlinedClasses,
  toneTonalClasses,
  type AppTone,
} from "./tones";

export type AppBadgeSize = "sm" | "md";
export type AppBadgeVariant = "tonal" | "outlined";

const props = withDefaults(
  defineProps<{
    tone?: AppTone;
    size?: AppBadgeSize;
    variant?: AppBadgeVariant;
    uppercase?: boolean;
    icon?: string;
  }>(),
  {
    tone: "muted",
    size: "sm",
    variant: "tonal",
    uppercase: true,
  },
);

const sizeClass = computed(() =>
  props.size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
);

const toneClass = computed(() =>
  props.variant === "outlined"
    ? toneOutlinedClasses(props.tone)
    : toneTonalClasses(props.tone),
);

const shapeClass = computed(() =>
  props.variant === "outlined" ? "rounded-full" : "rounded-md",
);
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-1 font-medium tracking-wide"
    :class="[toneClass, sizeClass, shapeClass, uppercase ? 'uppercase' : '']"
  >
    <span
      v-if="icon"
      class="material-symbols-outlined text-[14px] leading-none"
      aria-hidden="true"
    >
      {{ icon }}
    </span>
    <slot />
  </span>
</template>
