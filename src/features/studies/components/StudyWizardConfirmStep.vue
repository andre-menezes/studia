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
  <section class="flex flex-col gap-4">
    <h2 class="text-base font-semibold text-foreground">{{ heading }}</h2>
    <dl class="flex flex-col gap-3">
      <div
        class="flex items-start justify-between gap-3 border-b border-border/60 pb-3"
      >
        <div>
          <dt class="text-xs text-muted">{{ titleLabel }}</dt>
          <dd class="text-sm text-foreground">{{ title }}</dd>
        </div>
        <AppButton
          variant="text"
          color="accent"
          size="sm"
          @click="emit('edit', 'title')"
        >
          {{ editLabel }}
        </AppButton>
      </div>
      <div
        class="flex items-start justify-between gap-3 border-b border-border/60 pb-3"
      >
        <div>
          <dt class="text-xs text-muted">{{ objectiveLabel }}</dt>
          <dd class="text-sm text-foreground">{{ objective }}</dd>
        </div>
        <AppButton
          variant="text"
          color="accent"
          size="sm"
          @click="emit('edit', 'objective')"
        >
          {{ editLabel }}
        </AppButton>
      </div>
      <div class="flex items-start justify-between gap-3">
        <div>
          <dt class="text-xs text-muted">{{ frequencyLabel }}</dt>
          <dd class="text-sm text-foreground">
            {{ frequency }}<span v-if="notes"> · {{ notes }}</span>
          </dd>
        </div>
        <AppButton
          variant="text"
          color="accent"
          size="sm"
          @click="emit('edit', 'frequency')"
        >
          {{ editLabel }}
        </AppButton>
      </div>
    </dl>
    <p
      v-if="usageLabel"
      class="rounded-lg bg-surface-variant px-3 py-2 text-xs text-muted"
    >
      {{ usageLabel }}
    </p>
  </section>
</template>
