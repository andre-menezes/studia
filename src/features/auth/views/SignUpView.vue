<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ApiError } from "@/shared/http";
import { AppAlert, AppButton, AppTextField } from "@/shared/ui";
import AuthCard from "../components/AuthCard.vue";
import AuthLink from "../components/AuthLink.vue";
import { useAuthStore } from "../stores/authStore";
import {
  DISPLAY_NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  browserTimeZone,
  isValidDisplayName,
  isValidEmail,
  isValidPassword,
} from "../validation";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const displayName = ref("");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const submitted = ref(false);
const errorCode = ref<string | null>(null);
const pending = ref(false);

const fieldErrors = computed(() => {
  if (!submitted.value) return { displayName: null, email: null, password: null };
  return {
    displayName: isValidDisplayName(displayName.value)
      ? null
      : t("auth.signup.errors.displayName"),
    email: isValidEmail(email.value) ? null : t("auth.signup.errors.email"),
    password: isValidPassword(password.value)
      ? null
      : t("auth.signup.errors.password", { min: PASSWORD_MIN_LENGTH }),
  };
});

const errorMessage = computed(() =>
  errorCode.value
    ? t(`errors.${errorCode.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);

async function onSubmit() {
  submitted.value = true;
  errorCode.value = null;
  if (Object.values(fieldErrors.value).some(Boolean)) return;
  pending.value = true;
  try {
    await auth.register({
      displayName: displayName.value.trim(),
      email: email.value.trim(),
      password: password.value,
      timeZone: browserTimeZone(),
    });
    await router.push({ name: "studies-home" });
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
    :title="t('auth.signup.title')"
    :subtitle="t('auth.signup.subtitle')"
  >
    <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <AppTextField
        v-model="displayName"
        required
        autocomplete="name"
        :maxlength="DISPLAY_NAME_MAX_LENGTH"
        :label="t('auth.signup.displayName')"
        :error="fieldErrors.displayName"
      />
      <AppTextField
        v-model="email"
        type="email"
        required
        autocomplete="email"
        :label="t('auth.login.email')"
        :placeholder="t('auth.login.emailPlaceholder')"
        :error="fieldErrors.email"
      />
      <AppTextField
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        required
        autocomplete="new-password"
        :maxlength="PASSWORD_MAX_LENGTH"
        :label="t('auth.login.password')"
        :hint="t('auth.signup.passwordHint', { min: PASSWORD_MIN_LENGTH })"
        :error="fieldErrors.password"
      />
      <label class="flex items-center gap-2 text-sm text-muted">
        <input v-model="showPassword" type="checkbox" class="size-4" />
        {{ t("auth.signup.showPassword") }}
      </label>

      <AppAlert v-if="errorMessage" type="error">
        {{ errorMessage }}
      </AppAlert>

      <AppButton
        type="submit"
        block
        prepend-icon="person_add"
        :loading="pending"
        class="mt-1"
      >
        {{ pending ? t("common.loading") : t("auth.signup.submit") }}
      </AppButton>
    </form>

    <template #footer>
      <p class="text-muted">
        {{ t("auth.signup.hasAccount") }}
        <AuthLink :to="{ name: 'login' }">{{ t("auth.signup.signIn") }}</AuthLink>
      </p>
    </template>
  </AuthCard>
</template>
