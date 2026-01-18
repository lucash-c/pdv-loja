<!-- src/components/pedidos/AlertaNovoPedido.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emitModel"
  >
    <q-card class="novo-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Novo pedido chegou!</div>
        <q-space />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div class="text-body2">
          Pedido
          <span class="text-weight-medium">{{ displayId(pedido) }}</span>
          de
          <span class="text-weight-medium">{{
            customerName(pedido) || "Cliente"
          }}</span
          >.
        </div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Total: {{ formatTotal(pedido) }} • {{ formatTime(pedido) }}
        </div>
      </q-card-section>

      <q-card-actions align="between" class="q-pa-md">
        <q-btn
          outline
          label="Ver detalhes"
          @click="$emit('ver-detalhes', pedido)"
        />
        <div class="row q-gutter-sm">
          <q-btn
            color="negative"
            icon="close"
            label="Rejeitar"
            :loading="actionLoading"
            :disable="actionLoading"
            @click="$emit('rejeitar', pedido)"
          />
          <q-btn
            color="positive"
            icon="check"
            label="Aceitar"
            :loading="actionLoading"
            :disable="actionLoading || !canAccept"
            @click="$emit('aceitar', pedido)"
          />
        </div>
      </q-card-actions>

      <q-banner
        v-if="!isStoreOpen"
        dense
        class="bg-orange-1 text-orange-10 q-mx-md q-mb-md rounded-borders"
      >
        <template #avatar><q-icon name="warning" /></template>
        Loja fechada: não é possível aceitar pedidos.
      </q-banner>

      <q-banner
        v-else-if="credits <= 0"
        dense
        class="bg-orange-1 text-orange-10 q-mx-md q-mb-md rounded-borders"
      >
        <template #avatar><q-icon name="warning" /></template>
        Créditos insuficientes: recarregue para aceitar novos pedidos.
        <template #action>
          <q-btn flat color="primary" label="Add Creditos" to="/creditos" />
        </template>
      </q-banner>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  pedido: { type: Object, default: null },

  actionLoading: { type: Boolean, default: false },
  canAccept: { type: Boolean, default: true },
  isStoreOpen: { type: Boolean, default: true },
  credits: { type: Number, default: 0 },

  displayId: { type: Function, required: true },
  customerName: { type: Function, required: true },
  formatTotal: { type: Function, required: true },
  formatTime: { type: Function, required: true },
});

const emit = defineEmits([
  "update:modelValue",
  "ver-detalhes",
  "aceitar",
  "rejeitar",
]);

const emitModel = (v) => emit("update:modelValue", v);
</script>

<style scoped>
.novo-card {
  width: 100%;
  max-width: 520px;
  border-radius: 14px;
}
</style>
