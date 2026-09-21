<script setup lang="ts">
import { computed } from "vue";

export type AppStepperItem = {
  value: string | number;
  title: string;
  /** Material Symbols Outlined name shown when the step is not complete. */
  icon?: string;
};

const props = withDefaults(
  defineProps<{
    items: AppStepperItem[];
    modelValue: string | number;
    furthestIndex?: number;
    ariaLabel?: string;
  }>(),
  {
    ariaLabel: "Steps",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
}>();

const currentIndex = computed(() =>
  props.items.findIndex((item) => item.value === props.modelValue),
);

const maxReachableIndex = computed(
  () => props.furthestIndex ?? Math.max(props.items.length - 1, 0),
);

type StepState = "complete" | "current" | "upcoming" | "editable";

function stateOf(index: number): StepState {
  if (index === currentIndex.value) return "current";
  if (index > maxReachableIndex.value) return "upcoming";
  if (index < currentIndex.value) return "complete";
  return "editable";
}

function isReachable(index: number): boolean {
  return index <= maxReachableIndex.value;
}

function connectorFilled(leftIndex: number): boolean {
  return leftIndex < currentIndex.value;
}

function selectStep(item: AppStepperItem, index: number): void {
  if (!isReachable(index) || item.value === props.modelValue) return;
  emit("update:modelValue", item.value);
}

function glyphFor(
  item: AppStepperItem,
  index: number,
): { kind: "icon" | "number"; value: string } {
  if (stateOf(index) === "complete") {
    return { kind: "icon", value: "check" };
  }
  if (item.icon) {
    return { kind: "icon", value: item.icon };
  }
  return { kind: "number", value: String(index + 1) };
}
</script>

<template>
  <nav :aria-label="ariaLabel">
    <ol class="m-0 flex w-full list-none items-start p-0">
      <li
        v-for="(item, index) in items"
        :key="String(item.value)"
        class="relative flex min-w-0 flex-1 flex-col items-center"
      >
        <div
          v-if="index < items.length - 1"
          aria-hidden="true"
          class="pointer-events-none absolute top-[1.125rem] left-1/2 z-0 h-0.5 w-full transition-colors duration-300"
          :class="connectorFilled(index) ? 'bg-accent' : 'bg-border'"
        />

        <button
          type="button"
          class="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed"
          :class="{
            'bg-accent text-on-accent': stateOf(index) === 'complete',
            'bg-accent text-on-accent ring-2 ring-accent/40 ring-offset-2 ring-offset-background':
              stateOf(index) === 'current',
            'border-2 border-accent bg-accent-variant text-accent':
              stateOf(index) === 'editable',
            'border border-border bg-surface-variant text-muted':
              stateOf(index) === 'upcoming',
          }"
          :disabled="!isReachable(index)"
          :aria-current="stateOf(index) === 'current' ? 'step' : undefined"
          :aria-label="item.title"
          @click="selectStep(item, index)"
        >
          <template v-for="glyph in [glyphFor(item, index)]" :key="glyph.value">
            <span
              v-if="glyph.kind === 'icon'"
              class="material-symbols-outlined text-[18px] leading-none"
              aria-hidden="true"
            >
              {{ glyph.value }}
            </span>
            <span v-else aria-hidden="true">{{ glyph.value }}</span>
          </template>
        </button>

        <span
          class="mt-2 max-w-full px-1 text-center text-sm leading-snug"
          :class="
            stateOf(index) === 'current'
              ? 'font-medium text-foreground'
              : stateOf(index) === 'upcoming'
                ? 'text-muted'
                : 'text-foreground'
          "
        >
          {{ item.title }}
        </span>
      </li>
    </ol>
  </nav>
</template>
