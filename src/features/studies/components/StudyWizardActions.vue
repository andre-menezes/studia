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
  <footer class="flex justify-end gap-3 border-t border-border px-6 py-4">
    <AppButton
      v-if="isFirst"
      variant="outlined"
      color="muted"
      @click="emit('cancel')"
    >
      {{ cancelLabel }}
    </AppButton>
    <AppButton v-else variant="outlined" color="muted" @click="emit('back')">
      {{ backLabel }}
    </AppButton>
    <AppButton v-if="!isLast" @click="emit('next')">
      {{ continueLabel }}
    </AppButton>
    <AppButton
      v-else
      :loading="pending"
      :disabled="pending"
      @click="emit('submit')"
    >
      {{ pending ? loadingLabel : submitLabel }}
    </AppButton>
  </footer>
</template>
