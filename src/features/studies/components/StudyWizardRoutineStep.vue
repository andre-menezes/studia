<script setup lang="ts">
import { AppTextField } from "@/shared/ui";

defineProps<{
  frequency: string;
  notes: string;
  frequencyLabel: string;
  notesLabel: string;
  heading: string;
  hint: string;
  frequencyPlaceholder: string;
  notesPlaceholder: string;
}>();

const emit = defineEmits<{
  "update:frequency": [value: string];
  "update:notes": [value: string];
}>();
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="space-y-1">
      <h2 class="text-xl font-semibold text-foreground">{{ heading }}</h2>
      <p class="text-base text-muted">{{ hint }}</p>
    </div>
    <AppTextField
      :model-value="frequency"
      required
      :label="frequencyLabel"
      :placeholder="frequencyPlaceholder"
      @update:model-value="emit('update:frequency', $event)"
    />
    <AppTextField
      :model-value="notes"
      :label="notesLabel"
      :placeholder="notesPlaceholder"
      @update:model-value="emit('update:notes', $event)"
    />
  </section>
</template>
