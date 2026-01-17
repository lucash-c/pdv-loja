<template>
  <q-dialog v-model="dialogOpen">
    <q-card class="pdv-options-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Personalizar {{ itemName }}</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="error" class="text-negative">
        Não foi possível carregar as opções. Tente novamente.
      </q-card-section>

      <q-card-section v-else>
        <q-inner-loading :showing="loading" />

        <div v-if="!loading" class="column q-gutter-md">
          <div
            v-for="option in options"
            :key="option.id"
            class="pdv-options-group"
          >
            <div class="text-subtitle2 text-weight-medium">
              {{ option.name }}
              <span v-if="option.required" class="text-negative">*</span>
            </div>
            <div class="text-caption text-grey-7">
              {{ optionHint(option) }}
            </div>

            <q-option-group
              :type="isMultipleChoice(option) ? 'checkbox' : 'radio'"
              :options="option.items"
              :model-value="selectionValue(option)"
              @update:model-value="(value) => onSelectionChange(option, value)"
            />
          </div>

          <div v-if="validationMessage" class="text-negative text-caption">
            {{ validationMessage }}
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="close" />
        <q-btn
          color="primary"
          label="Adicionar"
          :disable="loading || !canConfirm"
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  itemName: {
    type: String,
    default: "Item",
  },
  options: {
    type: Array,
    default: () => [],
  },
  selection: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
  canConfirm: {
    type: Boolean,
    default: true,
  },
  validationMessage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "selection-change", "confirm"]);

const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const close = () => {
  emit("update:modelValue", false);
};

const isMultipleChoice = (option) => {
  if (!option) return true;
  const max = option.max_choices;
  if (max === null || max === undefined) return true;
  const parsed = Number(max);
  if (Number.isNaN(parsed)) return true;
  return parsed > 1;
};

const selectionValue = (option) => {
  const value = props.selection?.[option.id];
  if (isMultipleChoice(option)) return Array.isArray(value) ? value : [];
  return value ?? null;
};

const onSelectionChange = (option, value) => {
  emit("selection-change", { option, value });
};

const optionHint = (option) => {
  const parts = [];
  if (option.required) parts.push("Obrigatório");
  if (option.min_choices) parts.push(`Mín: ${option.min_choices}`);
  if (option.max_choices) parts.push(`Máx: ${option.max_choices}`);
  if (!parts.length) return "Escolha à vontade";
  return parts.join(" • ");
};
</script>

<style scoped>
.pdv-options-dialog {
  width: min(720px, 95vw);
}

.pdv-options-group {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 12px;
}
</style>
