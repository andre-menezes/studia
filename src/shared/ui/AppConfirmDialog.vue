<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import AppButton, { type AppButtonColor } from "./AppButton.vue";
import AppModal from "./AppModal.vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    description?: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmColor?: AppButtonColor;
    confirmLoading?: boolean;
    /** Material Symbols Outlined ligature prepended on the confirm button. */
    confirmIcon?: string;
    /** Material Symbols Outlined ligature prepended on the cancel button. */
    cancelIcon?: string;
    ariaLabel?: string;
  }>(),
  {
    confirmColor: "error",
    confirmLoading: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const cancelRef = ref<InstanceType<typeof AppButton> | null>(null);

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    await nextTick();
    const el = cancelRef.value?.$el as HTMLElement | undefined;
    el?.focus?.();
  },
);

function onCancel() {
  emit("update:modelValue", false);
  emit("cancel");
}

function onConfirm() {
  emit("confirm");
}

function onModalClose() {
  emit("cancel");
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    :aria-label="ariaLabel ?? title"
    @update:model-value="emit('update:modelValue', $event)"
    @close="onModalClose"
  >
    <div
      class="overflow-hidden rounded-[20px] border border-border bg-surface p-6 shadow-card sm:p-8"
    >
      <h2 class="text-xl font-semibold tracking-tight text-foreground">
        {{ title }}
      </h2>
      <div class="mt-2 text-base leading-relaxed text-muted">
        <slot>
          <p v-if="description">{{ description }}</p>
        </slot>
      </div>
      <div class="mt-6 flex flex-wrap items-center justify-end gap-3">
        <AppButton
          ref="cancelRef"
          variant="outlined"
          color="muted"
          :prepend-icon="cancelIcon"
          :disabled="confirmLoading"
          @click="onCancel"
        >
          {{ cancelLabel }}
        </AppButton>
        <AppButton
          :color="confirmColor"
          :prepend-icon="confirmIcon"
          :loading="confirmLoading"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>
