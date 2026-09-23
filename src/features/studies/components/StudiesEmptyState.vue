<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { AppButton } from "@/shared/ui";

defineProps<{
  emptyTitle: string;
  emptyMessage: string;
  createLabel: string;
  canCreate: boolean;
  createLimitMessage?: string | null;
}>();

const emit = defineEmits<{
  create: [];
}>();

const { t } = useI18n();

const benefits = [
  { icon: "flag", key: "objective" as const },
  { icon: "calendar_month", key: "routine" as const },
  { icon: "view_kanban", key: "board" as const },
];

const previewColumns = [
  { status: "CREATED" as const, accent: "bg-accent/15" },
  { status: "STARTED" as const, accent: "bg-secondary/15" },
  { status: "PAUSED" as const, accent: "bg-muted/10" },
];
</script>

<template>
  <section
    class="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-surface/80 shadow-card backdrop-blur-sm"
    aria-labelledby="studies-empty-title"
  >
    <div
      class="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="absolute -top-20 right-0 size-56 rounded-full bg-accent/10 blur-3xl sm:size-72"
      />
      <div
        class="absolute bottom-0 -left-16 size-48 rounded-full bg-secondary/10 blur-3xl sm:size-64"
      />
      <div
        class="absolute top-1/2 right-1/4 size-40 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"
      />
    </div>

    <div
      class="relative z-10 grid min-h-0 flex-1 items-center gap-8 px-5 py-8 sm:gap-10 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:px-12 lg:py-12"
    >
      <div class="mx-auto flex w-full max-w-xl flex-col gap-6 lg:mx-0">
        <div class="flex flex-col gap-3">
          <p
            class="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-variant px-3 py-1 text-xs font-medium tracking-wide text-accent uppercase"
          >
            <span
              class="material-symbols-outlined text-[16px] leading-none"
              aria-hidden="true"
            >
              view_kanban
            </span>
            {{ t("studies.home.emptyEyebrow") }}
          </p>

          <h1
            id="studies-empty-title"
            class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            {{ emptyTitle }}
          </h1>

          <p class="max-w-md text-base leading-relaxed text-muted sm:text-lg">
            {{ emptyMessage }}
          </p>
        </div>

        <ul class="flex flex-col gap-3" role="list">
          <li
            v-for="benefit in benefits"
            :key="benefit.key"
            class="flex items-start gap-3"
          >
            <span
              class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-variant text-accent"
              aria-hidden="true"
            >
              <span class="material-symbols-outlined text-[18px] leading-none">
                {{ benefit.icon }}
              </span>
            </span>
            <span class="text-sm leading-snug text-foreground sm:text-base">
              {{ t(`studies.home.emptyBenefits.${benefit.key}`) }}
            </span>
          </li>
        </ul>

        <div class="flex flex-col gap-3 pt-1">
          <AppButton
            v-if="canCreate"
            size="lg"
            color="accent"
            prepend-icon="add"
            class="w-full sm:w-auto"
            @click="emit('create')"
          >
            {{ createLabel }}
          </AppButton>
          <p
            v-else-if="createLimitMessage"
            class="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning"
            role="status"
          >
            {{ createLimitMessage }}
          </p>
        </div>
      </div>

      <div
        class="mx-auto hidden w-full max-w-md sm:block lg:mx-0 lg:max-w-none"
        aria-hidden="true"
      >
        <div
          class="rounded-[20px] border border-border/50 bg-background/60 p-4 shadow-card sm:p-5"
        >
          <div class="mb-4 flex items-center justify-between gap-2">
            <span class="text-xs font-medium tracking-wide text-muted uppercase">
              {{ t("studies.home.emptyPreviewLabel") }}
            </span>
            <span
              class="rounded-full bg-surface-variant px-2 py-0.5 text-[10px] font-medium text-muted tabular-nums"
            >
              0
            </span>
          </div>

          <div class="flex gap-3 overflow-hidden">
            <div
              v-for="column in previewColumns"
              :key="column.status"
              class="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl bg-surface/80 p-2.5"
            >
              <div class="flex items-center justify-between gap-1 px-0.5">
                <span
                  class="truncate text-[10px] font-medium tracking-wide text-muted uppercase"
                >
                  {{ t(`studies.status.${column.status}`) }}
                </span>
                <span
                  class="size-1.5 shrink-0 rounded-full"
                  :class="column.accent"
                />
              </div>
              <div
                class="flex min-h-16 flex-col justify-center rounded-xl border border-dashed border-border/70 px-2 py-3 text-center"
              >
                <span
                  class="material-symbols-outlined mx-auto text-[20px] text-muted/50"
                >
                  add
                </span>
              </div>
              <div
                class="h-10 rounded-xl border border-dashed border-border/40 bg-surface-variant/40"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
