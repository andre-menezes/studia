<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { limits, useAuthStore } from "@/features/auth";
import { ApiError } from "@/shared/http";
import {
  AppAlert,
  AppButton,
  AppConfirmDialog,
  AppSpinner,
  AppTextField,
} from "@/shared/ui";
import {
  fieldControlOkClass,
  fieldControlSelectClass,
} from "@/shared/ui/fieldChrome";
import StudiesAppBar from "../components/StudiesAppBar.vue";
import StudiesEmptyState from "../components/StudiesEmptyState.vue";
import StudyBoardColumn from "../components/StudyBoardColumn.vue";
import { STUDY_STATUS_ORDER, type StudyStatus } from "../domain/study";
import {
  canDropStudyOnColumn,
  canMoveStudyStatus,
} from "../domain/studyStatusTransitions";
import { useStudyListStore } from "../stores/studyListStore";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const studies = useStudyListStore();
const auth = useAuthStore();

const errorCode = ref<string | null>(null);
const actionError = ref<string | null>(null);
const loggingOut = ref(false);
const highlightedId = ref<string | null>(null);
const startingId = ref<string | null>(null);
const searchQuery = ref("");
const statusFilter = ref<"" | StudyStatus>("");
const createSuccessTitle = ref<string | null>(null);
const createSuccessMessage = ref<string | null>(null);
const draggingStudyId = ref<string | null>(null);
const draggingFromStatus = ref<StudyStatus | null>(null);
const archiveDialogOpen = ref(false);
const pendingArchive = ref<{
  studyId: string;
  fromStatus: StudyStatus;
  beforeStudyId: string | null;
} | null>(null);
const archivePending = ref(false);

const errorMessage = computed(() =>
  errorCode.value
    ? t(`errors.${errorCode.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);
const actionErrorMessage = computed(() =>
  actionError.value
    ? t(`errors.${actionError.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);

const canCreate = computed(() => limits.canCreateStudy());
const canStart = computed(() => limits.canActivateStudy(studies.startedCount));
const showCreateInColumn = computed(
  () => auth.isAuthenticated && canCreate.value && studies.data.length > 0,
);
const createLimitMessage = computed(() =>
  auth.isAuthenticated && !canCreate.value
    ? t("errors.STUDY_CREATE_LIMIT_REACHED")
    : null,
);
const isLoading = computed(
  () => studies.status === "loading" || studies.status === "idle",
);
const isEmpty = computed(
  () => studies.status === "success" && studies.data.length === 0,
);

const filteredStudies = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return studies.data.filter((study) => {
    if (statusFilter.value && study.status !== statusFilter.value) return false;
    if (!query) return true;
    return study.title.toLowerCase().includes(query);
  });
});

const visibleStatuses = computed(() =>
  statusFilter.value ? [statusFilter.value] : STUDY_STATUS_ORDER,
);

const columns = computed(() =>
  visibleStatuses.value.map((status) => ({
    status,
    title: t(`studies.status.${status}`),
    studies: filteredStudies.value.filter((study) => study.status === status),
  })),
);

const hasFilterResults = computed(() => filteredStudies.value.length > 0);
const filtersActive = computed(
  () => Boolean(statusFilter.value) || searchQuery.value.trim().length > 0,
);

onMounted(async () => {
  try {
    await studies.fetchStudies();
  } catch (err) {
    errorCode.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
    return;
  }

  const created = route.query.created;
  if (typeof created === "string" && created.length > 0) {
    highlightedId.value = created;
    const study = studies.data.find((item) => item.id === created);
    createSuccessTitle.value = t("studies.home.createSuccessTitle");
    createSuccessMessage.value = t("studies.home.createSuccessMessage", {
      title: study?.title ?? t("studies.home.createSuccessFallback"),
    });
    await router.replace({ query: {} });
  }
});

function dismissCreateSuccess() {
  createSuccessTitle.value = null;
  createSuccessMessage.value = null;
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

async function onCreate() {
  await router.push({ name: "studies-create" });
}

async function onStart(studyId: string) {
  if (!canStart.value || startingId.value) return;
  startingId.value = studyId;
  actionError.value = null;
  try {
    await studies.updateStudy(studyId, { status: "STARTED" });
  } catch (err) {
    actionError.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
  } finally {
    startingId.value = null;
  }
}

function clearFilters() {
  searchQuery.value = "";
  statusFilter.value = "";
}

function onDragStart(payload: { studyId: string; status: StudyStatus }) {
  draggingStudyId.value = payload.studyId;
  draggingFromStatus.value = payload.status;
}

function onDragEnd() {
  draggingStudyId.value = null;
  draggingFromStatus.value = null;
}

async function applyStatusChange(
  studyId: string,
  fromStatus: StudyStatus,
  toStatus: StudyStatus,
  beforeStudyId: string | null = null,
) {
  if (fromStatus !== toStatus && !canMoveStudyStatus(fromStatus, toStatus)) {
    return;
  }

  if (toStatus === "STARTED" && fromStatus !== "STARTED" && !canStart.value) {
    actionError.value = "STUDY_ACTIVE_LIMIT_REACHED";
    return;
  }

  actionError.value = null;
  try {
    if (fromStatus !== toStatus) {
      await studies.updateStudy(studyId, { status: toStatus });
    }
    studies.reorderInBoard(studyId, beforeStudyId);
  } catch (err) {
    actionError.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
  }
}

function onDrop(payload: {
  studyId: string;
  fromStatus: StudyStatus;
  toStatus: StudyStatus;
  beforeStudyId: string | null;
}) {
  onDragEnd();
  if (!canDropStudyOnColumn(payload.fromStatus, payload.toStatus)) return;

  if (
    payload.fromStatus === payload.toStatus &&
    isNoOpReorder(payload.studyId, payload.beforeStudyId, payload.toStatus)
  ) {
    return;
  }

  if (payload.toStatus === "ARCHIVED" && payload.fromStatus !== "ARCHIVED") {
    pendingArchive.value = {
      studyId: payload.studyId,
      fromStatus: payload.fromStatus,
      beforeStudyId: payload.beforeStudyId,
    };
    archiveDialogOpen.value = true;
    return;
  }

  void applyStatusChange(
    payload.studyId,
    payload.fromStatus,
    payload.toStatus,
    payload.beforeStudyId,
  );
}

function isNoOpReorder(
  studyId: string,
  beforeStudyId: string | null,
  status: StudyStatus,
) {
  const column = studies.data.filter((s) => s.status === status);
  const currentIndex = column.findIndex((s) => s.id === studyId);
  if (currentIndex === -1) return true;

  if (beforeStudyId === null) {
    return currentIndex === column.length - 1;
  }

  const targetIndex = column.findIndex((s) => s.id === beforeStudyId);
  if (targetIndex === -1) return true;
  return targetIndex === currentIndex || targetIndex === currentIndex + 1;
}

function cancelArchive() {
  archiveDialogOpen.value = false;
  pendingArchive.value = null;
}

async function confirmArchive() {
  if (!pendingArchive.value || archivePending.value) return;
  archivePending.value = true;
  const { studyId, fromStatus, beforeStudyId } = pendingArchive.value;
  try {
    await applyStatusChange(studyId, fromStatus, "ARCHIVED", beforeStudyId);
    archiveDialogOpen.value = false;
    pendingArchive.value = null;
  } finally {
    archivePending.value = false;
  }
}
</script>

<template>
  <main class="relative flex h-dvh flex-col overflow-hidden bg-background">
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
      max-width-class="max-w-[90rem]"
      @logout="onLogout"
    />

    <div
      class="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col gap-4 px-4 pt-4 pb-4 sm:gap-5 sm:px-6 sm:pt-5 sm:pb-5"
    >
      <div
        v-if="isLoading"
        class="flex min-h-0 flex-1 items-center justify-center"
      >
        <AppSpinner :label="t('common.loading')" label-visible />
      </div>

      <StudiesEmptyState
        v-else-if="isEmpty"
        class="min-h-0 flex-1"
        :empty-title="t('studies.home.emptyTitle')"
        :empty-message="t('studies.home.empty')"
        :create-label="t('studies.home.create')"
        :can-create="canCreate"
        :create-limit-message="createLimitMessage"
        @create="onCreate"
      />

      <template v-else>
        <div
          class="flex shrink-0 flex-col gap-3 rounded-[20px] bg-surface/80 px-4 py-3 shadow-card sm:flex-row sm:items-end sm:gap-4 sm:px-5"
        >
          <div class="min-w-0 flex-1">
            <AppTextField
              v-model="searchQuery"
              type="search"
              prepend-icon="search"
              :label="t('studies.home.searchLabel')"
              :placeholder="t('studies.home.searchPlaceholder')"
            />
          </div>
          <label class="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-xs">
            <span class="text-sm font-medium text-foreground">
              {{ t("studies.home.statusFilterLabel") }}
            </span>
            <select
              v-model="statusFilter"
              :class="[fieldControlSelectClass, fieldControlOkClass]"
            >
              <option value="">
                {{ t("studies.home.statusFilterAll") }}
              </option>
              <option
                v-for="status in STUDY_STATUS_ORDER"
                :key="status"
                :value="status"
              >
                {{ t(`studies.status.${status}`) }}
              </option>
            </select>
          </label>
          <AppButton
            v-if="filtersActive"
            variant="text"
            color="muted"
            size="sm"
            prepend-icon="filter_alt_off"
            class="shrink-0 self-end"
            @click="clearFilters"
          >
            {{ t("studies.home.clearFilters") }}
          </AppButton>
        </div>

        <p
          v-if="filtersActive && !hasFilterResults"
          class="shrink-0 text-sm text-muted"
        >
          {{ t("studies.home.noFilterResults") }}
        </p>

        <div
          class="studia-scrollbar flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden px-1 pt-2 pb-2"
        >
          <StudyBoardColumn
            v-for="column in columns"
            :key="column.status"
            :status="column.status"
            :title="column.title"
            :count="column.studies.length"
            :studies="column.studies"
            :highlighted-id="highlightedId"
            :can-start="canStart"
            :starting-id="startingId"
            :empty-label="t('studies.home.columnEmpty')"
            :dragging-study-id="draggingStudyId"
            :dragging-from-status="draggingFromStatus"
            :show-create="column.status === 'CREATED' && showCreateInColumn"
            :create-label="t('studies.home.create')"
            :create-limit-message="
              column.status === 'CREATED' ? createLimitMessage : null
            "
            class="h-full"
            @start="onStart"
            @create="onCreate"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
            @drop="onDrop"
          />
        </div>
      </template>
    </div>

    <AppConfirmDialog
      v-model="archiveDialogOpen"
      :title="t('studies.home.archiveConfirmTitle')"
      :description="t('studies.home.archiveConfirm')"
      :confirm-label="t('studies.home.archiveConfirmAction')"
      :cancel-label="t('studies.home.archiveConfirmKeep')"
      confirm-color="error"
      confirm-icon="inventory_2"
      cancel-icon="close"
      :confirm-loading="archivePending"
      @confirm="confirmArchive"
      @cancel="cancelArchive"
    />
  </main>

  <Teleport to="body">
    <div
      v-if="errorMessage || actionErrorMessage || createSuccessMessage"
      class="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-3"
    >
      <AppAlert
        v-if="errorMessage"
        class="pointer-events-auto w-full max-w-4xl shadow-card"
        type="error"
        dismissible
        :duration-ms="5000"
        :dismiss-label="t('studies.home.dismissAlert')"
        @dismiss="errorCode = null"
      >
        {{ errorMessage }}
      </AppAlert>
      <AppAlert
        v-if="actionErrorMessage"
        class="pointer-events-auto w-full max-w-4xl shadow-card"
        type="error"
        dismissible
        :duration-ms="5000"
        :dismiss-label="t('studies.home.dismissAlert')"
        @dismiss="actionError = null"
      >
        {{ actionErrorMessage }}
      </AppAlert>
      <AppAlert
        v-if="createSuccessMessage"
        class="pointer-events-auto w-full max-w-4xl shadow-card"
        type="success"
        dismissible
        :duration-ms="5000"
        :dismiss-label="t('studies.home.dismissAlert')"
        :title="createSuccessTitle ?? undefined"
        @dismiss="dismissCreateSuccess"
      >
        {{ createSuccessMessage }}
      </AppAlert>
    </div>
  </Teleport>
</template>
