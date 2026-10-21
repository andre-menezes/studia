<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ApiError } from "@/shared/http";
import { AppAlert, AppButton, AppTextField } from "@/shared/ui";
import AuthCard from "../components/AuthCard.vue";
import AuthLink from "../components/AuthLink.vue";
import { useAuthStore } from "../stores/authStore";
import { isValidEmail } from "../validation";

const { t } = useI18n();
const auth = useAuthStore();

const email = ref("");
const submitted = ref(false);
const sent = ref(false);
const errorCode = ref<string | null>(null);
const pending = ref(false);

const emailError = computed(() =>
  submitted.value && !isValidEmail(email.value)
    ? t("auth.forgot.errors.email")
    : null,
);

const errorMessage = computed(() =>
  errorCode.value
    ? t(`errors.${errorCode.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);

async function onSubmit() {
  submitted.value = true;
  errorCode.value = null;
  if (emailError.value) return;
  pending.value = true;
  try {
    await auth.requestPasswordReset(email.value.trim());
    sent.value = true;
  } catch (err) {
    errorCode.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <AuthCard
    :app-name="t('common.appName')"
    :title="t('auth.forgot.title')"
    :subtitle="t('auth.forgot.subtitle')"
  >
    <AppAlert v-if="sent" type="success">
      {{ t("auth.forgot.sent") }}
    </AppAlert>

    <form
      v-else
      class="flex flex-col gap-4"
      novalidate
      @submit.prevent="onSubmit"
    >
      <AppTextField
        v-model="email"
        type="email"
        required
        autocomplete="email"
        :label="t('auth.login.email')"
        :placeholder="t('auth.login.emailPlaceholder')"
        :error="emailError"
      />

      <AppAlert v-if="errorMessage" type="error">
        {{ errorMessage }}
      </AppAlert>

      <AppButton type="submit" block prepend-icon="mail" :loading="pending">
        {{ pending ? t("common.loading") : t("auth.forgot.submit") }}
      </AppButton>
    </form>

    <template #footer>
      <AuthLink :to="{ name: 'login' }">{{ t("auth.forgot.backToLogin") }}</AuthLink>
    </template>
  </AuthCard>
</template>
