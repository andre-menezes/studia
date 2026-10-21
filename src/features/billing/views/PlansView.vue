<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/features/auth";
import { ApiError } from "@/shared/http";
import {
  AppAlert,
  AppButton,
  AppConfirmDialog,
  AppSpinner,
} from "@/shared/ui";
import {
  canRenewPix,
  hasPremium,
  type BillingMethod,
} from "../domain/billing";
import { useBillingStore } from "../stores/billingStore";

const { t, tm, rt, locale } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const billing = useBillingStore();

const error = ref<string | null>(null);
const redirecting = ref<BillingMethod | null>(null);
const cancelOpen = ref(false);
const canceling = ref(false);

const sub = computed(() => billing.subscription);
const premium = computed(() => hasPremium(sub.value));

const errorCode = computed(() => error.value ?? billing.error);
const errorMessage = computed(() =>
  errorCode.value
    ? t(`errors.${errorCode.value}`, t("errors.INTERNAL_ERROR"))
    : null,
);

const price = computed(() => {
  const s = sub.value;
  if (!s) return "";
  return new Intl.NumberFormat(locale.value, {
    style: "currency",
    currency: s.currency,
  }).format(s.priceCents / 100);
});

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: auth.user?.timeZone,
  });
}

const statusMessage = computed(() => {
  const s = sub.value;
  if (!s) return null;
  const date = formatDate(s.currentPeriodEnd);
  if (s.status === "ACTIVE" && s.method) {
    return t(`billing.status.active.${s.method}`, { date });
  }
  if (s.status === "CANCELED") return t("billing.status.canceled", { date });
  if (s.status === "EXPIRED") return t("billing.status.expired");
  if (s.status === "PENDING") return t("billing.status.pending");
  return null;
});

const showSubscribe = computed(() => !premium.value);
const showRenewPix = computed(() => canRenewPix(sub.value));
const showCancel = computed(
  () => sub.value?.status === "ACTIVE" && sub.value.method === "CARD",
);

/** Marketing copy of each plan; the server stays the authority on limits. */
function features(key: string) {
  return (tm(key) as unknown as Parameters<typeof rt>[0][]).map((m) => rt(m));
}

function load() {
  error.value = null;
  return billing.fetchSubscription();
}

async function subscribe(method: BillingMethod) {
  if (redirecting.value) return;
  error.value = null;
  redirecting.value = method;
  try {
    await billing.startCheckout(method);
  } catch (err) {
    error.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
    redirecting.value = null;
  }
}

async function confirmCancel() {
  canceling.value = true;
  error.value = null;
  try {
    await billing.cancel();
    cancelOpen.value = false;
  } catch (err) {
    error.value = err instanceof ApiError ? err.code : "INTERNAL_ERROR";
  } finally {
    canceling.value = false;
  }
}

onMounted(load);
</script>

<template>
  <main class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
    <div>
      <AppButton
        variant="text"
        color="muted"
        prepend-icon="arrow_back"
        @click="router.push({ name: 'studies-home' })"
      >
        {{ t("billing.plans.back") }}
      </AppButton>
    </div>

    <header>
      <h1 class="text-2xl font-semibold text-foreground">
        {{ t("billing.plans.title") }}
      </h1>
      <p class="mt-1 text-sm text-muted">{{ t("billing.plans.subtitle") }}</p>
    </header>

    <div
      v-if="billing.status === 'loading' || billing.status === 'idle'"
      class="flex justify-center py-12"
    >
      <AppSpinner :label="t('billing.plans.loading')" label-visible />
    </div>

    <template v-else>
      <AppAlert v-if="errorMessage" type="error">
        {{ errorMessage }}
        <template v-if="!sub" #actions>
          <AppButton size="sm" variant="tonal" color="error" @click="load">
            {{ t("billing.plans.retry") }}
          </AppButton>
        </template>
      </AppAlert>
      <!-- AppAlert renders through a Teleport, so attributes go on a wrapper. -->
      <div v-if="statusMessage" data-testid="subscription-status">
        <AppAlert :type="sub?.status === 'EXPIRED' ? 'warning' : 'info'">
          {{ statusMessage }}
        </AppAlert>
      </div>

      <div v-if="sub" class="grid gap-4 sm:grid-cols-2">
        <article
          class="flex flex-col gap-4 rounded-[20px] bg-surface/90 px-6 py-5 shadow-card"
          aria-labelledby="plan-free-title"
        >
          <header class="flex items-baseline justify-between gap-2">
            <h2 id="plan-free-title" class="text-lg font-semibold text-foreground">
              {{ t("billing.plans.free.name") }}
            </h2>
            <span
              v-if="!premium"
              class="rounded-full bg-primary-variant px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {{ t("billing.plans.current") }}
            </span>
          </header>
          <p class="text-2xl font-semibold text-foreground">
            {{ t("billing.plans.free.price") }}
          </p>
          <ul class="flex flex-col gap-2 text-sm text-foreground">
            <li
              v-for="feature in features('billing.plans.free.features')"
              :key="feature"
              class="flex gap-2"
            >
              <span class="material-symbols-outlined text-[18px] text-muted" aria-hidden="true">check</span>
              {{ feature }}
            </li>
          </ul>
        </article>

        <article
          class="flex flex-col gap-4 rounded-[20px] bg-surface/90 px-6 py-5 shadow-card ring-2 ring-primary/40"
          aria-labelledby="plan-premium-title"
        >
          <header class="flex items-baseline justify-between gap-2">
            <h2 id="plan-premium-title" class="text-lg font-semibold text-foreground">
              {{ t("billing.plans.premium.name") }}
            </h2>
            <span
              v-if="premium"
              class="rounded-full bg-primary-variant px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {{ t("billing.plans.current") }}
            </span>
          </header>
          <p class="text-2xl font-semibold text-foreground" data-testid="premium-price">
            {{ t("billing.plans.premium.perMonth", { price }) }}
          </p>
          <ul class="flex flex-col gap-2 text-sm text-foreground">
            <li
              v-for="feature in features('billing.plans.premium.features')"
              :key="feature"
              class="flex gap-2"
            >
              <span class="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">check</span>
              {{ feature }}
            </li>
          </ul>

          <div v-if="showSubscribe" class="mt-auto flex flex-col gap-2">
            <AppButton
              block
              prepend-icon="credit_card"
              :loading="redirecting === 'CARD'"
              :disabled="redirecting !== null"
              @click="subscribe('CARD')"
            >
              {{ t("billing.plans.payCard") }}
            </AppButton>
            <p class="text-xs text-muted">{{ t("billing.plans.cardHint") }}</p>
            <AppButton
              block
              variant="tonal"
              prepend-icon="qr_code_2"
              :loading="redirecting === 'PIX'"
              :disabled="redirecting !== null"
              @click="subscribe('PIX')"
            >
              {{ t("billing.plans.payPix") }}
            </AppButton>
            <p class="text-xs text-muted">{{ t("billing.plans.pixHint") }}</p>
          </div>

          <div v-else class="mt-auto flex flex-col gap-2">
            <AppButton
              v-if="showRenewPix"
              block
              variant="tonal"
              prepend-icon="qr_code_2"
              :loading="redirecting === 'PIX'"
              @click="subscribe('PIX')"
            >
              {{ t("billing.plans.renewPix") }}
            </AppButton>
            <AppButton
              v-if="showCancel"
              block
              variant="text"
              color="error"
              @click="cancelOpen = true"
            >
              {{ t("billing.cancel.action") }}
            </AppButton>
          </div>
        </article>
      </div>

      <p class="text-xs text-muted">
        <span class="material-symbols-outlined align-middle text-[16px]" aria-hidden="true">lock</span>
        {{ t("billing.plans.secureCheckout") }}
      </p>
    </template>

    <AppConfirmDialog
      v-model="cancelOpen"
      :title="t('billing.cancel.confirmTitle')"
      :description="t('billing.cancel.confirmDescription', { date: formatDate(sub?.currentPeriodEnd) })"
      :confirm-label="t('billing.cancel.confirm')"
      :cancel-label="t('billing.cancel.keep')"
      :confirm-loading="canceling"
      @confirm="confirmCancel"
    />
  </main>
</template>
