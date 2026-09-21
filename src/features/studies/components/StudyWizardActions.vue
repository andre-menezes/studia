<script setup lang="ts">
import { AppButton } from "@/shared/ui";

defineProps<{
  isFirst: boolean;
  isLast: boolean;
  pending: boolean;
  backLabel: string;
  cancelLabel: string;
  continueLabel: string;
  submitLabel: string;
  loadingLabel: string;
}>();

const emit = defineEmits<{
  back: [];
  cancel: [];
  next: [];
  submit: [];
}>();
</script>

<template>
  <footer
    class="flex flex-wrap items-center justify-between gap-3 px-6 pt-2 pb-7 sm:px-8 sm:pb-8"
  >
    <AppButton
      v-if="isFirst"
      variant="outlined"
      color="muted"
      size="lg"
      prepend-icon="close"
      @click="emit('cancel')"
    >
      {{ cancelLabel }}
    </AppButton>
    <AppButton
      v-else
      variant="outlined"
      color="muted"
      size="lg"
      prepend-icon="arrow_back"
      @click="emit('back')"
    >
      {{ backLabel }}
    </AppButton>
    <AppButton
      v-if="!isLast"
      size="lg"
      append-icon="arrow_forward"
      @click="emit('next')"
    >
      {{ continueLabel }}
    </AppButton>
    <AppButton
      v-else
      size="lg"
      prepend-icon="add"
      :loading="pending"
      :disabled="pending"
      @click="emit('submit')"
    >
      {{ pending ? loadingLabel : submitLabel }}
    </AppButton>
  </footer>
</template>
