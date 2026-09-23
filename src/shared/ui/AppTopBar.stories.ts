import type { Meta, StoryObj } from "@storybook/vue3";
import AppButton from "./AppButton.vue";
import AppTopBar from "./AppTopBar.vue";

const meta = {
  title: "Design System/AppTopBar",
  component: AppTopBar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMetaAndActions: Story = {
  render: () => ({
    components: { AppTopBar, AppButton },
    template: `
      <div class="min-h-[40vh] bg-background p-0">
        <AppTopBar>
          <template #brand>
            <span class="text-base font-semibold tracking-tight text-primary">Studia</span>
          </template>
          <template #actions>
            <div
              class="flex min-w-0 max-w-[10rem] items-center gap-2 sm:max-w-[16rem]"
              role="group"
              aria-label="André"
            >
              <span
                class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-variant text-[11px] font-semibold text-primary"
                aria-hidden="true"
              >AN</span>
              <span class="hidden truncate text-sm font-medium text-foreground/90 sm:inline">
                André
              </span>
            </div>
            <span class="hidden h-5 w-px shrink-0 bg-border/70 sm:block" aria-hidden="true" />
            <AppButton
              class="sm:hidden"
              variant="tonal"
              color="muted"
              size="sm"
              icon="logout"
              icon-only
              aria-label="Sair"
            />
            <AppButton
              class="hidden sm:inline-flex"
              variant="tonal"
              color="muted"
              size="sm"
              prepend-icon="logout"
            >
              Sair
            </AppButton>
          </template>
        </AppTopBar>
      </div>
    `,
  }),
};

export const FullBleedLegacy: Story = {
  args: { floating: false, bordered: true },
  render: (args) => ({
    components: { AppTopBar, AppButton },
    setup: () => ({ args }),
    template: `
      <AppTopBar v-bind="args">
        <template #brand>
          <span class="text-sm font-semibold text-primary">Studia</span>
        </template>
        <template #actions>
          <AppButton variant="tonal" color="muted" size="sm" prepend-icon="logout">
            Sair
          </AppButton>
        </template>
      </AppTopBar>
    `,
  }),
};

export const NonSticky: Story = {
  args: { sticky: false },
  render: (args) => ({
    components: { AppTopBar },
    setup: () => ({ args }),
    template: `
      <div class="min-h-[20vh] bg-background">
        <AppTopBar v-bind="args">
          <template #brand>
            <span class="text-sm font-semibold text-primary">Studia</span>
          </template>
        </AppTopBar>
      </div>
    `,
  }),
};
