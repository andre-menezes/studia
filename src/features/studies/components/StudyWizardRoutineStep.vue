<script setup lang="ts">
import { ref } from "vue";
import type {
  StudyPomodoro,
  StudyRoutineTime,
  WeekDay,
} from "../domain/studyRoutine";
import StudyRoutineFields from "./StudyRoutineFields.vue";

defineProps<{
  days: WeekDay[];
  time: StudyRoutineTime;
  notes: string;
  pomodoro: StudyPomodoro;
  heading: string;
  hint: string;
  daysLabel: string;
  timeLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  timeHint?: string;
}>();

const emit = defineEmits<{
  "update:days": [value: WeekDay[]];
  "update:time": [value: StudyRoutineTime];
  "update:notes": [value: string];
  "update:pomodoro": [value: StudyPomodoro];
}>();

const fieldsRef = ref<{ flush: () => StudyRoutineTime } | null>(null);

function flush(): StudyRoutineTime | undefined {
  return fieldsRef.value?.flush();
}

defineExpose({ flush });
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="space-y-1">
      <h2 class="text-xl font-semibold text-foreground">{{ heading }}</h2>
      <p class="text-base text-muted">{{ hint }}</p>
    </div>
    <StudyRoutineFields
      ref="fieldsRef"
      :days="days"
      :time="time"
      :notes="notes"
      :pomodoro="pomodoro"
      required
      :days-label="daysLabel"
      :time-label="timeLabel"
      :notes-label="notesLabel"
      :notes-placeholder="notesPlaceholder"
      :time-hint="timeHint"
      @update:days="emit('update:days', $event)"
      @update:time="emit('update:time', $event)"
      @update:notes="emit('update:notes', $event)"
      @update:pomodoro="emit('update:pomodoro', $event)"
    />
  </section>
</template>
