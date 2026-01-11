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
        mask="+## (##) #####-####"
        @update:model-value="(value) => emit('update:customerWhatsapp', value)"
      />

      <q-input
        :model-value="deliveryAddress"
        outlined
        dense
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
  "update:paymentMethod",
  "update:notes",
]);
</script>
