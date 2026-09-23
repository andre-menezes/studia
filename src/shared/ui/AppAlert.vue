<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
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

const DEFAULT_TOAST_MS = 5_000;

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
    /**
     * Fixed top-center toast. Implies dismissible and a 5s auto-dismiss
     * unless `durationMs` is set explicitly (including `0` to disable).
     */
    floating?: boolean;
    /** Auto-dismiss duration in ms. `0` disables. Default `5000` when floating. */
    durationMs?: number;
  }>(),
  {
    variant: "tonal",
    dismissible: false,
    floating: false,
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

const resolvedDurationMs = computed(() => {
  if (props.durationMs !== undefined) return Math.max(0, props.durationMs);
  return props.floating ? DEFAULT_TOAST_MS : 0;
});

const showDismiss = computed(
  () => props.dismissible || props.floating || resolvedDurationMs.value > 0,
);

const showProgress = computed(() => resolvedDurationMs.value > 0);

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

const progressToneClass = computed(() => {
  switch (resolvedTone.value) {
    case "success":
      return "bg-success";
    case "warning":
      return "bg-warning";
    case "error":
      return "bg-error";
    case "accent":
      return "bg-accent";
    default:
      return "bg-info";
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

const progressKey = ref(0);
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

function clearDismissTimer() {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

function dismiss() {
  clearDismissTimer();
  emit("dismiss");
}

function startDismissTimer() {
  clearDismissTimer();
  progressKey.value += 1;
  if (resolvedDurationMs.value <= 0) return;
  dismissTimer = setTimeout(() => {
    dismissTimer = null;
    emit("dismiss");
  }, resolvedDurationMs.value);
}

onMounted(startDismissTimer);
onBeforeUnmount(clearDismissTimer);
watch(resolvedDurationMs, startDismissTimer);
</script>

<template>
  <Teleport to="body" :disabled="!floating">
    <div
      :class="
        floating
          ? 'pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3'
          : undefined
      "
    >
      <div
        class="relative flex items-start gap-3 overflow-hidden rounded-lg px-4 py-3 text-sm leading-snug"
        :class="[
          chromeClass,
          floating
            ? 'pointer-events-auto w-full max-w-4xl shadow-card'
            : '',
        ]"
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
          v-if="showDismiss"
          class="cursor-pointer"
          variant="text"
          :color="resolvedTone"
          size="sm"
          icon="close"
          icon-only
          :aria-label="dismissLabel ?? 'Dismiss'"
          @click="dismiss"
        />
        <div
          v-if="showProgress"
          :key="progressKey"
          class="app-alert-progress absolute right-0 bottom-0 left-0 h-0.5 origin-left"
          :class="progressToneClass"
          :style="{ animationDuration: `${resolvedDurationMs}ms` }"
          aria-hidden="true"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.app-alert-progress {
  animation-name: app-alert-progress-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes app-alert-progress-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-alert-progress {
    animation: none;
    transform: scaleX(0);
  }
}
</style>
