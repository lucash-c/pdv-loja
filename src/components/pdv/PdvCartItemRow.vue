<template>
  <q-item>
    <q-item-section>
      <q-item-label class="text-weight-medium">
        {{ item.name }}
      </q-item-label>
      <q-item-label caption>
        {{ formattedUnit }} • {{ formattedTotal }}
      </q-item-label>
      <q-item-label v-if="optionsText" caption class="text-grey-7">
        {{ optionsText }}
      </q-item-label>
      <q-input
        :model-value="item.observation"
        dense
        borderless
        autogrow
        type="textarea"
        placeholder="Observação do item"
        class="q-mt-xs"
        @update:model-value="(value) => emit('update-observation', { item, value })"
      />
    </q-item-section>

    <q-item-section side class="items-end">
      <div class="row items-center q-gutter-xs">
        <q-btn
          size="sm"
          round
          flat
          icon="remove"
          @click="emit('decrease', item)"
        />
        <div class="text-weight-medium">{{ item.quantity }}</div>
        <q-btn
          size="sm"
          round
          flat
          icon="add"
          @click="emit('increase', item)"
        />
        <q-btn
          size="sm"
          round
          flat
          color="negative"
          icon="delete"
          @click="emit('remove', item)"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["increase", "decrease", "remove", "update-observation"]);

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formattedUnit = computed(() =>
  formatMoney(props.item?.unitPriceWithOptions ?? props.item?.unitPrice)
);
const formattedTotal = computed(() =>
  formatMoney(
    (props.item?.unitPriceWithOptions ?? props.item?.unitPrice ?? 0) *
      (props.item?.quantity || 0)
  )
);

const optionsText = computed(() => {
  const options = Array.isArray(props.item?.options) ? props.item.options : [];
  if (!options.length) return "";
  return options.map((opt) => opt.itemName).join(", ");
});
</script>
