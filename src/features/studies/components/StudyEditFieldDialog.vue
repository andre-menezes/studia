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
  studyStatusButtonColor,
  studyStatusIcon,
} from "./studyStatusUi";

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
const frequencyDraft = ref("");
const notesDraft = ref("");
const statusDraft = ref<StudyStatus>("CREATED");

watch(
  () => [props.open, props.field, props.study] as const,
  ([open, field, study]) => {
    if (!open || !field || !study) return;
    titleDraft.value = study.title;
    objectiveDraft.value = study.objective;
    frequencyDraft.value = study.routine.frequency;
    notesDraft.value = study.routine.notes ?? "";
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
      return frequencyDraft.value.trim().length > 0;
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
    case "routine":
      payload = {
        routine: {
          frequency: frequencyDraft.value.trim(),
          notes: notesDraft.value.trim() || undefined,
        },
      };
      break;
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

        <template v-else-if="field === 'routine'">
          <AppTextField
            v-model="frequencyDraft"
            required
            prepend-icon="event_repeat"
            :label="t('studies.wizard.fields.frequency')"
          />
          <AppTextarea
            v-model="notesDraft"
            :label="t('studies.wizard.fields.notes')"
            :rows="3"
          />
        </template>

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
