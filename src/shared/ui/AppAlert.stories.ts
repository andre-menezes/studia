import type { Meta, StoryObj } from "@storybook/vue3";
import AppAlert from "./AppAlert.vue";
import AppButton from "./AppButton.vue";

const meta = {
  title: "Design System/AppAlert",
  component: AppAlert,
  tags: ["autodocs"],
  args: {
    type: "info",
  },
} satisfies Meta<typeof AppAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Types: Story = {
  name: "Tipos de alerta",
  render: () => ({
    components: { AppAlert },
    template: `
      <div class="flex max-w-lg flex-col gap-3 bg-background p-4">
        <AppAlert type="success">Feature publicada com sucesso.</AppAlert>
        <AppAlert type="alert">Há mudanças não commitadas.</AppAlert>
        <AppAlert type="error">Falha ao carregar os dados.</AppAlert>
        <AppAlert type="info">Dica: um nome curto ajuda no painel.</AppAlert>
        <AppAlert type="warning">Limite de criação próximo do fim.</AppAlert>
        <AppAlert type="accent">Organize sem fiscalizar.</AppAlert>
      </div>
    `,
  }),
};

export const WithTitleAndActions: Story = {
  render: () => ({
    components: { AppAlert, AppButton },
    template: `
      <AppAlert type="warning" title="Limite atingido">
        Você já usou todas as criações deste período.
        <template #actions>
          <AppButton size="sm" variant="tonal" color="warning">Ver planos</AppButton>
        </template>
      </AppAlert>
    `,
  }),
};

export const Dismissible: Story = {
  args: {
    type: "success",
    dismissible: true,
    dismissLabel: "Fechar",
    title: "Estudo criado.",
  },
  render: (args) => ({
    components: { AppAlert },
    setup: () => ({ args }),
    template: `
      <AppAlert v-bind="args">
        Seu Estudo está pronto para começar.
      </AppAlert>
    `,
  }),
};

export const Outlined: Story = {
  render: () => ({
    components: { AppAlert },
    template: `
      <div class="flex max-w-lg flex-col gap-3">
        <AppAlert type="success" variant="outlined">Sucesso outlined</AppAlert>
        <AppAlert type="error" variant="outlined">Erro outlined</AppAlert>
      </div>
    `,
  }),
};
