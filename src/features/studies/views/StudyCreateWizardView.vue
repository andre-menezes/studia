<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { limits, useAuthStore, useUsage } from "@/features/auth";
import { ApiError } from "@/shared/http";
import {
  AppAlert,
  AppConfirmDialog,
  AppStepper,
  type AppStepperItem,
} from "@/shared/ui";
import type { WizardStep } from "../composables/useStudyWizard";
import { useStudyWizard } from "../composables/useStudyWizard";
import {
  WEEK_DAYS,
  buildFrequencyLabel,
  isRoutineScheduleValid,
  type StudyRoutineTime,
  type WeekDay,
} from "../domain/studyRoutine";
import { useStudyListStore } from "../stores/studyListStore";
import StudiesAppBar from "../components/StudiesAppBar.vue";
import StudyWizardActions from "../components/StudyWizardActions.vue";
import StudyWizardConfirmStep from "../components/StudyWizardConfirmStep.vue";
import StudyWizardIdentityStep from "../components/StudyWizardIdentityStep.vue";
import StudyWizardObjectiveStep from "../components/StudyWizardObjectiveStep.vue";
import StudyWizardRoutineStep from "../components/StudyWizardRoutineStep.vue";

const { t } = useI18n();
const router = useRouter();
const studies = useStudyListStore();
const auth = useAuthStore();
const usage = useUsage();
const {
  currentStep,
  draft,
  stepIndex,
  isFirst,
  isLast,
  furthestIndex,
  next,
  back,
  goToStep,
  toPayload,
  steps,
} = useStudyWizard();

const errorCode = ref<string | null>(null);
const pending = ref(false);
const cancelDialogOpen = ref(false);
const loggingOut = ref(false);
const routineStepRef = ref<{ flush: () => StudyRoutineTime | undefined } | null>(
  null,
);


const fieldOwnerStep: Record<"title" | "objective" | "frequency", WizardStep> =
  {
    title: "identity",
    objective: "objective",
    frequency: "routine",
  };

const stepIcons: Record<WizardStep, string> = {
  identity: "badge",
  objective: "flag",
  routine: "event_repeat",
  confirm: "fact_check",
};

const stepperItems = computed<AppStepperItem[]>(() =>
  steps.map((step) => ({
    value: step,
    title: t(`studies.wizard.steps.${step}`),
    icon: stepIcons[step],
  })),
);

const usageLabel = computed(() => {
  const counter = usage.value?.studyCreationsThisPeriod;
  if (!counter) return null;
  return t("studies.wizard.usage", {
    used: counter.used,
    limit: counter.limit,
  });
});

const errorMessage = computed(() =>
  errorCode.value
    ? t(`errors.${errorCode.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);

const dayLabels = computed(() => {
  const labels = {} as Record<WeekDay, string>;
  for (const day of WEEK_DAYS) {
    labels[day] = t(`studies.routine.days.${day}`);
  }
  return labels;
});

const frequencyPreview = computed(() => {
  if (!isRoutineScheduleValid(draft.days, draft.time)) return "";
  return buildFrequencyLabel(
    draft.days,
    draft.time,
    dayLabels.value,
    draft.pomodoro,
  );
});

const canAdvance = computed(() => {
  switch (currentStep.value) {
    case "identity":
      return draft.title.trim().length > 0;
    case "objective":
      return draft.objective.trim().length > 0;
    case "routine":
      return isRoutineScheduleValid(draft.days, draft.time);
    case "confirm":
      return (
        draft.title.trim().length > 0 &&
        draft.objective.trim().length > 0 &&
        isRoutineScheduleValid(draft.days, draft.time)
      );
    default:
      return false;
  }
});

function onStepChange(value: string | number) {
  flushRoutineIfNeeded();
  goToStep(String(value) as WizardStep);
}

function editField(field: "title" | "objective" | "frequency") {
  errorCode.value = null;
  goToStep(fieldOwnerStep[field]);
}

function flushRoutineIfNeeded() {
  if (currentStep.value !== "routine") return;
  const flushed = routineStepRef.value?.flush();
  if (flushed) draft.time = flushed;
}

function onBack() {
  flushRoutineIfNeeded();
  back();
}

function onNext() {
  flushRoutineIfNeeded();
  if (!canAdvance.value) return;
  next();
}

async function submit() {
  flushRoutineIfNeeded();
  if (!limits.canCreateStudy()) {
    errorCode.value = "STUDY_CREATE_LIMIT_REACHED";
    return;
  }
  if (!canAdvance.value) return;
  errorCode.value = null;
  pending.value = true;
  try {
    const study = await studies.createStudy(toPayload(dayLabels.value));
    await router.push({
      name: "studies-home",
      query: { created: study.id },
    });
  } catch (err) {
    errorCode.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
  } finally {
    pending.value = false;
  }
}

function hasDraftData() {
  return Boolean(
    draft.title.trim() ||
    draft.objective.trim() ||
    draft.days.length > 0 ||
    draft.notes.trim(),
  );
}

function cancel() {
  if (hasDraftData()) {
    cancelDialogOpen.value = true;
    return;
  }
  void leaveWizard();
}

function keepEditing() {
  cancelDialogOpen.value = false;
}

async function leaveWizard() {
  cancelDialogOpen.value = false;
  await router.push({ name: "studies-home" });
}

async function confirmDiscard() {
  await leaveWizard();
}

async function onLogout() {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await auth.logout();
    await router.push({ name: "login" });
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <main class="relative min-h-screen bg-background">
    <div
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="absolute -top-24 -right-16 size-72 rounded-full bg-accent/10 blur-3xl"
      />
      <div
        class="absolute top-1/3 -left-20 size-64 rounded-full bg-secondary/10 blur-3xl"
      />
    </div>

    <StudiesAppBar
      :app-name="t('common.appName')"
      :display-name="auth.user?.displayName ?? null"
      :logout-label="loggingOut ? t('common.loading') : t('common.logout')"
      :logging-out="loggingOut"
      @logout="onLogout"
    />

    <div class="mx-auto max-w-3xl space-y-6 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
      <div
        class="rounded-[24px] bg-surface/90 shadow-card backdrop-blur-sm"
      >
        <header class="flex flex-col gap-6 px-6 pt-7 pb-2 sm:px-8 sm:pt-8">
          <div>
            <h1
              class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              {{ t("studies.wizard.title") }}
            </h1>
            <p class="mt-1 text-base text-muted">
              {{
                t("studies.wizard.step", {
                  step: stepIndex + 1,
                  total: steps.length,
                })
              }}
            </p>
          </div>
          <AppStepper
            :items="stepperItems"
            :model-value="currentStep"
            :furthest-index="furthestIndex"
            :aria-label="t('studies.wizard.stepperAria')"
            @update:model-value="onStepChange"
          />
        </header>

        <div class="min-h-[280px] px-6 py-6 sm:min-h-[320px] sm:px-8 sm:py-8">
          <Transition name="wizard-step" mode="out-in">
            <StudyWizardIdentityStep
              v-if="currentStep === 'identity'"
              :key="'identity'"
              :title="draft.title"
              :label="t('studies.wizard.fields.title')"
              :heading="t('studies.wizard.prompts.identity.heading')"
              :hint="t('studies.wizard.prompts.identity.hint')"
              :placeholder="t('studies.wizard.prompts.identity.placeholder')"
              @update:title="draft.title = $event"
            />
            <StudyWizardObjectiveStep
              v-else-if="currentStep === 'objective'"
              :key="'objective'"
              :objective="draft.objective"
              :label="t('studies.wizard.fields.objective')"
              :heading="t('studies.wizard.prompts.objective.heading')"
              :hint="t('studies.wizard.prompts.objective.hint')"
              :placeholder="
                t('studies.wizard.prompts.objective.placeholder')
              "
              @update:objective="draft.objective = $event"
            />
            <StudyWizardRoutineStep
              v-else-if="currentStep === 'routine'"
              ref="routineStepRef"
              :key="'routine'"
              :days="draft.days"
              :time="draft.time"
              :notes="draft.notes"
              :pomodoro="draft.pomodoro"
              :days-label="t('studies.wizard.fields.days')"
              :time-label="t('studies.wizard.fields.time')"
              :notes-label="t('studies.wizard.fields.notes')"
              :heading="t('studies.wizard.prompts.routine.heading')"
              :hint="t('studies.wizard.prompts.routine.hint')"
              :notes-placeholder="
                t('studies.wizard.prompts.routine.notesPlaceholder')
              "
              :time-hint="t('studies.wizard.prompts.routine.timeHint')"
              @update:days="draft.days = $event"
              @update:time="draft.time = $event"
              @update:notes="draft.notes = $event"
              @update:pomodoro="draft.pomodoro = $event"
            />
            <StudyWizardConfirmStep
              v-else
              :key="'confirm'"
              :title="draft.title"
              :objective="draft.objective"
              :frequency="frequencyPreview"
              :notes="draft.notes"
              :title-label="t('studies.wizard.fields.title')"
              :objective-label="t('studies.wizard.fields.objective')"
              :frequency-label="t('studies.wizard.fields.frequency')"
              :edit-label="t('studies.wizard.edit')"
              :heading="t('studies.wizard.prompts.confirm.heading')"
              :usage-label="usageLabel"
              @edit="editField"
            />
          </Transition>

          <AppAlert v-if="errorMessage" class="mt-6" type="error">
            {{ errorMessage }}
          </AppAlert>
        </div>

        <StudyWizardActions
          :is-first="isFirst"
          :is-last="isLast"
          :pending="pending"
          :can-continue="canAdvance"
          :back-label="t('common.back')"
          :cancel-label="t('common.cancel')"
          :continue-label="t('common.continue')"
          :submit-label="t('studies.wizard.submit')"
          :loading-label="t('common.loading')"
          @back="onBack"
          @cancel="cancel"
          @next="onNext"
          @submit="submit"
        />
      </div>
    </div>

    <AppConfirmDialog
      v-model="cancelDialogOpen"
      :title="t('studies.wizard.cancelConfirmTitle')"
      :description="t('studies.wizard.cancelConfirm')"
      :confirm-label="t('studies.wizard.cancelConfirmDiscard')"
      :cancel-label="t('studies.wizard.cancelConfirmKeep')"
      confirm-color="error"
      confirm-icon="delete"
      cancel-icon="edit"
      @confirm="confirmDiscard"
      @cancel="keepEditing"
    />
  </main>
</template>
