<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { AppButton, AppTextField } from "@/shared/ui";
import {
  WEEK_DAYS,
  clampHour,
  clampMinute,
  clampRestMinutes,
  isDurationDefined,
  parseDurationPart,
  toggleWeekDay,
  type StudyPomodoro,
  type StudyRoutineTime,
  type WeekDay,
} from "../domain/studyRoutine";

const props = defineProps<{
  days: WeekDay[];
  time: StudyRoutineTime;
  notes: string;
  pomodoro: StudyPomodoro;
  daysLabel: string;
  timeLabel: string;
  notesLabel: string;
  notesPlaceholder?: string;
  timeHint?: string;
  required?: boolean;
}>();

const emit = defineEmits<{
  "update:days": [value: WeekDay[]];
  "update:time": [value: StudyRoutineTime];
  "update:notes": [value: string];
  "update:pomodoro": [value: StudyPomodoro];
}>();

const { t } = useI18n();

const hourText = ref(String(props.time.hour).padStart(2, "0"));
const minuteText = ref(String(props.time.minute).padStart(2, "0"));
const restMinutesText = ref(String(props.pomodoro.restMinutes));

const canUsePomodoro = computed(() => isDurationDefined(props.time));

function dayLabel(day: WeekDay) {
  return t(`studies.routine.days.${day}`);
}

function daySelected(day: WeekDay) {
  return props.days.includes(day);
}

function onToggleDay(day: WeekDay) {
  emit("update:days", toggleWeekDay(props.days, day));
}

function commitTime(hour: number, minute: number) {
  const next = {
    hour: clampHour(hour),
    minute: clampMinute(minute),
  };
  emit("update:time", next);
  if (!isDurationDefined(next) && props.pomodoro.enabled) {
    emit("update:pomodoro", {
      enabled: false,
      restMinutes: clampRestMinutes(props.pomodoro.restMinutes),
    });
  }
}

function commitPomodoro(partial: Partial<StudyPomodoro>) {
  emit("update:pomodoro", {
    enabled: partial.enabled ?? props.pomodoro.enabled,
    restMinutes: clampRestMinutes(
      partial.restMinutes ?? props.pomodoro.restMinutes,
    ),
  });
}

function onTogglePomodoro() {
  if (!canUsePomodoro.value) return;
  commitPomodoro({ enabled: !props.pomodoro.enabled });
}

function onRestBlur() {
  const minutes = clampRestMinutes(Number(restMinutesText.value));
  restMinutesText.value = String(minutes);
  commitPomodoro({ restMinutes: minutes });
}

watch(
  () => [props.time.hour, props.time.minute] as const,
  ([hour, minute]) => {
    const nextHour = clampHour(hour);
    const nextMinute = clampMinute(minute);
    if (parseDurationPart(hourText.value, "hour") !== nextHour) {
      hourText.value = String(nextHour).padStart(2, "0");
    }
    if (parseDurationPart(minuteText.value, "minute") !== nextMinute) {
      minuteText.value = String(nextMinute).padStart(2, "0");
    }
  },
);

watch(
  () => props.pomodoro.restMinutes,
  (minutes) => {
    restMinutesText.value = String(clampRestMinutes(minutes));
  },
);

/** Keep parent draft in sync while typing (Salvar must not depend on blur/ref). */
watch([hourText, minuteText], ([hourRaw, minuteRaw]) => {
  const hour = parseDurationPart(hourRaw, "hour");
  const minute = parseDurationPart(minuteRaw, "minute");
  if (hour === props.time.hour && minute === props.time.minute) return;
  commitTime(hour, minute);
});

function bumpHour(delta: number) {
  const hour = parseDurationPart(hourText.value, "hour");
  const minute = parseDurationPart(minuteText.value, "minute");
  const next = {
    hour: clampHour(hour + delta),
    minute: clampMinute(minute),
  };
  hourText.value = String(next.hour).padStart(2, "0");
  minuteText.value = String(next.minute).padStart(2, "0");
  commitTime(next.hour, next.minute);
}

function bumpMinute(delta: number) {
  const hour = parseDurationPart(hourText.value, "hour");
  const minute = parseDurationPart(minuteText.value, "minute");
  const next = {
    hour: clampHour(hour),
    minute: clampMinute(minute + delta),
  };
  hourText.value = String(next.hour).padStart(2, "0");
  minuteText.value = String(next.minute).padStart(2, "0");
  commitTime(next.hour, next.minute);
}

function onHourBlur() {
  flush();
}

function onMinuteBlur() {
  flush();
}

/** Commit typed values (e.g. before Salvar without blur). */
function flush(): StudyRoutineTime {
  const next = {
    hour: parseDurationPart(hourText.value, "hour"),
    minute: parseDurationPart(minuteText.value, "minute"),
  };
  commitTime(next.hour, next.minute);
  hourText.value = String(next.hour).padStart(2, "0");
  minuteText.value = String(next.minute).padStart(2, "0");
  return next;
}

function onHourKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    (event.target as HTMLInputElement).blur();
  }
}

function onMinuteKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    (event.target as HTMLInputElement).blur();
  }
}

defineExpose({ flush });
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium text-foreground">
        {{ daysLabel }}
        <span v-if="required" class="text-error" aria-hidden="true">*</span>
      </p>
      <div
        class="flex flex-wrap gap-2"
        role="group"
        :aria-label="daysLabel"
      >
        <AppButton
          v-for="day in WEEK_DAYS"
          :key="day"
          type="button"
          size="sm"
          rounded="full"
          :variant="daySelected(day) ? 'filled' : 'outlined'"
          :color="daySelected(day) ? 'primary' : 'muted'"
          :aria-pressed="daySelected(day)"
          @click="onToggleDay(day)"
        >
          {{ dayLabel(day) }}
        </AppButton>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium text-foreground">
        {{ timeLabel }}
      </p>
      <p v-if="timeHint" class="text-sm text-muted">{{ timeHint }}</p>
      <div
        class="flex items-center justify-center gap-3 rounded-2xl border border-border/60 bg-surface-variant/40 px-4 py-4 sm:gap-4"
        role="group"
        :aria-label="timeLabel"
      >
        <div class="flex flex-col items-center gap-1">
          <AppButton
            type="button"
            variant="text"
            color="muted"
            size="sm"
            icon="keyboard_arrow_up"
            icon-only
            :aria-label="t('studies.routine.timeHourUp')"
            @click="bumpHour(1)"
          />
          <input
            v-model="hourText"
            type="text"
            inputmode="numeric"
            maxlength="2"
            class="studia-timer-input w-14 bg-transparent text-center text-3xl font-semibold tabular-nums text-foreground outline-none"
            :aria-label="t('studies.routine.timeHour')"
            @blur="onHourBlur"
            @keydown="onHourKeydown"
          />
          <AppButton
            type="button"
            variant="text"
            color="muted"
            size="sm"
            icon="keyboard_arrow_down"
            icon-only
            :aria-label="t('studies.routine.timeHourDown')"
            @click="bumpHour(-1)"
          />
        </div>

        <span
          class="pb-1 text-3xl font-semibold text-muted tabular-nums"
          aria-hidden="true"
        >
          :
        </span>

        <div class="flex flex-col items-center gap-1">
          <AppButton
            type="button"
            variant="text"
            color="muted"
            size="sm"
            icon="keyboard_arrow_up"
            icon-only
            :aria-label="t('studies.routine.timeMinuteUp')"
            @click="bumpMinute(1)"
          />
          <input
            v-model="minuteText"
            type="text"
            inputmode="numeric"
            maxlength="2"
            class="studia-timer-input w-14 bg-transparent text-center text-3xl font-semibold tabular-nums text-foreground outline-none"
            :aria-label="t('studies.routine.timeMinute')"
            @blur="onMinuteBlur"
            @keydown="onMinuteKeydown"
          />
          <AppButton
            type="button"
            variant="text"
            color="muted"
            size="sm"
            icon="keyboard_arrow_down"
            icon-only
            :aria-label="t('studies.routine.timeMinuteDown')"
            @click="bumpMinute(-1)"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3 rounded-2xl border border-border/50 bg-surface-variant/30 px-4 py-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-foreground">
            {{ t("studies.routine.pomodoroLabel") }}
          </p>
          <p class="mt-0.5 text-sm text-muted">
            {{
              canUsePomodoro
                ? t("studies.routine.pomodoroHint")
                : t("studies.routine.pomodoroNeedsDuration")
            }}
          </p>
        </div>
        <AppButton
          type="button"
          size="sm"
          rounded="full"
          :variant="pomodoro.enabled && canUsePomodoro ? 'filled' : 'outlined'"
          :color="pomodoro.enabled && canUsePomodoro ? 'primary' : 'muted'"
          :disabled="!canUsePomodoro"
          :prepend-icon="pomodoro.enabled ? 'timer' : 'timer_off'"
          :aria-pressed="pomodoro.enabled && canUsePomodoro"
          @click="onTogglePomodoro"
        >
          {{
            pomodoro.enabled && canUsePomodoro
              ? t("studies.routine.pomodoroOn")
              : t("studies.routine.pomodoroOff")
          }}
        </AppButton>
      </div>
      <label
        v-if="pomodoro.enabled && canUsePomodoro"
        class="flex max-w-xs flex-col gap-1.5"
      >
        <span class="text-sm font-medium text-foreground">
          {{ t("studies.routine.pomodoroRest") }}
        </span>
        <input
          v-model="restMinutesText"
          type="number"
          min="1"
          max="60"
          class="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
          :aria-label="t('studies.routine.pomodoroRest')"
          @blur="onRestBlur"
        />
      </label>
    </div>

    <AppTextField
      :model-value="notes"
      :label="notesLabel"
      :placeholder="notesPlaceholder"
      @update:model-value="emit('update:notes', $event)"
    />
  </div>
</template>

<style scoped>
.studia-timer-input {
  border-radius: 0.5rem;
}

.studia-timer-input:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>
