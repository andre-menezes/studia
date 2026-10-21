<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ApiError } from "@/shared/http";
import { AppAlert, AppButton, AppSpinner, AppTextField } from "@/shared/ui";
import { TASK_TITLE_MAX, type Task } from "../domain/workspace";
import { useStudyWorkspaceStore } from "../stores/studyWorkspaceStore";

const props = defineProps<{
  /** ARCHIVED studies show tasks without any edit control. */
  readOnly: boolean;
}>();

const { t } = useI18n();
const workspace = useStudyWorkspaceStore();

const newTitle = ref("");
/** Polite live region text: move results for screen readers. */
const announcement = ref("");
const adding = ref(false);
const actionError = ref<string | null>(null);
const editingId = ref<string | null>(null);
const editingTitle = ref("");

const actionErrorMessage = computed(() =>
  actionError.value
    ? t(`errors.${actionError.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);
const loadErrorMessage = computed(() =>
  workspace.tasksError
    ? t(`errors.${workspace.tasksError}`, t("errors.INTERNAL_ERROR"))
    : null,
);

async function run(action: () => Promise<unknown>) {
  actionError.value = null;
  try {
    await action();
    return true;
  } catch (err) {
    actionError.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
    return false;
  }
}

function focusById(id: string) {
  void nextTick(() => document.getElementById(id)?.focus());
}

// Archiving while editing must not leave an editor that would answer 409.
watch(
  () => props.readOnly,
  (readOnly) => {
    if (readOnly) editingId.value = null;
  },
);

async function onAdd() {
  const title = newTitle.value.trim();
  // The field stays enabled so focus remains there for the next task.
  if (!title || adding.value) return;
  adding.value = true;
  if (await run(() => workspace.addTask(title))) newTitle.value = "";
  adding.value = false;
}

function startEdit(task: Task) {
  if (props.readOnly) return;
  editingId.value = task.id;
  editingTitle.value = task.title;
  focusById(`task-edit-${task.id}`);
}

function cancelEdit(task: Task) {
  editingId.value = null;
  focusById(`task-edit-btn-${task.id}`);
}

async function saveEdit(task: Task) {
  // Removing the focused input fires blur again after Enter/Esc: ignore it.
  if (editingId.value !== task.id) return;
  const title = editingTitle.value.trim();
  editingId.value = null;
  focusById(`task-edit-btn-${task.id}`);
  if (!title || title === task.title) return;
  await run(() => workspace.renameTask(task.id, title));
}

async function onMove(task: Task, toIndex: number, direction: "up" | "down") {
  const ok = await run(() => workspace.moveTask(task.id, toIndex));
  if (!ok) return;
  announcement.value = t("studies.tasks.moved", {
    title: task.title,
    position: toIndex + 1,
    total: workspace.tasks.length,
  });
  // At an edge the pressed button becomes disabled: keep focus on the other one.
  const atEdge = direction === "up" ? toIndex === 0 : toIndex === workspace.tasks.length - 1;
  const keep = atEdge ? (direction === "up" ? "down" : "up") : direction;
  focusById(`task-${keep}-${task.id}`);
}

async function onRemove(task: Task, index: number) {
  const ok = await run(() => workspace.removeTask(task.id));
  if (!ok) return;
  const next = workspace.tasks[index] ?? workspace.tasks[index - 1];
  focusById(next ? `task-done-${next.id}` : "task-new");
}
</script>

<template>
  <article
    class="rounded-[20px] bg-surface/90 px-6 py-5 shadow-card"
    aria-labelledby="study-tasks-title"
  >
    <header class="flex items-baseline justify-between gap-4">
      <h2 id="study-tasks-title" class="text-base font-semibold text-foreground">
        {{ t("studies.tasks.title") }}
      </h2>
      <p
        v-if="workspace.tasks.length > 0"
        class="text-sm text-muted"
        aria-live="polite"
        data-testid="tasks-progress"
      >
        {{
          t("studies.tasks.progress", {
            done: workspace.doneCount,
            total: workspace.tasks.length,
          })
        }}
      </p>
    </header>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>

    <div
      v-if="workspace.tasksStatus === 'loading'"
      class="flex justify-center py-6"
    >
      <AppSpinner :label="t('studies.tasks.loading')" />
    </div>

    <AppAlert
      v-else-if="loadErrorMessage"
      class="mt-3"
      type="error"
      variant="tonal"
    >
      {{ loadErrorMessage }}
    </AppAlert>

    <template v-else>
      <p
        v-if="workspace.tasks.length === 0"
        class="mt-3 text-sm text-muted"
      >
        {{ t(readOnly ? "studies.tasks.emptyReadOnly" : "studies.tasks.empty") }}
      </p>

      <ul v-else class="mt-3 flex flex-col gap-1">
        <li
          v-for="(task, index) in workspace.tasks"
          :key="task.id"
          class="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-foreground/5"
        >
          <input
            :id="`task-done-${task.id}`"
            type="checkbox"
            class="size-4 shrink-0 accent-primary"
            :checked="task.done"
            :aria-label="task.title"
            :disabled="readOnly || workspace.pendingTaskIds.has(task.id)"
            @change="run(() => workspace.toggleTask(task.id))"
          />
          <input
            v-if="editingId === task.id && !readOnly"
            :id="`task-edit-${task.id}`"
            v-model="editingTitle"
            class="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground"
            :aria-label="t('studies.tasks.editLabel')"
            :maxlength="TASK_TITLE_MAX"
            @keydown.enter.prevent="saveEdit(task)"
            @keydown.esc.prevent="cancelEdit(task)"
            @blur="saveEdit(task)"
          />
          <label
            v-else
            :for="`task-done-${task.id}`"
            class="min-w-0 flex-1 text-sm break-words"
            :class="task.done ? 'text-muted line-through' : 'text-foreground'"
          >
            {{ task.title }}
          </label>

          <div v-if="!readOnly" class="flex shrink-0 items-center">
            <AppButton
              :id="`task-edit-btn-${task.id}`"
              variant="text"
              color="muted"
              size="sm"
              icon="edit"
              icon-only
              :aria-label="t('studies.tasks.edit', { title: task.title })"
              @click="startEdit(task)"
            />
            <AppButton
              :id="`task-up-${task.id}`"
              variant="text"
              color="muted"
              size="sm"
              icon="arrow_upward"
              icon-only
              :disabled="index === 0 || workspace.pendingTaskIds.has(task.id)"
              :aria-label="t('studies.tasks.moveUp', { title: task.title })"
              @click="onMove(task, index - 1, 'up')"
            />
            <AppButton
              :id="`task-down-${task.id}`"
              variant="text"
              color="muted"
              size="sm"
              icon="arrow_downward"
              icon-only
              :disabled="
                index === workspace.tasks.length - 1 ||
                workspace.pendingTaskIds.has(task.id)
              "
              :aria-label="t('studies.tasks.moveDown', { title: task.title })"
              @click="onMove(task, index + 1, 'down')"
            />
            <AppButton
              variant="text"
              color="error"
              size="sm"
              icon="delete"
              icon-only
              :disabled="workspace.pendingTaskIds.has(task.id)"
              :aria-label="t('studies.tasks.remove', { title: task.title })"
              @click="onRemove(task, index)"
            />
          </div>
        </li>
      </ul>

      <form
        v-if="!readOnly"
        class="mt-3"
        @submit.prevent="onAdd"
      >
        <AppTextField
          id="task-new"
          v-model="newTitle"
          :label="t('studies.tasks.addLabel')"
          :placeholder="t('studies.tasks.addPlaceholder')"
          :maxlength="TASK_TITLE_MAX"
          prepend-icon="add"
        />
      </form>

      <AppAlert
        v-if="actionErrorMessage"
        class="mt-3"
        type="error"
        variant="tonal"
      >
        {{ actionErrorMessage }}
      </AppAlert>
    </template>
  </article>
</template>
