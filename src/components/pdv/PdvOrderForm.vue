<template>
  <q-card class="q-mt-md">
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium">Dados do pedido</div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-gutter-md">
      <q-input
        :model-value="customerName"
        outlined
        dense
        label="Cliente"
        @update:model-value="(value) => emit('update:customerName', value)"
      />

      <q-input
        :model-value="customerWhatsapp"
        outlined
        dense
        label="WhatsApp"
        mask="(##) #####-####"
        @update:model-value="(value) => emit('update:customerWhatsapp', value)"
      />

      <q-select
        :model-value="orderType"
        outlined
        dense
        label="Tipo de pedido"
        :options="orderTypeOptions"
        emit-value
        map-options
        @update:model-value="(value) => emit('update:orderType', value)"
      />

      <q-input
        :model-value="deliveryAddress"
        outlined
        dense
        :disable="deliveryDisabled"
        label="Endereço de entrega"
        type="textarea"
        @update:model-value="(value) => emit('update:deliveryAddress', value)"
      />

      <q-select
        :model-value="paymentMethod"
        outlined
        dense
        label="Forma de pagamento"
        :options="paymentOptions"
        @update:model-value="(value) => emit('update:paymentMethod', value)"
      />

      <q-input
        :model-value="notes"
        outlined
        dense
        label="Observações"
        type="textarea"
        @update:model-value="(value) => emit('update:notes', value)"
      />
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  customerName: {
    type: String,
    default: "",
  },
  customerWhatsapp: {
    type: String,
    default: "",
  },
  deliveryAddress: {
    type: String,
    default: "",
  },
  orderType: {
    type: String,
    default: "entrega",
  },
  orderTypeOptions: {
    type: Array,
    default: () => [],
  },
  deliveryDisabled: {
    type: Boolean,
    default: false,
  },
  paymentMethod: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
  },
  paymentOptions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "update:customerName",
  "update:customerWhatsapp",
  "update:deliveryAddress",
  "update:orderType",
  "update:paymentMethod",
  "update:notes",
]);
</script>
