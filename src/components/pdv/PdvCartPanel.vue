<template>
  <q-card>
    <q-card-section class="row items-center">
      <div class="text-subtitle1 text-weight-medium">Carrinho</div>
      <q-space />
      <q-badge color="primary" outline>{{ totalItems }}</q-badge>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-none">
      <q-list separator>
        <q-item v-if="!items.length" class="q-pa-md">
          <q-item-section class="text-grey-6">
            Nenhum item adicionado.
          </q-item-section>
        </q-item>

        <PdvCartItemRow
          v-for="item in items"
          :key="item.id"
          :item="item"
          @increase="emit('increase', $event)"
          @decrease="emit('decrease', $event)"
          @remove="emit('remove', $event)"
        />
      </q-list>
    </q-card-section>

    <q-separator />

    <q-card-section class="row items-center">
      <div class="text-weight-medium">Total</div>
      <q-space />
      <div class="text-weight-bold text-primary">{{ formattedTotal }}</div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from "vue";
import PdvCartItemRow from "src/components/pdv/PdvCartItemRow.vue";

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  total: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["increase", "decrease", "remove"]);

const formattedTotal = computed(() =>
  Number(props.total || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
);

const totalItems = computed(() =>
  props.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
);
</script>
