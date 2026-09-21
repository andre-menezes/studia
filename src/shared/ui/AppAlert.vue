<script setup lang="ts">
import { computed } from "vue";
import AppButton from "./AppButton.vue";
import {
  toneOutlinedClasses,
  type AppTone,
} from "./tones";

/** Semantic alert kinds — `alert` is an alias of `warning`. */
export type AppAlertType =
  | "success"
  | "warning"
  | "alert"
  | "error"
  | "info"
  | "accent";

export type AppAlertTone = Extract<
  AppTone,
  "error" | "success" | "warning" | "info" | "accent"
>;
export type AppAlertVariant = "tonal" | "outlined";

const props = withDefaults(
  defineProps<{
    /** Preferred API — maps to tone (`alert` → `warning`). */
    type?: AppAlertType;
    /** @deprecated Prefer `type`. Kept for call-site compatibility. */
    tone?: AppAlertTone;
    variant?: AppAlertVariant;
    icon?: string;
    dismissible?: boolean;
    dismissLabel?: string;
    title?: string;
  }>(),
  {
    variant: "tonal",
    dismissible: false,
  },
);

const emit = defineEmits<{
  dismiss: [];
}>();

const resolvedTone = computed<AppAlertTone>(() => {
  const raw = props.type ?? props.tone ?? "info";
  if (raw === "alert") return "warning";
  return raw;
});

const defaultIcon = computed(() => {
  if (props.icon) return props.icon;
  switch (resolvedTone.value) {
    case "error":
      return "warning";
    case "success":
      return "check_circle";
    case "warning":
      return "priority_high";
    case "accent":
      return "lightbulb";
    default:
      return "info";
  }
});

/** Tonal fills closer to the design refs (soft tint + saturated foreground). */
const tonalClass = computed(() => {
  switch (resolvedTone.value) {
    case "success":
      return "bg-success/15 text-success";
    case "warning":
      return "bg-warning/15 text-warning";
    case "error":
      return "bg-error/15 text-error";
    case "accent":
      return "bg-accent/15 text-accent";
    default:
      return "bg-info/15 text-info";
  }
});

const chromeClass = computed(() =>
  props.variant === "outlined"
    ? toneOutlinedClasses(resolvedTone.value)
    : tonalClass.value,
);

const role = computed(() =>
  resolvedTone.value === "error" ? "alert" : "status",
);
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-lg px-4 py-3 text-sm leading-snug"
    :class="chromeClass"
    :role="role"
  >
    <span
      class="material-symbols-outlined mt-px shrink-0 text-[22px] leading-none"
      aria-hidden="true"
    >
      {{ defaultIcon }}
    </span>
    <div class="min-w-0 flex-1">
      <p v-if="title" class="font-semibold tracking-tight">{{ title }}</p>
      <div :class="title ? 'mt-0.5 opacity-90' : ''">
        <slot />
      </div>
      <div v-if="$slots.actions" class="mt-2 flex flex-wrap gap-2">
        <slot name="actions" />
      </div>
    </div>
    <AppButton
      v-if="dismissible"
      variant="text"
      :color="resolvedTone"
      size="sm"
      icon="close"
      icon-only
      :aria-label="dismissLabel ?? 'Dismiss'"
      @click="emit('dismiss')"
    />
  </div>
</template>
