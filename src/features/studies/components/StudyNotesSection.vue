<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ApiError } from "@/shared/http";
import {
  AppAlert,
  AppButton,
  AppConfirmDialog,
  AppSpinner,
  AppTextarea,
} from "@/shared/ui";
import { NOTE_CONTENT_MAX, type Note } from "../domain/workspace";
import { renderMarkdown } from "../lib/markdown";
import { useStudyWorkspaceStore } from "../stores/studyWorkspaceStore";

const props = defineProps<{
  /** ARCHIVED studies show notes without any edit control. */
  readOnly: boolean;
}>();

const { t, locale } = useI18n();

function formatUpdatedAt(iso: string) {
  return new Date(iso).toLocaleString(locale.value, {
    dateStyle: "short",
    timeStyle: "short",
  });
}
const workspace = useStudyWorkspaceStore();

/** `null` = closed, `"new"` = composing, otherwise the note being edited. */
const editingId = ref<string | null>(null);
const draft = ref("");
const saving = ref(false);
const actionError = ref<string | null>(null);
const pendingDelete = ref<Note | null>(null);
const deleting = ref(false);

const actionErrorMessage = computed(() =>
  actionError.value
    ? t(`errors.${actionError.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);
const loadErrorMessage = computed(() =>
  workspace.notesError
    ? t(`errors.${workspace.notesError}`, t("errors.INTERNAL_ERROR"))
    : null,
);

/** Rendered once per content change, not on every re-render. */
const renderedNotes = computed(
  () => new Map(workspace.notes.map((n) => [n.id, renderMarkdown(n.content)])),
);

const confirmOpen = computed({
  get: () => pendingDelete.value !== null,
  set: (open) => {
    if (!open) pendingDelete.value = null;
  },
});

function codeOf(err: unknown) {
  return err instanceof ApiError ? err.code : "INTERNAL_ERROR";
}

const EDITOR_ID = "study-note-editor";

function focusById(id: string) {
  void nextTick(() => document.getElementById(id)?.focus());
}

watch(
  () => props.readOnly,
  (readOnly) => {
    if (readOnly) closeEditor();
  },
);

function openNew() {
  editingId.value = "new";
  draft.value = "";
  actionError.value = null;
  focusById(EDITOR_ID);
}

function openEdit(note: Note) {
  editingId.value = note.id;
  draft.value = note.content;
  actionError.value = null;
  focusById(EDITOR_ID);
}

function closeEditor() {
  const closed = editingId.value;
  editingId.value = null;
  draft.value = "";
  if (closed && closed !== "new") focusById(`note-edit-btn-${closed}`);
  else if (closed === "new") focusById("note-new-btn");
}

async function save() {
  const content = draft.value;
  if (!content.trim() || saving.value) return;
  saving.value = true;
  actionError.value = null;
  try {
    if (editingId.value === "new") await workspace.addNote(content);
    else if (editingId.value) await workspace.updateNote(editingId.value, content);
    closeEditor();
  } catch (err) {
    actionError.value = codeOf(err);
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  const note = pendingDelete.value;
  if (!note) return;
  deleting.value = true;
  actionError.value = null;
  try {
    await workspace.removeNote(note.id);
    if (editingId.value === note.id) closeEditor();
  } catch (err) {
    actionError.value = codeOf(err);
  } finally {
    deleting.value = false;
    pendingDelete.value = null;
  }
}
</script>

<template>
  <article
    class="rounded-[20px] bg-surface/90 px-6 py-5 shadow-card"
    aria-labelledby="study-notes-title"
  >
    <header class="flex items-center justify-between gap-4">
      <h2 id="study-notes-title" class="text-base font-semibold text-foreground">
        {{ t("studies.notes.title") }}
      </h2>
      <AppButton
        v-if="!readOnly && editingId === null && workspace.notesStatus === 'success'"
        id="note-new-btn"
        variant="text"
        color="primary"
        size="sm"
        prepend-icon="add"
        @click="openNew"
      >
        {{ t("studies.notes.add") }}
      </AppButton>
    </header>

    <div
      v-if="workspace.notesStatus === 'loading'"
      class="flex justify-center py-6"
    >
      <AppSpinner :label="t('studies.notes.loading')" />
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
      <form
        v-if="editingId !== null && !readOnly"
        class="mt-3 flex flex-col gap-2"
        @submit.prevent="save"
      >
        <AppTextarea
          :id="EDITOR_ID"
          v-model="draft"
          :label="t('studies.notes.contentLabel')"
          :hint="t('studies.notes.markdownHint')"
          :maxlength="NOTE_CONTENT_MAX"
          :rows="6"
        />
        <div class="flex justify-end gap-2">
          <AppButton
            variant="text"
            color="muted"
            size="sm"
            :disabled="saving"
            @click="closeEditor"
          >
            {{ t("studies.notes.cancel") }}
          </AppButton>
          <AppButton
            type="submit"
            size="sm"
            :loading="saving"
            :disabled="!draft.trim()"
          >
            {{ t("studies.notes.save") }}
          </AppButton>
        </div>
      </form>

      <p
        v-if="workspace.notes.length === 0 && editingId === null"
        class="mt-3 text-sm text-muted"
      >
        {{ t(readOnly ? "studies.notes.emptyReadOnly" : "studies.notes.empty") }}
      </p>

      <ul class="mt-3 flex flex-col gap-3">
        <li
          v-for="note in workspace.notes"
          v-show="editingId !== note.id"
          :key="note.id"
          class="rounded-xl bg-background/60 px-4 py-3"
          data-testid="study-note"
        >
          <!-- Safe: renderMarkdown escapes raw HTML and keeps only http(s) links. -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="study-note-content text-sm text-foreground" v-html="renderedNotes.get(note.id)" />
          <footer class="mt-2 flex items-center justify-between gap-2">
            <span class="text-xs text-muted">
              {{ t("studies.notes.updatedAt", { date: formatUpdatedAt(note.updatedAt) }) }}
            </span>
            <div v-if="!readOnly" class="flex items-center">
              <AppButton
                :id="`note-edit-btn-${note.id}`"
                variant="text"
                color="muted"
                size="sm"
                icon="edit"
                icon-only
                :aria-label="t('studies.notes.edit', { date: formatUpdatedAt(note.updatedAt) })"
                @click="openEdit(note)"
              />
              <AppButton
                variant="text"
                color="error"
                size="sm"
                icon="delete"
                icon-only
                :aria-label="t('studies.notes.remove', { date: formatUpdatedAt(note.updatedAt) })"
                @click="pendingDelete = note"
              />
            </div>
          </footer>
        </li>
      </ul>

      <AppAlert
        v-if="actionErrorMessage"
        class="mt-3"
        type="error"
        variant="tonal"
      >
        {{ actionErrorMessage }}
      </AppAlert>
    </template>

    <AppConfirmDialog
      v-model="confirmOpen"
      :title="t('studies.notes.confirmTitle')"
      :description="t('studies.notes.confirmDescription')"
      :confirm-label="t('studies.notes.confirmDelete')"
      :cancel-label="t('studies.notes.cancel')"
      confirm-icon="delete"
      :confirm-loading="deleting"
      @confirm="confirmDelete"
    />
  </article>
</template>

<style scoped>
.study-note-content :deep(:where(h1, h2, h3)) {
  font-weight: 600;
  margin-block: 0.5em 0.25em;
}
.study-note-content :deep(h1) {
  font-size: 1.125rem;
}
.study-note-content :deep(:where(p, ul, ol, pre, blockquote)) {
  margin-block: 0.4em;
}
.study-note-content :deep(ul) {
  list-style: disc;
  padding-inline-start: 1.25rem;
}
.study-note-content :deep(ol) {
  list-style: decimal;
  padding-inline-start: 1.25rem;
}
.study-note-content :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}
.study-note-content :deep(code) {
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
}
.study-note-content :deep(blockquote) {
  border-inline-start: 3px solid var(--color-light-grey);
  padding-inline-start: 0.75rem;
  color: var(--color-muted);
}
</style>
