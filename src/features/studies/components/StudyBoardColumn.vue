<script setup lang="ts">
import type { Study } from "../domain/study";
import StudyListItem from "./StudyListItem.vue";

defineProps<{
  title: string;
  count: number;
  studies: Study[];
  highlightedId?: string | null;
  canStart?: boolean;
  startingId?: string | null;
  emptyLabel: string;
}>();

const emit = defineEmits<{
  start: [studyId: string];
}>();
</script>

<template>
  <section
    class="flex h-full min-h-0 w-[min(100%,20rem)] shrink-0 flex-col rounded-[20px] bg-surface/70 shadow-card backdrop-blur-sm sm:w-80"
  >
    <header
      class="flex shrink-0 items-center justify-between gap-2 px-4 pt-4 pb-3"
    >
      <h2 class="text-sm font-medium tracking-wide text-muted uppercase">
        {{ title }}
      </h2>
      <span
        class="rounded-full bg-surface-variant px-2 py-0.5 text-xs font-medium text-muted tabular-nums"
      >
        {{ count }}
      </span>
    </header>

    <ul
      class="studia-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4"
    >
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
        @start="emit('start', study.id)"
      />
      <li
        v-if="studies.length === 0"
        class="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted"
      >
        {{ emptyLabel }}
      </li>
    </ul>
  </section>
</template>
