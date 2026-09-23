<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { limits, useAuthStore } from "@/features/auth";
import { ApiError } from "@/shared/http";
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppSpinner,
} from "@/shared/ui";
import type { StudyStatus, UpdateStudyInput } from "../domain/study";
import { studyStatusTone } from "../components/studyStatusUi";
import StudiesAppBar from "../components/StudiesAppBar.vue";
import StudyEditFieldDialog, {
  type StudyEditField,
} from "../components/StudyEditFieldDialog.vue";
import StudySessionTimer from "../components/StudySessionTimer.vue";
import { canShowSessionTimer } from "../domain/studyRoutine";
import { useStudyDetailStore } from "../stores/studyDetailStore";
import { useStudyListStore } from "../stores/studyListStore";

const props = defineProps<{
  studyId: string;
}>();

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const detail = useStudyDetailStore();
const list = useStudyListStore();

const loggingOut = ref(false);
const loadError = ref<string | null>(null);
const editOpen = ref(false);
const editField = ref<StudyEditField | null>(null);
const editPending = ref(false);
const editError = ref<string | null>(null);

const study = computed(() => detail.data);
const isLoading = computed(
  () => detail.status === "loading" || detail.status === "idle",
);
const isMissing = computed(
  () => detail.status === "error" || (detail.status === "success" && !study.value),
);

const statusTone = computed(() =>
  study.value ? studyStatusTone(study.value.status) : "muted",
);

const canActivate = computed(() => {
  if (!study.value) return false;
  if (study.value.status === "STARTED") return true;
  return limits.canActivateStudy(list.startedCount);
});

const showSessionTimer = computed(
  () => study.value != null && canShowSessionTimer(study.value.status),
);

const starting = ref(false);
const timerSessionActive = ref(false);

const editsLocked = computed(() => timerSessionActive.value);

const loadErrorMessage = computed(() =>
  loadError.value
    ? t(`errors.${loadError.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);

const editErrorMessage = computed(() =>
  editError.value
    ? t(`errors.${editError.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);

async function load() {
  loadError.value = null;
  try {
    await detail.fetchById(props.studyId);
  } catch (err) {
    loadError.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
  }
}

watch(
  () => props.studyId,
  () => {
    void load();
  },
);

onMounted(() => {
  void list.fetchStudies().catch(() => {
    /* lista auxiliar para canActivate; detalhe não depende dela */
  });
  void load();
});

onUnmounted(() => {
  detail.clear();
});

function openEdit(field: StudyEditField) {
  if (editsLocked.value) return;
  editField.value = field;
  editError.value = null;
  editOpen.value = true;
}

async function onSave(payload: UpdateStudyInput) {
  if (!study.value) return;
  editPending.value = true;
  editError.value = null;
  try {
    await detail.update(study.value.id, payload);
    editOpen.value = false;
    editField.value = null;
  } catch (err) {
    editError.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
  } finally {
    editPending.value = false;
  }
}

async function onCommitStudySeconds(deltaSeconds: number) {
  if (!study.value || deltaSeconds <= 0) return;
  const nextTotal = (study.value.totalStudySeconds ?? 0) + deltaSeconds;
  try {
    await detail.update(study.value.id, { totalStudySeconds: nextTotal });
  } catch {
    /* métrica best-effort; não bloquear o timer */
  }
}

/**
 * Ensures Study is STARTED before the session timer begins.
 * Reused by "Iniciar estudo" and by StudySessionTimer via `ensureStarted`.
 */
async function ensureStarted(): Promise<boolean> {
  if (!study.value) return false;
  if (study.value.status !== "CREATED") return true;
  if (!canActivate.value) {
    editError.value = "STUDY_ACTIVE_LIMIT_REACHED";
    return false;
  }
  if (starting.value) return false;
  starting.value = true;
  editError.value = null;
  try {
    await detail.update(study.value.id, { status: "STARTED" });
    return true;
  } catch (err) {
    editError.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
    return false;
  } finally {
    starting.value = false;
  }
}

async function onStart() {
  await ensureStarted();
}

async function goHome() {
  await router.push({ name: "studies-home" });
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

function statusLabel(status: StudyStatus) {
  return t(`studies.status.${status}`, status);
}
</script>

<template>
  <main class="relative min-h-screen bg-background">
    <div
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="absolute -top-24 -right-16 size-72 rounded-full bg-primary/10 blur-3xl"
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

    <div
      class="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-6 pb-10 sm:gap-8 sm:px-6 sm:pt-8 sm:pb-12"
    >
      <div class="flex items-center gap-3">
        <AppButton
          variant="text"
          color="muted"
          prepend-icon="arrow_back"
          @click="goHome"
        >
          {{ t("studies.detail.back") }}
        </AppButton>
      </div>

      <div
        v-if="isLoading"
        class="flex min-h-[40vh] items-center justify-center"
      >
        <AppSpinner :label="t('common.loading')" label-visible />
      </div>

      <AppAlert v-else-if="isMissing" type="error">
        {{ loadErrorMessage ?? t("errors.STUDY_NOT_FOUND") }}
      </AppAlert>

      <template v-else-if="study">
        <div
          class="flex flex-col gap-4 rounded-[24px] bg-surface/90 px-6 py-6 shadow-card backdrop-blur-sm sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-7"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-3">
              <h1
                class="text-2xl leading-none font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                {{ study.title }}
              </h1>
              <AppBadge
                :tone="statusTone"
                variant="outlined"
                size="sm"
                class="self-center"
              >
                {{ statusLabel(study.status) }}
              </AppBadge>
            </div>
            <p class="mt-2 text-base text-muted">
              {{ t("studies.detail.subtitle") }}
            </p>
          </div>
          <div class="flex w-fit shrink-0 flex-col gap-2 sm:items-end">
            <AppButton
              v-if="study.status === 'CREATED'"
              variant="tonal"
              color="primary"
              size="sm"
              prepend-icon="play_arrow"
              icon-fill
              :loading="starting"
              :disabled="starting || !canActivate"
              @click="onStart"
            >
              {{ t("studies.home.start") }}
            </AppButton>
            <AppButton
              variant="outlined"
              color="muted"
              size="sm"
              prepend-icon="tune"
              :disabled="editsLocked"
              @click="openEdit('status')"
            >
              {{ t("studies.detail.changeStatus") }}
            </AppButton>
          </div>
        </div>

        <AppAlert v-if="editErrorMessage" type="error">
          {{ editErrorMessage }}
        </AppAlert>

        <StudySessionTimer
          v-if="showSessionTimer"
          :preset="study.routine.time"
          :days-of-week="study.routine.daysOfWeek"
          :pomodoro="study.routine.pomodoro"
          :ensure-started="ensureStarted"
          @edit-duration="openEdit('routine')"
          @commit-study-seconds="onCommitStudySeconds"
          @session-active="timerSessionActive = $event"
        />

        <section class="flex flex-col gap-4">
          <article
            class="flex items-start justify-between gap-4 rounded-[20px] bg-surface/90 px-6 py-5 shadow-card"
          >
            <div class="min-w-0">
              <h2 class="text-sm text-muted">
                {{ t("studies.wizard.fields.title") }}
              </h2>
              <p class="mt-1 text-base text-foreground">{{ study.title }}</p>
            </div>
            <AppButton
              variant="text"
              color="primary"
              size="sm"
              prepend-icon="edit"
              :disabled="editsLocked"
              @click="openEdit('title')"
            >
              {{ t("studies.detail.edit") }}
            </AppButton>
          </article>

          <article
            class="flex items-start justify-between gap-4 rounded-[20px] bg-surface/90 px-6 py-5 shadow-card"
          >
            <div class="min-w-0">
              <h2 class="text-sm text-muted">
                {{ t("studies.wizard.fields.objective") }}
              </h2>
              <p class="mt-1 text-base text-foreground">{{ study.objective }}</p>
            </div>
            <AppButton
              variant="text"
              color="primary"
              size="sm"
              prepend-icon="edit"
              :disabled="editsLocked"
              @click="openEdit('objective')"
            >
              {{ t("studies.detail.edit") }}
            </AppButton>
          </article>

          <article
            class="flex items-start justify-between gap-4 rounded-[20px] bg-surface/90 px-6 py-5 shadow-card"
          >
            <div class="min-w-0">
              <h2 class="text-sm text-muted">
                {{ t("studies.wizard.fields.frequency") }}
              </h2>
              <p class="mt-1 text-base text-foreground">
                {{ study.routine.frequency }}
              </p>
              <p
                v-if="study.routine.notes"
                class="mt-2 text-sm text-muted"
              >
                {{ study.routine.notes }}
              </p>
            </div>
            <AppButton
              variant="text"
              color="primary"
              size="sm"
              prepend-icon="edit"
              :disabled="editsLocked"
              @click="openEdit('routine')"
            >
              {{ t("studies.detail.edit") }}
            </AppButton>
          </article>

          <article
            class="rounded-[20px] bg-surface/60 px-6 py-5 text-sm text-muted shadow-card"
          >
            {{ t("studies.detail.tasksComingSoon") }}
          </article>
        </section>
      </template>
    </div>

    <StudyEditFieldDialog
      v-model:open="editOpen"
      :field="editField"
      :study="study"
      :pending="editPending"
      :error-message="editErrorMessage"
      :can-activate="canActivate"
      @save="onSave"
    />
  </main>
</template>
