<script setup lang="ts">
import { AppButton } from "@/shared/ui";

defineProps<{
  title: string;
  objective: string;
  frequency: string;
  notes: string;
  titleLabel: string;
  objectiveLabel: string;
  frequencyLabel: string;
  editLabel: string;
  heading: string;
  usageLabel: string | null;
}>();

const emit = defineEmits<{
  edit: [field: "title" | "objective" | "frequency"];
}>();
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="space-y-1">
      <h2 class="text-xl font-semibold text-foreground">{{ heading }}</h2>
    </div>
    <dl class="flex flex-col gap-3">
      <div
        class="flex items-start justify-between gap-4 rounded-2xl bg-surface-variant/60 px-4 py-4"
      >
        <div class="min-w-0">
          <dt class="text-sm text-muted">{{ titleLabel }}</dt>
          <dd class="mt-0.5 text-base text-foreground">{{ title }}</dd>
        </div>
        <AppButton
          variant="text"
          color="accent"
          size="sm"
          prepend-icon="edit"
          @click="emit('edit', 'title')"
        >
          {{ editLabel }}
        </AppButton>
      </div>
      <div
        class="flex items-start justify-between gap-4 rounded-2xl bg-surface-variant/60 px-4 py-4"
      >
        <div class="min-w-0">
          <dt class="text-sm text-muted">{{ objectiveLabel }}</dt>
          <dd class="mt-0.5 text-base text-foreground">{{ objective }}</dd>
        </div>
        <AppButton
          variant="text"
          color="accent"
          size="sm"
          prepend-icon="edit"
          @click="emit('edit', 'objective')"
        >
          {{ editLabel }}
        </AppButton>
      </div>
      <div
        class="flex items-start justify-between gap-4 rounded-2xl bg-surface-variant/60 px-4 py-4"
      >
        <div class="min-w-0">
          <dt class="text-sm text-muted">{{ frequencyLabel }}</dt>
          <dd class="mt-0.5 text-base text-foreground">
            {{ frequency }}<span v-if="notes"> · {{ notes }}</span>
          </dd>
        </div>
        <AppButton
          variant="text"
          color="accent"
          size="sm"
          prepend-icon="edit"
          @click="emit('edit', 'frequency')"
        >
          {{ editLabel }}
        </AppButton>
      </div>
    </dl>
    <p
      v-if="usageLabel"
      class="rounded-2xl bg-accent-variant px-4 py-3 text-sm text-foreground"
    >
      {{ usageLabel }}
    </p>
  </section>
</template>
