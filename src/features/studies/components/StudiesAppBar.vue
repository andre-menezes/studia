<script setup lang="ts">
import { computed } from "vue";
import { AppButton, AppTopBar } from "@/shared/ui";
import logoDark from "@/shared/assets/brand/logo_studia_dark.svg";
import logoLight from "@/shared/assets/brand/logo_studia_light.svg";

const props = defineProps<{
  appName: string;
  displayName: string | null;
  logoutLabel: string;
  loggingOut: boolean;
  maxWidthClass?: string;
}>();

const emit = defineEmits<{
  logout: [];
}>();

const initials = computed(() => {
  const name = props.displayName?.trim();
  if (!name) return "";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase();
});
</script>

<template>
  <AppTopBar :max-width-class="maxWidthClass ?? 'max-w-3xl'">
    <template #brand>
      <picture class="block shrink-0">
        <source
          media="(prefers-color-scheme: dark)"
          :srcset="logoDark"
        />
        <img
          :src="logoLight"
          :alt="appName"
          class="h-7 w-auto max-w-[8.5rem] object-contain object-left sm:h-8 sm:max-w-[10.5rem]"
          width="180"
          height="44"
        />
      </picture>
    </template>

    <template #actions>
      <div
        v-if="displayName"
        class="flex min-w-0 max-w-[10rem] items-center gap-2 sm:max-w-[16rem]"
        role="group"
        :aria-label="displayName"
      >
        <span
          class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-variant text-[11px] font-semibold tracking-wide text-primary"
          aria-hidden="true"
        >
          {{ initials }}
        </span>
        <span
          class="hidden truncate text-sm font-medium text-foreground/90 sm:inline"
          aria-hidden="true"
        >
          {{ displayName }}
        </span>
      </div>

      <span
        v-if="displayName"
        class="hidden h-5 w-px shrink-0 bg-border/70 sm:block"
        aria-hidden="true"
      />

      <AppButton
        class="sm:hidden"
        variant="tonal"
        color="muted"
        size="sm"
        icon="logout"
        icon-only
        :aria-label="logoutLabel"
        :loading="loggingOut"
        @click="emit('logout')"
      />
      <AppButton
        class="hidden sm:inline-flex"
        variant="tonal"
        color="muted"
        size="sm"
        prepend-icon="logout"
        :loading="loggingOut"
        :aria-label="logoutLabel"
        @click="emit('logout')"
      >
        {{ logoutLabel }}
      </AppButton>
    </template>
  </AppTopBar>
</template>
