<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "@/shared/http";
import AuthLink from "../components/AuthLink.vue";
import LoginForm from "../components/LoginForm.vue";
import { useAuthStore } from "../stores/authStore";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const errorCode = ref<string | null>(null);
const pending = ref(false);

const noticeMessage = computed(() =>
  route.query.reset === "1" ? t("auth.reset.successNotice") : null,
);

const errorMessage = computed(() =>
  errorCode.value
    ? t(`errors.${errorCode.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);

async function onSubmit() {
  errorCode.value = null;
  pending.value = true;
  try {
    await auth.login(email.value, password.value);
    await router.push({ name: "studies-home" });
  } catch (err) {
    errorCode.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <LoginForm
    :app-name="t('common.appName')"
    :subtitle="t('auth.login.subtitle')"
    :email="email"
    :password="password"
    :email-label="t('auth.login.email')"
    :password-label="t('auth.login.password')"
    :email-placeholder="t('auth.login.emailPlaceholder')"
    :submit-label="t('auth.login.submit')"
    :loading-label="t('common.loading')"
    :pending="pending"
    :error-message="errorMessage"
    :notice-message="noticeMessage"
    @update:email="email = $event"
    @update:password="password = $event"
    @submit="onSubmit"
  >
    <template #footer>
      <AuthLink :to="{ name: 'forgot-password' }">
        {{ t("auth.login.forgotPassword") }}
      </AuthLink>
      <p class="text-muted">
        {{ t("auth.login.noAccount") }}
        <AuthLink :to="{ name: 'signup' }">{{ t("auth.login.signUp") }}</AuthLink>
      </p>
    </template>
  </LoginForm>
</template>
