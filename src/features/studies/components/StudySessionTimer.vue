<script setup lang="ts">
import { computed, onUnmounted, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { AppButton, AppConfirmDialog } from "@/shared/ui";
import {
  formatDurationLabel,
  isTodayScheduledStudyDay,
  type StudyPomodoro,
  type StudyRoutineTime,
  type WeekDay,
} from "../domain/studyRoutine";
import { useStudySessionTimer } from "../composables/useStudySessionTimer";
import {
  playSessionChime,
  unlockSessionAudio,
} from "../lib/sessionChime";

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const props = defineProps<{
  preset: StudyRoutineTime | null | undefined;
  daysOfWeek?: WeekDay[] | null;
  pomodoro?: StudyPomodoro | null;
  /**
   * Optional gate before a fresh start (not resume).
   * Parent activates CREATED → STARTED when needed; return false to abort.
   */
  ensureStarted?: () => Promise<boolean>;
}>();

const emit = defineEmits<{
  editDuration: [];
  commitStudySeconds: [deltaSeconds: number];
  /** True while a session is in progress (studying / paused / resting). */
  sessionActive: [active: boolean];
}>();

const { t } = useI18n();
const offDayDialogOpen = ref(false);
const pendingStartKind = ref<"start" | "resume" | null>(null);
const notice = ref<string | null>(null);
const noticeTone = ref<"studyComplete" | "restComplete" | "default">(
  "default",
);
let noticeTimer: ReturnType<typeof setTimeout> | null = null;

const pomodoroRef = toRef(props, "pomodoro");

const {
  phase,
  displayClock,
  hasPreset,
  progressFraction,
  restMinutes,
  sessionComplete,
  lastSignal,
  pomodoroEnabled,
  start,
  pause,
  resume,
  reset,
  startRest,
  skipRest,
} = useStudySessionTimer(toRef(props, "preset"), {
  onCommitStudySeconds: (delta) => emit("commitStudySeconds", delta),
  pomodoro: pomodoroRef,
  onSignal: (signal) => {
    if (signal === "studyComplete") {
      playSessionChime("restStart");
      showNotice(
        pomodoroEnabled.value
          ? t("studies.timer.noticeRestStart")
          : t("studies.timer.done"),
        "studyComplete",
      );
    } else if (signal === "restComplete") {
      playSessionChime("restEnd");
      showNotice(t("studies.timer.noticeRestEnd"), "restComplete");
    }
  },
});

const sessionActive = computed(() => phase.value !== "idle");

watch(
  sessionActive,
  (active) => emit("sessionActive", active),
  { immediate: true },
);

onUnmounted(() => {
  emit("sessionActive", false);
  if (noticeTimer) clearTimeout(noticeTimer);
});

const isResting = computed(() => phase.value === "resting");
const isPaused = computed(() => phase.value === "paused");
const isBreakSkin = computed(() => isResting.value);
/** Study controls (start/pause/resume) are unavailable during rest. */
const studyControlsDisabled = computed(() => isResting.value);

const strokeDashoffset = computed(
  () => RING_CIRCUMFERENCE * (1 - progressFraction.value),
);

const noticeClass = computed(() => {
  if (noticeTone.value === "restComplete") {
    return "border-accent/30 bg-accent-variant text-accent";
  }
  return "border-primary/30 bg-primary-variant text-primary";
});

const presetLabel = computed(() => {
  if (!props.preset || !hasPreset.value) {
    return t("studies.timer.noPreset");
  }
  const duration = formatDurationLabel(props.preset);
  if (pomodoroEnabled.value && props.pomodoro) {
    return t("studies.timer.presetPomodoro", {
      duration,
      rest: props.pomodoro.restMinutes,
    });
  }
  return t("studies.timer.preset", { duration });
});

function showNotice(
  message: string,
  tone: "studyComplete" | "restComplete" | "default" = "default",
) {
  notice.value = message;
  noticeTone.value = tone;
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.value = null;
    noticeTone.value = "default";
  }, 8000);
}

async function doStart(kind: "start" | "resume") {
  if (kind === "start" && props.ensureStarted) {
    const ok = await props.ensureStarted();
    if (!ok) return;
  }
  await unlockSessionAudio();
  if (kind === "resume") resume();
  else start();
}

function requestStart(kind: "start" | "resume") {
  if (studyControlsDisabled.value) return;
  if (kind === "resume" || isTodayScheduledStudyDay(props.daysOfWeek)) {
    void doStart(kind);
    return;
  }
  pendingStartKind.value = kind;
  offDayDialogOpen.value = true;
}

function confirmOffDayStart() {
  const kind = pendingStartKind.value;
  offDayDialogOpen.value = false;
  pendingStartKind.value = null;
  if (kind) void doStart(kind);
}

function cancelOffDayStart() {
  offDayDialogOpen.value = false;
  pendingStartKind.value = null;
}

function onReset() {
  notice.value = null;
  noticeTone.value = "default";
  reset();
}

function onPause() {
  if (studyControlsDisabled.value) return;
  pause();
}

function onSkipRest() {
  if (!isResting.value) return;
  skipRest();
}
</script>

<template>
  <section
    class="flex flex-col gap-4 rounded-[20px] bg-surface/90 px-5 py-5 shadow-card sm:px-6"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="text-sm font-medium text-muted">
          {{ t("studies.timer.title") }}
        </h2>
        <p class="mt-1 text-sm text-muted">{{ presetLabel }}</p>
      </div>
      <AppButton
        variant="text"
        color="primary"
        size="sm"
        prepend-icon="edit"
        :disabled="sessionActive"
        @click="emit('editDuration')"
      >
        {{ t("studies.timer.editDuration") }}
      </AppButton>
    </div>

    <div
      v-if="notice"
      class="rounded-2xl border px-4 py-3 text-sm"
      :class="noticeClass"
      role="status"
      aria-live="polite"
    >
      {{ notice }}
    </div>

    <div
      class="flex flex-col items-center gap-3 py-2 transition-opacity duration-300"
      :class="isPaused ? 'opacity-80' : 'opacity-100'"
    >
      <h3 class="text-base font-semibold text-foreground sm:text-lg">
        {{ t("studies.timer.focusAndRest") }}
      </h3>

      <div
        class="relative flex size-[120px] items-center justify-center sm:size-[140px]"
        role="img"
        :aria-label="
          isBreakSkin
            ? t('studies.timer.modeRest')
            : t('studies.timer.modeStudy')
        "
      >
        <svg
          class="absolute inset-0 size-full"
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          <g transform="rotate(-90 60 60)">
            <circle
              cx="60"
              cy="60"
              :r="RING_RADIUS"
              fill="none"
              class="stroke-border/60"
              stroke-width="4"
            />
            <circle
              cx="60"
              cy="60"
              :r="RING_RADIUS"
              fill="none"
              stroke-width="4"
              stroke-linecap="round"
              :class="isBreakSkin ? 'stroke-accent' : 'stroke-primary'"
              :stroke-dasharray="RING_CIRCUMFERENCE"
              :stroke-dashoffset="strokeDashoffset"
              class="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </g>
        </svg>
        <div
          class="relative flex items-center gap-2 rounded-full px-2.5 py-2 sm:gap-2.5 sm:px-3"
          :class="isBreakSkin ? 'bg-accent-variant/80' : 'bg-primary-variant/80'"
        >
          <span
            class="material-symbols-outlined text-[28px] leading-none transition-colors duration-300 sm:text-[32px]"
            :class="isBreakSkin ? 'text-muted/45' : 'text-primary'"
            aria-hidden="true"
          >
            laptop_mac
          </span>
          <span
            class="material-symbols-outlined text-[28px] leading-none transition-colors duration-300 sm:text-[32px]"
            :class="isBreakSkin ? 'text-accent' : 'text-muted/45'"
            aria-hidden="true"
          >
            coffee
          </span>
        </div>
      </div>

      <p
        class="text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl"
        aria-live="polite"
      >
        {{ displayClock }}
      </p>
      <p
        v-if="sessionComplete && !pomodoroEnabled"
        class="text-sm text-success"
      >
        {{ t("studies.timer.done") }}
      </p>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-2">
      <AppButton
        v-if="phase === 'idle'"
        color="primary"
        size="sm"
        prepend-icon="play_arrow"
        icon-fill
        :disabled="studyControlsDisabled"
        @click="requestStart('start')"
      >
        {{ t("studies.timer.start") }}
      </AppButton>
      <AppButton
        v-if="phase === 'studying'"
        variant="tonal"
        color="warning"
        size="sm"
        prepend-icon="pause"
        icon-fill
        :disabled="studyControlsDisabled"
        @click="onPause()"
      >
        {{ t("studies.timer.pause") }}
      </AppButton>
      <AppButton
        v-if="phase === 'paused'"
        color="primary"
        size="sm"
        prepend-icon="play_arrow"
        icon-fill
        :disabled="studyControlsDisabled"
        @click="requestStart('resume')"
      >
        {{
          lastSignal === 'restComplete'
            ? t('studies.timer.nextBlock')
            : t('studies.timer.resume')
        }}
      </AppButton>
      <AppButton
        v-if="phase === 'resting'"
        variant="tonal"
        color="secondary"
        size="sm"
        prepend-icon="stop"
        @click="onSkipRest()"
      >
        {{ t("studies.timer.skipRest") }}
      </AppButton>
      <AppButton
        v-if="phase !== 'idle'"
        variant="outlined"
        color="muted"
        size="sm"
        prepend-icon="replay"
        @click="onReset()"
      >
        {{ t("studies.timer.reset") }}
      </AppButton>
    </div>

    <div
      v-if="phase === 'paused' && !pomodoroEnabled"
      class="flex flex-col gap-3 rounded-2xl border border-border/50 bg-surface-variant/40 px-4 py-3 sm:flex-row sm:items-end"
    >
      <label class="flex min-w-0 flex-1 flex-col gap-1.5">
        <span class="text-sm font-medium text-foreground">
          {{ t("studies.timer.restMinutes") }}
        </span>
        <input
          v-model.number="restMinutes"
          type="number"
          min="1"
          max="60"
          class="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
      </label>
      <AppButton
        variant="tonal"
        color="secondary"
        size="sm"
        prepend-icon="coffee"
        class="shrink-0"
        @click="startRest()"
      >
        {{ t("studies.timer.startRest") }}
      </AppButton>
    </div>

    <AppConfirmDialog
      v-model="offDayDialogOpen"
      :title="t('studies.timer.offDayTitle')"
      :description="t('studies.timer.offDayConfirm')"
      :confirm-label="t('studies.timer.offDayStartAnyway')"
      :cancel-label="t('studies.timer.offDayKeep')"
      confirm-color="primary"
      confirm-icon="play_arrow"
      cancel-icon="close"
      @confirm="confirmOffDayStart"
      @cancel="cancelOffDayStart"
    />
  </section>
</template>
