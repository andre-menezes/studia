<script setup lang="ts">
import { computed, onBeforeUnmount } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { AppBadge, AppButton } from "@/shared/ui";
import type { StudyStatus } from "../domain/study";
import { isStudyDraggable } from "../domain/studyStatusTransitions";
import { studyStatusTone } from "./studyStatusUi";

const props = defineProps<{
  studyId: string;
  title: string;
  objective: string;
  status: StudyStatus;
  highlighted?: boolean;
  canStart?: boolean;
  starting?: boolean;
  dragging?: boolean;
  dropBefore?: boolean;
  dropAfter?: boolean;
  acceptDragOver?: boolean;
  /** Source of truth while a board drag is active (parent). */
  draggingStudyId?: string | null;
  draggingFromStatus?: StudyStatus | null;
}>();

const emit = defineEmits<{
  start: [];
  "drag-start": [payload: { studyId: string; status: StudyStatus }];
  "drag-end": [];
  "card-drag-over": [
    payload: { studyId: string; place: "before" | "after" },
  ];
  "card-drop": [
    payload: {
      targetStudyId: string;
      place: "before" | "after";
      draggedStudyId: string;
      fromStatus: StudyStatus;
    },
  ];
}>();

const { t } = useI18n();

const statusTone = computed(() => studyStatusTone(props.status));
const statusLabel = computed(() =>
  t(`studies.status.${props.status}`, props.status),
);
const showStart = computed(() => props.status === "CREATED");
const draggable = computed(() => isStudyDraggable(props.status));

let dragGhost: HTMLElement | null = null;

function clearDragGhost() {
  dragGhost?.remove();
  dragGhost = null;
}

function onDragStart(event: DragEvent) {
  if (!draggable.value || !event.dataTransfer) return;
  const card = event.currentTarget as HTMLElement;
  const rect = card.getBoundingClientRect();

  clearDragGhost();
  dragGhost = card.cloneNode(true) as HTMLElement;
  dragGhost.classList.add("is-drag-ghost");
  dragGhost.classList.remove("is-dragging");
  dragGhost.setAttribute("aria-hidden", "true");
  dragGhost.style.width = `${rect.width}px`;
  dragGhost.style.height = `${rect.height}px`;
  document.body.appendChild(dragGhost);

  const offsetX = Math.min(
    Math.max(event.clientX - rect.left, 16),
    rect.width - 16,
  );
  const offsetY = Math.min(
    Math.max(event.clientY - rect.top, 16),
    rect.height - 16,
  );
  event.dataTransfer.setDragImage(dragGhost, offsetX, offsetY);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "application/x-studia-study",
    JSON.stringify({ studyId: props.studyId, status: props.status }),
  );
  event.dataTransfer.setData("text/plain", props.studyId);
  emit("drag-start", { studyId: props.studyId, status: props.status });
}

function onDragEnd() {
  clearDragGhost();
  emit("drag-end");
}

function placeFromEvent(event: DragEvent): "before" | "after" {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
}

function onCardDragOver(event: DragEvent) {
  if (!props.acceptDragOver || props.dragging) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  emit("card-drag-over", {
    studyId: props.studyId,
    place: placeFromEvent(event),
  });
}

function onCardDrop(event: DragEvent) {
  if (!props.acceptDragOver || props.dragging) return;
  event.preventDefault();
  event.stopPropagation();

  // Prefer parent drag session — never infer fromStatus from the drop target card.
  let draggedStudyId = props.draggingStudyId ?? "";
  let fromStatus = props.draggingFromStatus ?? null;

  const raw =
    event.dataTransfer?.getData("application/x-studia-study") ||
    event.dataTransfer?.getData("text/plain");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        studyId?: string;
        status?: StudyStatus;
      };
      if (parsed.studyId) draggedStudyId = parsed.studyId;
      if (parsed.status) fromStatus = parsed.status;
    } catch {
      // text/plain is only the study id — keep fromStatus from parent session
      if (!draggedStudyId) draggedStudyId = raw;
    }
  }

  if (!draggedStudyId || !fromStatus) return;

  emit("card-drop", {
    targetStudyId: props.studyId,
    place: placeFromEvent(event),
    draggedStudyId,
    fromStatus,
  });
}

onBeforeUnmount(clearDragGhost);
</script>

<template>
  <li class="relative">
    <div
      v-if="dropBefore"
      class="kanban-drop-indicator"
      aria-hidden="true"
    />
    <div
      class="kanban-card rounded-[20px] bg-surface/90 px-5 py-4 shadow-card hover:bg-surface"
      :class="[
        highlighted ? 'ring-2 ring-inset ring-accent/40' : '',
        draggable ? 'is-draggable' : '',
        dragging ? 'is-dragging' : '',
      ]"
      :draggable="draggable"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
      @dragover="onCardDragOver"
      @drop="onCardDrop"
    >
      <RouterLink
        :to="{ name: 'studies-detail', params: { studyId } }"
        class="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        :tabindex="dragging ? -1 : 0"
        @click="(e: MouseEvent) => {
          if (dragging) e.preventDefault();
        }"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-base font-medium text-foreground">{{ title }}</p>
            <p class="mt-1 line-clamp-2 text-sm text-muted">{{ objective }}</p>
          </div>
          <AppBadge :tone="statusTone" variant="outlined" size="sm">
            {{ statusLabel }}
          </AppBadge>
        </div>
      </RouterLink>

      <div v-if="showStart" class="mt-3 flex justify-end">
        <AppButton
          size="sm"
          variant="tonal"
          color="primary"
          prepend-icon="play_arrow"
          icon-fill
          :loading="starting"
          :disabled="starting || canStart === false"
          @click.stop="emit('start')"
        >
          {{ t("studies.home.start") }}
        </AppButton>
      </div>
      <p
        v-if="showStart && canStart === false"
        class="mt-2 text-xs text-error"
      >
        {{ t("errors.STUDY_ACTIVE_LIMIT_REACHED") }}
      </p>
    </div>
    <div
      v-if="dropAfter"
      class="kanban-drop-indicator"
      aria-hidden="true"
    />
  </li>
</template>
