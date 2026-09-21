<script setup lang="ts">
import { AppTextField } from "@/shared/ui";

defineProps<{
  title: string;
  label: string;
  heading: string;
  hint: string;
  placeholder: string;
}>();

const emit = defineEmits<{
  "update:title": [value: string];
}>();
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="space-y-1">
      <h2 class="text-xl font-semibold text-foreground">{{ heading }}</h2>
      <p class="text-base text-muted">{{ hint }}</p>
    </div>
    <AppTextField
      :model-value="title"
      required
      prepend-icon="badge"
      :label="label"
      :placeholder="placeholder"
      @update:model-value="emit('update:title', $event)"
    />
  </section>
</template>
