<script setup lang="ts">
import { AppButton } from "@/shared/ui";

defineProps<{
  successTitle: string;
  successSubtitle: string;
  viewLabel: string;
  createAnotherLabel: string;
}>();

const emit = defineEmits<{
  view: [];
  createAnother: [];
}>();
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-6 py-10 text-center">
    <span
      class="flex h-14 w-14 items-center justify-center rounded-full bg-success-variant text-2xl font-semibold text-success"
      aria-hidden="true"
    >
      ✓
    </span>
    <div>
      <h2 class="text-lg font-semibold text-foreground">{{ successTitle }}</h2>
      <p class="text-sm text-muted">{{ successSubtitle }}</p>
    </div>
    <AppButton block @click="emit('view')">
      {{ viewLabel }}
    </AppButton>
    <AppButton variant="text" color="accent" @click="emit('createAnother')">
      {{ createAnotherLabel }}
    </AppButton>
  </div>
</template>
