<script setup lang="ts">
import { AppAlert, AppButton, AppTextField } from "@/shared/ui";
import AuthCard from "./AuthCard.vue";

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
  noticeMessage?: string | null;
}>();

const emit = defineEmits<{
  "update:email": [value: string];
  "update:password": [value: string];
  submit: [];
}>();
</script>

<template>
  <AuthCard :app-name="appName" :subtitle="subtitle">
    <form class="flex flex-col gap-4" @submit.prevent="emit('submit')">
      <AppAlert v-if="noticeMessage" type="success">
        {{ noticeMessage }}
      </AppAlert>

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

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </AuthCard>
</template>
