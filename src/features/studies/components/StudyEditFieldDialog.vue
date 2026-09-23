<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  AppButton,
  AppCard,
  AppModal,
  AppTextField,
  AppTextarea,
  type AppButtonColor,
} from "@/shared/ui";
import type { Study, StudyStatus, UpdateStudyInput } from "../domain/study";
import { STUDY_STATUS_ORDER } from "../domain/study";
import {
  DEFAULT_POMODORO_REST_MINUTES,
  DEFAULT_ROUTINE_TIME,
  WEEK_DAYS,
  isRoutineScheduleValid,
  routineFromSchedule,
  scheduleFromRoutine,
  type StudyPomodoro,
  type StudyRoutineTime,
  type WeekDay,
} from "../domain/studyRoutine";
import {
  studyStatusButtonColor,
  studyStatusIcon,
} from "./studyStatusUi";
import StudyRoutineFields from "./StudyRoutineFields.vue";

export type StudyEditField = "title" | "objective" | "routine" | "status";

const STATUS_OPTIONS: {
  status: StudyStatus;
  icon: string;
  color: AppButtonColor;
}[] = STUDY_STATUS_ORDER.map((status) => ({
  status,
  icon: studyStatusIcon(status),
  color: studyStatusButtonColor(status),
}));

const props = defineProps<{
  open: boolean;
  field: StudyEditField | null;
  study: Study | null;
  pending?: boolean;
  errorMessage?: string | null;
  canActivate?: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  save: [payload: UpdateStudyInput];
  cancel: [];
}>();

const { t } = useI18n();

const titleDraft = ref("");
const objectiveDraft = ref("");
const daysDraft = ref<WeekDay[]>([]);
const timeDraft = ref<StudyRoutineTime>({ ...DEFAULT_ROUTINE_TIME });
const notesDraft = ref("");
const pomodoroDraft = ref<StudyPomodoro>({
  enabled: false,
  restMinutes: DEFAULT_POMODORO_REST_MINUTES,
});
const statusDraft = ref<StudyStatus>("CREATED");
const routineFieldsRef = ref<{ flush: () => StudyRoutineTime } | null>(null);

const dayLabels = computed(() => {
  const labels = {} as Record<WeekDay, string>;
  for (const day of WEEK_DAYS) {
    labels[day] = t(`studies.routine.days.${day}`);
  }
  return labels;
});

watch(
  () => [props.open, props.field] as const,
  ([open, field]) => {
    if (!open || !field || !props.study) return;
    const study = props.study;
    titleDraft.value = study.title;
    objectiveDraft.value = study.objective;
    const schedule = scheduleFromRoutine(study.routine);
    daysDraft.value = [...schedule.days];
    timeDraft.value = { ...schedule.time };
    notesDraft.value = schedule.notes;
    pomodoroDraft.value = { ...schedule.pomodoro };
    statusDraft.value = study.status;
  },
  { immediate: true },
);

const dialogTitle = computed(() => {
  if (!props.field) return "";
  return t(`studies.detail.editTitles.${props.field}`);
});

const canSave = computed(() => {
  if (!props.field) return false;
  switch (props.field) {
    case "title":
      return titleDraft.value.trim().length > 0;
    case "objective":
      return objectiveDraft.value.trim().length > 0;
    case "routine":
      return isRoutineScheduleValid(daysDraft.value, timeDraft.value);
    case "status": {
      if (statusDraft.value !== "STARTED") return true;
      if (props.study?.status === "STARTED") return true;
      return props.canActivate !== false;
    }
    default:
      return false;
  }
});

function close() {
  emit("update:open", false);
  emit("cancel");
}

function onTimeUpdate(value: StudyRoutineTime) {
  timeDraft.value = value;
}

function onSave() {
  if (!props.field || !canSave.value) return;
  let payload: UpdateStudyInput;
  switch (props.field) {
    case "title":
      payload = { title: titleDraft.value.trim() };
      break;
    case "objective":
      payload = { objective: objectiveDraft.value.trim() };
      break;
    case "routine": {
      // Prefer flush() so typed values commit even without blur; fall back to draft.
      const flushed = routineFieldsRef.value?.flush?.();
      const time = flushed ?? { ...timeDraft.value };
      timeDraft.value = { ...time };
      payload = {
        routine: routineFromSchedule(
          daysDraft.value,
          time,
          dayLabels.value,
          notesDraft.value,
          pomodoroDraft.value,
        ),
      };
      break;
    }
    case "status":
      payload = { status: statusDraft.value };
      break;
  }
  emit("save", payload);
}
</script>

<template>
  <AppModal
    :model-value="open"
    :aria-label="dialogTitle"
    @update:model-value="emit('update:open', $event)"
  >
    <AppCard block>
      <template #card-title>{{ dialogTitle }}</template>
      <template #card-subtitle>
        {{ t("studies.detail.editSubtitle") }}
      </template>

      <div class="flex flex-col gap-4">
        <AppTextField
          v-if="field === 'title'"
          v-model="titleDraft"
          required
          prepend-icon="badge"
          :label="t('studies.wizard.fields.title')"
        />

        <AppTextarea
          v-else-if="field === 'objective'"
          v-model="objectiveDraft"
          required
          :label="t('studies.wizard.fields.objective')"
          :rows="4"
        />

        <StudyRoutineFields
          v-else-if="field === 'routine'"
          ref="routineFieldsRef"
          :days="daysDraft"
          :time="timeDraft"
          :notes="notesDraft"
          :pomodoro="pomodoroDraft"
          required
          :days-label="t('studies.wizard.fields.days')"
          :time-label="t('studies.wizard.fields.time')"
          :notes-label="t('studies.wizard.fields.notes')"
          :notes-placeholder="
            t('studies.wizard.prompts.routine.notesPlaceholder')
          "
          :time-hint="t('studies.wizard.prompts.routine.timeHint')"
          @update:days="daysDraft = $event"
          @update:time="onTimeUpdate"
          @update:notes="notesDraft = $event"
          @update:pomodoro="pomodoroDraft = $event"
        />

        <div v-else-if="field === 'status'" class="flex flex-col gap-2">
          <p class="text-sm text-muted">{{ t("studies.detail.statusHint") }}</p>
          <div
            class="flex flex-wrap gap-2"
            role="radiogroup"
            :aria-label="t('studies.detail.statusHint')"
          >
            <AppButton
              v-for="option in STATUS_OPTIONS"
              :key="option.status"
              type="button"
              size="sm"
              rounded="full"
              :variant="statusDraft === option.status ? 'filled' : 'outlined'"
              :color="option.color"
              :prepend-icon="option.icon"
              :aria-pressed="statusDraft === option.status"
              @click="statusDraft = option.status"
            >
              {{ t(`studies.status.${option.status}`) }}
            </AppButton>
          </div>
          <p
            v-if="
              statusDraft === 'STARTED' &&
              study?.status !== 'STARTED' &&
              canActivate === false
            "
            class="text-sm text-error"
          >
            {{ t("errors.STUDY_ACTIVE_LIMIT_REACHED") }}
          </p>
        </div>

        <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
      </div>

      <template #card-actions>
        <AppButton
          variant="outlined"
          color="muted"
          prepend-icon="close"
          :disabled="pending"
          @click="close"
        >
          {{ t("common.cancel") }}
        </AppButton>
        <AppButton
          prepend-icon="check"
          :loading="pending"
          :disabled="pending || !canSave"
          @click="onSave"
        >
          {{ t("studies.detail.save") }}
        </AppButton>
      </template>
    </AppCard>
  </AppModal>
</template>
