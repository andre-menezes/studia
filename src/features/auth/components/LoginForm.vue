<script setup lang="ts">
import { AppAlert, AppButton, AppTextField } from "@/shared/ui";
import logoDark from "@/shared/assets/brand/logo_studia_dark.svg";
import logoLight from "@/shared/assets/brand/logo_studia_light.svg";

defineProps<{
  appName: string;
  subtitle: string;
  email: string;
  password: string;
  emailLabel: string;
  passwordLabel: string;
  emailPlaceholder: string;
  submitLabel: string;
  loadingLabel: string;
  pending: boolean;
  errorMessage: string | null;
}>();

const emit = defineEmits<{
  "update:email": [value: string];
  "update:password": [value: string];
  submit: [];
}>();
</script>

<template>
  <div
    class="w-full max-w-sm overflow-hidden rounded-[20px] border border-border bg-surface shadow-card"
  >
    <div class="flex flex-col items-center gap-3 px-6 pt-8 text-center">
      <picture>
        <source media="(prefers-color-scheme: dark)" :srcset="logoDark" />
        <img
          :src="logoLight"
          :alt="appName"
          class="h-10 w-auto max-w-[12rem] object-contain"
          width="200"
          height="48"
        />
      </picture>
      <p class="text-sm text-muted">{{ subtitle }}</p>
    </div>

    <form
      class="flex flex-col gap-4 px-6 py-6"
      @submit.prevent="emit('submit')"
    >
      <AppTextField
        :model-value="email"
        type="email"
        required
        autocomplete="email"
        :label="emailLabel"
        :placeholder="emailPlaceholder"
        @update:model-value="emit('update:email', $event)"
      />
      <AppTextField
        :model-value="password"
        type="password"
        required
        :minlength="8"
        autocomplete="current-password"
        :label="passwordLabel"
        @update:model-value="emit('update:password', $event)"
      />

      <AppAlert v-if="errorMessage" type="error">
        {{ errorMessage }}
      </AppAlert>

      <AppButton
        type="submit"
        block
        prepend-icon="login"
        :loading="pending"
        class="mt-1"
      >
        {{ pending ? loadingLabel : submitLabel }}
      </AppButton>
    </form>
  </div>
</template>
