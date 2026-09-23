<script setup lang="ts">
import { computed, useSlots } from "vue";

export type AppButtonVariant =
  | "filled"
  | "tonal"
  | "outlined"
  | "text"
  | "plain";
export type AppButtonColor =
  | "accent"
  | "primary"
  | "secondary"
  | "error"
  | "success"
  | "warning"
  | "info"
  | "muted";
export type AppButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AppButtonType = "button" | "submit" | "reset";
export type AppButtonRounded = boolean | "full";

const props = withDefaults(
  defineProps<{
    variant?: AppButtonVariant;
    color?: AppButtonColor;
    size?: AppButtonSize;
    /** Material Symbols Outlined ligature name (e.g. "add", "logout"). */
    icon?: string;
    /** Render only the icon (square hit target). Requires `icon` or `#icon` + `ariaLabel`. */
    iconOnly?: boolean;
    /** Use Material Symbols FILL=1 for icons in this button. */
    iconFill?: boolean;
    prependIcon?: string;
    appendIcon?: string;
    block?: boolean;
    rounded?: AppButtonRounded;
    disabled?: boolean;
    loading?: boolean;
    type?: AppButtonType;
    /** Required for icon-only buttons when no visible text. */
    ariaLabel?: string;
  }>(),
  {
    variant: "filled",
    color: "primary",
    size: "md",
    iconOnly: false,
    iconFill: false,
    block: false,
    rounded: true,
    disabled: false,
    loading: false,
    type: "button",
  },
);

defineEmits<{
  click: [event: MouseEvent];
}>();

const slots = useSlots();

const isIconOnly = computed(
  () => props.iconOnly || (Boolean(props.icon) && !slots.default),
);

const sizeClasses = computed(() => {
  if (isIconOnly.value) {
    switch (props.size) {
      case "xs":
        return "size-7 text-base";
      case "sm":
        return "size-8 text-lg";
      case "lg":
        return "size-11 text-2xl";
      case "xl":
        return "size-12 text-2xl";
      default:
        return "size-10 text-xl";
    }
  }

  switch (props.size) {
    case "xs":
      return "h-7 gap-1 px-2.5 text-xs";
    case "sm":
      return "h-8 gap-1.5 px-3 text-sm";
    case "lg":
      return "h-11 gap-2 px-5 text-base";
    case "xl":
      return "h-12 gap-2 px-6 text-base";
    default:
      return "h-10 gap-2 px-4 text-sm";
  }
});

const iconSizeClass = computed(() => {
  switch (props.size) {
    case "xs":
      return "text-[16px] leading-none";
    case "sm":
      return "text-[18px] leading-none";
    case "lg":
      return "text-[22px] leading-none";
    case "xl":
      return "text-[24px] leading-none";
    default:
      return "text-[20px] leading-none";
  }
});

const roundedClass = computed(() => {
  if (props.rounded === "full" || isIconOnly.value) return "rounded-full";
  if (props.rounded === false) return "rounded-md";
  return "rounded-xl";
});

const colorStyles = computed(() => {
  const map: Record<
    AppButtonColor,
    { solid: string; onSolid: string; tonalBg: string; soft: string }
  > = {
    accent: {
      solid: "bg-accent",
      onSolid: "text-on-accent",
      tonalBg: "bg-accent-variant",
      soft: "text-accent",
    },
    primary: {
      solid: "bg-primary",
      onSolid: "text-white",
      tonalBg: "bg-primary-variant",
      soft: "text-primary",
    },
    secondary: {
      solid: "bg-secondary",
      onSolid: "text-white",
      tonalBg: "bg-secondary-variant",
      soft: "text-secondary",
    },
    error: {
      solid: "bg-error",
      onSolid: "text-white",
      tonalBg: "bg-error-variant",
      soft: "text-error",
    },
    success: {
      solid: "bg-success",
      onSolid: "text-white",
      tonalBg: "bg-success-variant",
      soft: "text-success",
    },
    warning: {
      solid: "bg-warning",
      onSolid: "text-foreground",
      tonalBg: "bg-warning-variant",
      soft: "text-warning",
    },
    info: {
      solid: "bg-info",
      onSolid: "text-white",
      tonalBg: "bg-info-variant",
      soft: "text-info",
    },
    muted: {
      solid: "bg-muted",
      onSolid: "text-white",
      tonalBg: "bg-surface-variant",
      soft: "text-muted",
    },
  };
  return map[props.color];
});

const variantClasses = computed(() => {
  const c = colorStyles.value;
  switch (props.variant) {
    case "tonal":
      return `${c.tonalBg} ${c.soft} hover:opacity-90`;
    case "outlined":
      return `border border-current bg-transparent ${c.soft} hover:bg-surface-variant`;
    case "text":
      return `bg-transparent ${c.soft} hover:bg-surface-variant`;
    case "plain":
      return `bg-transparent ${c.soft} hover:opacity-80`;
    case "filled":
    default:
      return `${c.solid} ${c.onSolid} hover:opacity-90`;
  }
});

const iconFillStyle = computed(() =>
  props.iconFill
    ? {
        fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
      }
    : undefined,
);

const iconGlyphClass = computed(() =>
  [
    iconSizeClass.value,
    props.iconFill ? "material-symbols-fill" : "",
  ]
    .filter(Boolean)
    .join(" "),
);

const rootClass = computed(() =>
  [
    "inline-flex cursor-pointer items-center justify-center font-medium transition duration-150 select-none active:scale-[0.98]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
    "motion-reduce:transition-none motion-reduce:active:scale-100",
    sizeClasses.value,
    roundedClass.value,
    variantClasses.value,
    props.block ? "w-full" : "",
    isIconOnly.value ? "" : "whitespace-nowrap",
  ]
    .filter(Boolean)
    .join(" "),
);

const showPrepend = computed(
  () =>
    !isIconOnly.value && (Boolean(props.prependIcon) || Boolean(slots.prepend)),
);
const showAppend = computed(
  () =>
    !isIconOnly.value && (Boolean(props.appendIcon) || Boolean(slots.append)),
);
</script>

<template>
  <button
    :type="type"
    class="app-button"
    :class="rootClass"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-busy="loading || undefined"
    @click="$emit('click', $event)"
  >
    <template v-if="isIconOnly">
      <span
        v-if="loading"
        class="material-symbols-outlined animate-spin"
        :class="iconGlyphClass"
        :style="iconFillStyle"
        aria-hidden="true"
      >
        progress_activity
      </span>
      <slot v-else name="icon">
        <span
          v-if="icon"
          class="material-symbols-outlined"
          :class="iconGlyphClass"
          :style="iconFillStyle"
          aria-hidden="true"
        >
          {{ icon }}
        </span>
      </slot>
    </template>

    <template v-else>
      <span
        v-if="loading"
        class="material-symbols-outlined animate-spin"
        :class="iconGlyphClass"
        :style="iconFillStyle"
        aria-hidden="true"
      >
        progress_activity
      </span>
      <span
        v-else-if="showPrepend"
        class="inline-flex shrink-0 items-center"
        aria-hidden="true"
      >
        <slot name="prepend">
          <span
            v-if="prependIcon"
            class="material-symbols-outlined"
            :class="iconGlyphClass"
            :style="iconFillStyle"
          >
            {{ prependIcon }}
          </span>
        </slot>
      </span>

      <span
        v-else-if="icon && !prependIcon && !slots.prepend"
        class="inline-flex shrink-0"
        aria-hidden="true"
      >
        <span
          class="material-symbols-outlined"
          :class="iconGlyphClass"
          :style="iconFillStyle"
          >{{ icon }}</span
        >
      </span>

      <span v-if="$slots.default" class="inline-flex min-w-0 items-center">
        <slot />
      </span>

      <span
        v-if="showAppend && !loading"
        class="inline-flex shrink-0 items-center"
        aria-hidden="true"
      >
        <slot name="append">
          <span
            v-if="appendIcon"
            class="material-symbols-outlined"
            :class="iconGlyphClass"
            :style="iconFillStyle"
          >
            {{ appendIcon }}
          </span>
        </slot>
      </span>
    </template>
  </button>
</template>
