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
            <span class="text-base font-semibold text-primary">Studia</span>
          </template>
          <template #meta>André</template>
          <template #actions>
            <AppButton variant="text" color="muted">Sair</AppButton>
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
          <AppButton variant="text" color="muted">Sair</AppButton>
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
