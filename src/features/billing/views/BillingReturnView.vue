<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { AppAlert, AppButton, AppSpinner } from "@/shared/ui";
import { useBillingStore } from "../stores/billingStore";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const billing = useBillingStore();

type Outcome = "checking" | "success" | "pending" | "rejected";
const outcome = ref<Outcome>("checking");

const message = computed(() => t(`billing.return.${outcome.value}`));
const alertType = computed(() =>
  outcome.value === "success"
    ? "success"
    : outcome.value === "rejected"
      ? "error"
      : "info",
);

const polling = new AbortController();

onMounted(async () => {
  if (route.query.result === "rejected") {
    outcome.value = "rejected";
    return;
  }
  // The redirect is no proof of payment: only the server's subscription counts (ADR-0012 §4).
  const confirmed = await billing.waitForConfirmation({ signal: polling.signal });
  if (!polling.signal.aborted) outcome.value = confirmed ? "success" : "pending";
});

onBeforeUnmount(() => polling.abort());
</script>

<template>
  <main class="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12 sm:px-6">
    <h1 class="text-2xl font-semibold text-foreground">
      {{ t("billing.return.title") }}
    </h1>

    <div v-if="outcome === 'checking'" class="flex justify-center py-8">
      <AppSpinner :label="message" label-visible />
    </div>

    <template v-else>
      <!-- AppAlert renders through a Teleport, so attributes go on a wrapper. -->
      <div data-testid="billing-return-result">
        <AppAlert :type="alertType">{{ message }}</AppAlert>
      </div>
      <div class="flex flex-wrap gap-2">
        <AppButton
          prepend-icon="school"
          @click="router.push({ name: 'studies-home' })"
        >
          {{ t("billing.return.goHome") }}
        </AppButton>
        <AppButton
          v-if="outcome !== 'success'"
          variant="tonal"
          @click="router.push({ name: 'billing-plans' })"
        >
          {{ t("billing.return.goPlans") }}
        </AppButton>
      </div>
    </template>
  </main>
</template>
