<script setup lang="ts">
import { AppTextarea } from "@/shared/ui";

defineProps<{
  objective: string;
  label: string;
  heading: string;
  hint: string;
  placeholder: string;
}>();

const emit = defineEmits<{
  "update:objective": [value: string];
}>();
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="space-y-1">
      <h2 class="text-xl font-semibold text-foreground">{{ heading }}</h2>
      <p class="text-base text-muted">{{ hint }}</p>
    </div>
    <AppTextarea
      :model-value="objective"
      required
      :rows="5"
      :label="label"
      :placeholder="placeholder"
      @update:model-value="emit('update:objective', $event)"
    />
  </section>
</template>
