<template>
  <q-card class="pdv-menu-item">
    <q-img v-if="item.image" :src="item.image" :alt="item.name" ratio="4/3" />

    <q-card-section class="q-pb-none">
      <div class="text-subtitle1 text-weight-medium">
        {{ item.name }}
      </div>
      <div v-if="item.description" class="text-caption text-grey-7 q-mt-xs">
        {{ item.description }}
      </div>
    </q-card-section>

    <q-card-section class="row items-center q-pt-none">
      <div class="text-weight-medium text-primary">
        {{ formattedPrice }}
      </div>
      <q-space />
      <q-badge v-if="item.hasOptions" color="primary" outline class="q-mr-sm">
        Com opções
      </q-badge>
      <q-btn
        color="primary"
        icon="add_shopping_cart"
        label="Adicionar"
        @click="emit('add', item)"
      />
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["add"]);

const formattedPrice = computed(() =>
  Number(props.item?.price || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
);
</script>

<style scoped>
.pdv-menu-item {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
