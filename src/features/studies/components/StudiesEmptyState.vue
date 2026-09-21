<script setup lang="ts">
import { AppButton, AppEmptyState } from "@/shared/ui";

defineProps<{
  emptyTitle: string;
  emptyMessage: string;
  createLabel: string;
  canCreate: boolean;
}>();

const emit = defineEmits<{
  create: [];
}>();
</script>

<template>
  <AppEmptyState
    bordered
    :title="emptyTitle"
    :description="emptyMessage"
    icon="menu_book"
  >
    <template v-if="canCreate" #actions>
      <AppButton size="lg" prepend-icon="add" @click="emit('create')">
        {{ createLabel }}
      </AppButton>
    </template>
  </AppEmptyState>
</template>
