<script setup lang="ts">
import { AppButton, AppTopBar } from "@/shared/ui";
import logoDark from "@/shared/assets/brand/logo_studia_dark.svg";
import logoLight from "@/shared/assets/brand/logo_studia_light.svg";

defineProps<{
  appName: string;
  displayName: string | null;
  logoutLabel: string;
  loggingOut: boolean;
  maxWidthClass?: string;
}>();

const emit = defineEmits<{
  logout: [];
}>();
</script>

<template>
  <AppTopBar :max-width-class="maxWidthClass ?? 'max-w-3xl'">
    <template #brand>
      <div class="flex min-w-0 items-center gap-3">
        <picture class="shrink-0">
          <source
            media="(prefers-color-scheme: dark)"
            :srcset="logoDark"
          />
          <img
            :src="logoLight"
            :alt="appName"
            class="h-8 w-auto max-w-[9.5rem] object-contain object-left sm:h-9 sm:max-w-[11rem]"
            width="180"
            height="44"
          />
        </picture>
        <p
          v-if="displayName"
          class="truncate text-sm text-muted"
        >
          {{ displayName }}
        </p>
      </div>
    </template>
    <template #actions>
      <AppButton
        variant="text"
        color="muted"
        size="md"
        prepend-icon="logout"
        :loading="loggingOut"
        @click="emit('logout')"
      >
        {{ logoutLabel }}
      </AppButton>
    </template>
  </AppTopBar>
</template>
