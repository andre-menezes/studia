<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { AppBadge, AppButton } from "@/shared/ui";
import type { StudyStatus } from "../domain/study";
import { studyStatusTone } from "./studyStatusUi";

const props = defineProps<{
  studyId: string;
  title: string;
  objective: string;
  status: StudyStatus;
  highlighted?: boolean;
  canStart?: boolean;
  starting?: boolean;
}>();

const emit = defineEmits<{
  start: [];
}>();

const { t } = useI18n();

const statusTone = computed(() => studyStatusTone(props.status));
const statusLabel = computed(() =>
  t(`studies.status.${props.status}`, props.status),
);
const showStart = computed(() => props.status === "CREATED");
</script>

<template>
  <li>
    <div
      class="rounded-[20px] bg-surface/90 px-5 py-4 shadow-card transition hover:bg-surface"
      :class="highlighted ? 'ring-2 ring-accent/40' : ''"
    >
      <RouterLink
        :to="{ name: 'studies-detail', params: { studyId } }"
        class="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-base font-medium text-foreground">{{ title }}</p>
            <p class="mt-1 line-clamp-2 text-sm text-muted">{{ objective }}</p>
          </div>
          <AppBadge :tone="statusTone" variant="outlined" size="sm">
            {{ statusLabel }}
          </AppBadge>
        </div>
      </RouterLink>

      <div v-if="showStart" class="mt-3 flex justify-end">
        <AppButton
          size="sm"
          color="primary"
          prepend-icon="play_arrow"
          :loading="starting"
          :disabled="starting || canStart === false"
          @click.stop="emit('start')"
        >
          {{ t("studies.home.start") }}
        </AppButton>
      </div>
      <p
        v-if="showStart && canStart === false"
        class="mt-2 text-xs text-error"
      >
        {{ t("errors.STUDY_ACTIVE_LIMIT_REACHED") }}
      </p>
    </div>
  </li>
</template>
