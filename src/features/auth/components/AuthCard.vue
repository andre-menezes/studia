<script setup lang="ts">
import logoDark from "@/shared/assets/brand/logo_studia_dark.svg";
import logoLight from "@/shared/assets/brand/logo_studia_light.svg";

defineProps<{
  appName: string;
  title?: string;
  subtitle: string;
}>();
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-background px-4 py-10"
  >
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
        <h1 v-if="title" class="text-lg font-semibold text-foreground">
          {{ title }}
        </h1>
        <p class="text-sm text-muted">{{ subtitle }}</p>
      </div>

      <div class="px-6 py-6">
        <slot />
      </div>

      <div
        v-if="$slots.footer"
        class="flex flex-col items-center gap-2 border-t border-border px-6 py-4 text-sm"
      >
        <slot name="footer" />
      </div>
    </div>
  </main>
</template>
