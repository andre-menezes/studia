<script setup lang="ts">
import { computed, ref } from "vue";
import { AppButton } from "@/shared/ui";
import type { Study, StudyStatus } from "../domain/study";
import { canDropStudyOnColumn } from "../domain/studyStatusTransitions";
import StudyListItem from "./StudyListItem.vue";

const props = defineProps<{
  status: StudyStatus;
  title: string;
  count: number;
  studies: Study[];
  highlightedId?: string | null;
  canStart?: boolean;
  startingId?: string | null;
  emptyLabel: string;
  draggingStudyId?: string | null;
  draggingFromStatus?: StudyStatus | null;
  showCreate?: boolean;
  createLabel?: string;
  createLimitMessage?: string | null;
}>();

const emit = defineEmits<{
  start: [studyId: string];
  create: [];
  "drag-start": [payload: { studyId: string; status: StudyStatus }];
  "drag-end": [];
  drop: [
    payload: {
      studyId: string;
      fromStatus: StudyStatus;
      toStatus: StudyStatus;
      beforeStudyId: string | null;
    },
  ];
}>();

const isCreatedColumn = computed(() => props.status === "CREATED");
const showCreateAction = computed(
  () => isCreatedColumn.value && props.showCreate === true,
);
const showCreateLimit = computed(
  () =>
    isCreatedColumn.value &&
    Boolean(props.createLimitMessage) &&
    props.showCreate !== true,
);

const isOver = ref(false);
const indicator = ref<{
  studyId: string;
  place: "before" | "after";
} | null>(null);

const acceptsDrop = computed(() => {
  if (!props.draggingFromStatus) return true;
  return canDropStudyOnColumn(props.draggingFromStatus, props.status);
});

const isSourceColumn = computed(
  () => props.draggingFromStatus === props.status,
);

const dropDisabled = computed(
  () =>
    Boolean(props.draggingFromStatus) &&
    !acceptsDrop.value &&
    !isSourceColumn.value,
);

const isDropTarget = computed(
  () =>
    Boolean(props.draggingFromStatus) &&
    acceptsDrop.value &&
    !isSourceColumn.value,
);

const acceptCardDrag = computed(
  () => Boolean(props.draggingFromStatus) && acceptsDrop.value,
);

function clearIndicator() {
  indicator.value = null;
  isOver.value = false;
}

function parseDragPayload(event: DragEvent): {
  studyId: string;
  fromStatus: StudyStatus;
} | null {
  if (!props.draggingFromStatus) return null;
  const raw =
    event.dataTransfer?.getData("application/x-studia-study") ||
    event.dataTransfer?.getData("text/plain");
  if (!raw) {
    return {
      studyId: props.draggingStudyId ?? "",
      fromStatus: props.draggingFromStatus,
    };
  }

  let studyId = raw;
  let fromStatus = props.draggingFromStatus;
  try {
    const parsed = JSON.parse(raw) as {
      studyId?: string;
      status?: StudyStatus;
    };
    if (parsed.studyId) studyId = parsed.studyId;
    if (parsed.status) fromStatus = parsed.status;
  } catch {
    /* text/plain id only */
  }

  if (!studyId) return null;
  return { studyId, fromStatus };
}

function beforeIdFromPlace(
  targetStudyId: string,
  place: "before" | "after",
): string | null {
  if (place === "before") return targetStudyId;
  const index = props.studies.findIndex((s) => s.id === targetStudyId);
  if (index === -1) return null;
  return props.studies[index + 1]?.id ?? null;
}

function emitDrop(
  studyId: string,
  fromStatus: StudyStatus,
  beforeStudyId: string | null,
) {
  if (!canDropStudyOnColumn(fromStatus, props.status)) return;
  if (studyId === beforeStudyId) return;
  emit("drop", {
    studyId,
    fromStatus,
    toStatus: props.status,
    beforeStudyId,
  });
}

function onDragOver(event: DragEvent) {
  if (!props.draggingFromStatus || !acceptsDrop.value) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  isOver.value = true;
  if (props.studies.length === 0) {
    indicator.value = null;
  }
}

function onDragLeave(event: DragEvent) {
  const current = event.currentTarget as HTMLElement | null;
  const related = event.relatedTarget as Node | null;
  if (current && related && current.contains(related)) return;
  clearIndicator();
}

function onColumnDrop(event: DragEvent) {
  const payload = parseDragPayload(event);
  clearIndicator();
  if (!payload || !acceptsDrop.value) return;
  event.preventDefault();
  emitDrop(payload.studyId, payload.fromStatus, null);
}

function onCardDragOver(payload: {
  studyId: string;
  place: "before" | "after";
}) {
  if (!acceptCardDrag.value) return;
  if (payload.studyId === props.draggingStudyId) {
    indicator.value = null;
    return;
  }
  isOver.value = true;
  indicator.value = payload;
}

function onCardDrop(payload: {
  targetStudyId: string;
  place: "before" | "after";
  draggedStudyId: string;
  fromStatus: StudyStatus;
}) {
  clearIndicator();
  if (!acceptsDrop.value) return;
  if (payload.targetStudyId === payload.draggedStudyId) return;
  emitDrop(
    payload.draggedStudyId,
    payload.fromStatus,
    beforeIdFromPlace(payload.targetStudyId, payload.place),
  );
}

function onDragEnd() {
  clearIndicator();
  emit("drag-end");
}

function dropBeforeFor(studyId: string) {
  return (
    indicator.value?.studyId === studyId && indicator.value.place === "before"
  );
}

function dropAfterFor(studyId: string) {
  return (
    indicator.value?.studyId === studyId && indicator.value.place === "after"
  );
}
</script>

<template>
  <section
    class="kanban-column flex h-full min-h-0 w-[min(100%,20rem)] shrink-0 flex-col rounded-[20px] bg-surface/70 shadow-card backdrop-blur-sm sm:w-80"
    :class="{
      'is-drop-disabled': dropDisabled,
      'is-drop-target': isDropTarget,
      'is-drop-over': isOver && acceptsDrop,
    }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onColumnDrop"
  >
    <header
      class="flex shrink-0 items-center justify-between gap-2 px-4 pt-4 pb-3"
    >
      <h2 class="text-sm font-medium tracking-wide text-muted uppercase">
        {{ title }}
      </h2>
      <div class="flex items-center gap-1.5">
        <AppButton
          v-if="showCreateAction"
          color="accent"
          variant="text"
          size="sm"
          icon="add"
          icon-only
          class="cursor-pointer"
          :aria-label="createLabel"
          @click="emit('create')"
        />
        <span
          class="rounded-full bg-surface-variant px-2 py-0.5 text-xs font-medium text-muted tabular-nums"
        >
          {{ count }}
        </span>
      </div>
    </header>

    <ul
      class="kanban-column-list studia-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pt-1 pb-4"
    >
      <TransitionGroup name="kanban-item">
        <StudyListItem
          v-for="study in studies"
          :key="study.id"
          :study-id="study.id"
          :title="study.title"
          :objective="study.objective"
          :status="study.status"
          :highlighted="study.id === highlightedId"
          :can-start="canStart"
          :starting="startingId === study.id"
          :dragging="draggingStudyId === study.id"
          :dragging-study-id="draggingStudyId"
          :dragging-from-status="draggingFromStatus"
          :drop-before="dropBeforeFor(study.id)"
          :drop-after="dropAfterFor(study.id)"
          :accept-drag-over="acceptCardDrag"
          @start="emit('start', study.id)"
          @drag-start="emit('drag-start', $event)"
          @drag-end="onDragEnd"
          @card-drag-over="onCardDragOver"
          @card-drop="onCardDrop"
        />
      </TransitionGroup>
      <li
        v-if="studies.length === 0 && !showCreateAction"
        class="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted"
      >
        {{ emptyLabel }}
      </li>
      <li v-if="showCreateAction" class="shrink-0">
        <AppButton
          color="accent"
          variant="tonal"
          size="sm"
          block
          prepend-icon="add"
          class="rounded-2xl"
          @click="emit('create')"
        >
          {{ createLabel }}
        </AppButton>
      </li>
      <li v-else-if="showCreateLimit" class="shrink-0 px-1">
        <p class="rounded-2xl bg-warning/10 px-3 py-2 text-center text-xs text-warning">
          {{ createLimitMessage }}
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.kanban-item-enter-active,
.kanban-item-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.kanban-item-enter-from,
.kanban-item-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.kanban-item-move {
  transition: transform 180ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .kanban-item-enter-active,
  .kanban-item-leave-active,
  .kanban-item-move {
    transition: none;
  }

  .kanban-item-enter-from,
  .kanban-item-leave-to {
    transform: none;
  }
}
</style>
