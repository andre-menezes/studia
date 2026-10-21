<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "@/shared/http";
import { AppAlert, AppButton, AppTextField } from "@/shared/ui";
import AuthCard from "../components/AuthCard.vue";
import AuthLink from "../components/AuthLink.vue";
import { useAuthStore } from "../stores/authStore";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  isValidPassword,
} from "../validation";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

// Read once, then drop it from the URL (history, Referer).
const token = typeof route.query.token === "string" ? route.query.token : "";
onMounted(() => {
  if (route.query.token) void router.replace({ query: {} });
});
const password = ref("");
const confirmation = ref("");
const submitted = ref(false);
const errorCode = ref<string | null>(
  token ? null : "AUTH_RESET_TOKEN_INVALID",
);
const pending = ref(false);

const tokenInvalid = computed(
  () => errorCode.value === "AUTH_RESET_TOKEN_INVALID",
);

const fieldErrors = computed(() => {
  if (!submitted.value) return { password: null, confirmation: null };
  return {
    password: isValidPassword(password.value)
      ? null
      : t("auth.signup.errors.password", { min: PASSWORD_MIN_LENGTH }),
    confirmation:
      confirmation.value === password.value
        ? null
        : t("auth.reset.errors.mismatch"),
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
    await auth.resetPassword({
      token,
      password: password.value,
    });
    await router.push({ name: "login", query: { reset: "1" } });
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
    :title="t('auth.reset.title')"
    :subtitle="t('auth.reset.subtitle')"
  >
    <div v-if="tokenInvalid" class="flex flex-col gap-4">
      <AppAlert type="error">{{ errorMessage }}</AppAlert>
      <AuthLink :to="{ name: 'forgot-password' }">
        {{ t("auth.reset.requestNew") }}
      </AuthLink>
    </div>

    <form
      v-else
      class="flex flex-col gap-4"
      novalidate
      @submit.prevent="onSubmit"
    >
      <AppTextField
        v-model="password"
        type="password"
        required
        autocomplete="new-password"
        :maxlength="PASSWORD_MAX_LENGTH"
        :label="t('auth.reset.password')"
        :hint="t('auth.signup.passwordHint', { min: PASSWORD_MIN_LENGTH })"
        :error="fieldErrors.password"
      />
      <AppTextField
        v-model="confirmation"
        type="password"
        required
        autocomplete="new-password"
        :maxlength="PASSWORD_MAX_LENGTH"
        :label="t('auth.reset.confirmation')"
        :error="fieldErrors.confirmation"
      />

      <AppAlert v-if="errorMessage" type="error">
        {{ errorMessage }}
      </AppAlert>

      <AppButton type="submit" block prepend-icon="lock_reset" :loading="pending">
        {{ pending ? t("common.loading") : t("auth.reset.submit") }}
      </AppButton>
    </form>

    <template #footer>
      <AuthLink :to="{ name: 'login' }">{{ t("auth.forgot.backToLogin") }}</AuthLink>
    </template>
  </AuthCard>
</template>
