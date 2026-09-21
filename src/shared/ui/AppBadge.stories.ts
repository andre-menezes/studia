import type { Meta, StoryObj } from "@storybook/vue3";
import AppBadge from "./AppBadge.vue";

const meta = {
  title: "Design System/AppBadge",
  component: AppBadge,
  tags: ["autodocs"],
  args: {
    tone: "primary",
    uppercase: true,
  },
} satisfies Meta<typeof AppBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTones: Story = {
  render: () => ({
    components: { AppBadge },
    template: `
      <div class="flex flex-wrap gap-2">
        <AppBadge tone="accent">Accent</AppBadge>
        <AppBadge tone="primary">Active</AppBadge>
        <AppBadge tone="secondary">Paused</AppBadge>
        <AppBadge tone="success">Done</AppBadge>
        <AppBadge tone="warning">Warn</AppBadge>
        <AppBadge tone="error">Archived</AppBadge>
        <AppBadge tone="info">Info</AppBadge>
        <AppBadge tone="muted">Muted</AppBadge>
      </div>
    `,
  }),
};

export const Outlined: Story = {
  render: () => ({
    components: { AppBadge },
    template: `
      <div class="flex flex-wrap gap-2">
        <AppBadge variant="outlined" tone="primary">Active</AppBadge>
        <AppBadge variant="outlined" tone="secondary">Paused</AppBadge>
        <AppBadge variant="outlined" tone="accent">Done</AppBadge>
        <AppBadge variant="outlined" tone="error">Archived</AppBadge>
        <AppBadge variant="outlined" tone="muted">Muted</AppBadge>
      </div>
    `,
  }),
};

export const WithIcon: Story = {
  args: { tone: "success", icon: "check_circle" },
  render: (args) => ({
    components: { AppBadge },
    setup: () => ({ args }),
    template: `<AppBadge v-bind="args">Completed</AppBadge>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { AppBadge },
    template: `
      <div class="flex items-center gap-2">
        <AppBadge size="sm" tone="primary">SM</AppBadge>
        <AppBadge size="md" tone="primary">MD</AppBadge>
        <AppBadge size="sm" variant="outlined" tone="primary">SM outlined</AppBadge>
      </div>
    `,
  }),
};
