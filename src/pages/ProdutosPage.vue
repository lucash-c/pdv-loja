<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h6">Produtos</div>

      <q-space />

      <q-btn
        outline
        color="primary"
        icon="refresh"
        :loading="loading"
        class="q-mr-sm"
        @click="refresh"
      />

      <q-btn
        color="primary"
        icon="add"
        label="Novo produto"
        @click="openCreateDialog"
      />
    </div>

    <q-card class="q-mb-md">
      <q-card-section class="row items-center q-gutter-sm">
        <q-input
          v-model="search"
          outlined
          dense
          clearable
          debounce="250"
          placeholder="Buscar por nome ou descrição"
          class="col"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <q-toggle v-model="showInactive" label="Mostrar inativos" />
      </q-card-section>
    </q-card>

    <q-table
      flat
      bordered
      row-key="id"
      :rows="filteredProducts"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      class="products-table"
    >
      <template #body-cell-name="props">
        <q-td :props="props">
          <div class="row items-center no-wrap">
            <q-avatar size="42px" class="q-mr-sm" rounded>
              <img
                v-if="props.row.image_url"
                :src="props.row.image_url"
                :alt="props.row.name"
              />
              <q-icon v-else name="inventory_2" color="grey-6" />
            </q-avatar>
            <div>
              <div class="text-weight-medium">
                {{ props.row.name || "Produto" }}
              </div>
              <div class="text-caption text-grey-7">
                {{ props.row.description || "Sem descrição" }}
              </div>
            </div>
          </div>
        </q-td>
      </template>

      <template #body-cell-price="props">
        <q-td :props="props">
          {{ formatMoney(props.row.base_price) }}
        </q-td>
      </template>

      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="props.row.is_active ? 'positive' : 'grey-6'" outline>
            {{ props.row.is_active ? "Ativo" : "Inativo" }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-options="props">
        <q-td :props="props">
          <q-chip
            v-if="props.row.has_options"
            color="primary"
            text-color="white"
            dense
          >
            Com opções
          </q-chip>
          <span v-else class="text-grey-6">Sem opções</span>
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            v-if="props.row.has_options"
            flat
            round
            color="secondary"
            icon="tune"
            @click="openOptionsDialog(props.row)"
          >
            <q-tooltip>Opções</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            color="primary"
            icon="edit"
            @click="openEditDialog(props.row)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            color="negative"
            icon="block"
            @click="confirmDisable(props.row)"
          >
            <q-tooltip>Desativar</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template #no-data>
        <div class="full-width row flex-center text-grey-6 q-pa-lg">
          Nenhum produto encontrado.
        </div>
      </template>
    </q-table>

    <q-dialog v-model="dialogOpen">
      <q-card class="product-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ form.id ? "Editar produto" : "Novo produto" }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md">
          <q-form @submit.prevent="saveProduct">
            <q-input
              v-model="form.name"
              label="Nome"
              outlined
              dense
              :rules="[(v) => !!v || 'Informe o nome']"
            />

            <q-input
              v-model="form.description"
              label="Descrição"
              outlined
              dense
              type="textarea"
              class="q-mt-sm"
            />

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="form.base_price"
                  label="Preço base"
                  outlined
                  dense
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.image_url"
                  label="URL da imagem"
                  outlined
                  dense
                />
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-md-6">
                <q-toggle v-model="form.has_options" label="Possui opções" />
              </div>
              <div class="col-12 col-md-6">
                <q-toggle v-model="form.is_active" label="Produto ativo" />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Salvar"
            :loading="saving"
            @click="saveProduct"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="optionsDialogOpen">
      <q-card class="options-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div>
            <div class="text-h6">Opções do produto</div>
            <div class="text-caption text-grey-7">
              {{ selectedProduct?.name || "Produto" }}
            </div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md">
          <div class="row items-center q-mb-sm">
            <q-btn
              color="primary"
              icon="add"
              label="Nova opção"
              @click="openOptionForm()"
            />
            <q-space />
            <q-btn
              flat
              color="primary"
              icon="refresh"
              :loading="optionsLoading"
              @click="loadOptions"
            />
          </div>

          <q-inner-loading :showing="optionsLoading" />

          <q-list v-if="options.length" bordered class="rounded-borders">
            <q-item v-for="option in options" :key="option.id">
              <q-item-section>
                <div class="text-weight-medium">
                  {{ option.name || "Opção" }}
                </div>
                <div class="text-caption text-grey-7">
                  Tipo: {{ option.typeLabel }}
                  <span v-if="option.required"> • Obrigatória</span>
                  <span v-if="option.min_choices !== null">
                    • Mín. {{ option.min_choices }}
                  </span>
                  <span v-if="option.max_choices !== null">
                    • Máx. {{ option.max_choices }}
                  </span>
                </div>
              </q-item-section>
              <q-item-section side class="items-center">
                <q-btn
                  flat
                  round
                  color="secondary"
                  icon="inventory_2"
                  @click="openItemsDialog(option)"
                >
                  <q-tooltip>Itens</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="primary"
                  icon="edit"
                  @click="openOptionForm(option)"
                >
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click="confirmDeleteOption(option)"
                >
                  <q-tooltip>Excluir</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-else class="text-grey-6 text-center q-pa-md">
            Nenhuma opção cadastrada.
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="optionFormOpen">
      <q-card class="option-form-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ optionForm.id ? "Editar opção" : "Nova opção" }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md">
          <q-form @submit.prevent="saveOption">
            <q-input
              v-model="optionForm.name"
              label="Nome"
              outlined
              dense
              :rules="[(v) => !!v || 'Informe o nome']"
            />

            <q-select
              v-model="optionForm.type"
              :options="optionTypeOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              label="Tipo"
              outlined
              dense
              class="q-mt-sm"
            />

            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="optionForm.min_choices"
                  label="Mínimo de escolhas"
                  outlined
                  dense
                  type="number"
                  min="0"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="optionForm.max_choices"
                  label="Máximo de escolhas"
                  outlined
                  dense
                  type="number"
                  min="0"
                />
              </div>
            </div>

            <q-toggle
              v-model="optionForm.required"
              label="Obrigatória"
              class="q-mt-sm"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Salvar"
            :loading="optionSaving"
            @click="saveOption"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="itemsDialogOpen">
      <q-card class="items-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div>
            <div class="text-h6">Itens da opção</div>
            <div class="text-caption text-grey-7">
              {{ selectedOption?.name || "Opção" }}
            </div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md">
          <div class="row items-center q-mb-sm">
            <q-btn
              color="primary"
              icon="add"
              label="Novo item"
              @click="openItemForm()"
            />
            <q-space />
            <q-btn
              flat
              color="primary"
              icon="refresh"
              :loading="itemsLoading"
              @click="loadItems"
            />
          </div>

          <q-inner-loading :showing="itemsLoading" />

          <q-list v-if="optionItems.length" bordered class="rounded-borders">
            <q-item v-for="item in optionItems" :key="item.id">
              <q-item-section>
                <div class="text-weight-medium">
                  {{ item.name || "Item" }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ formatMoney(item.price) }}
                  <span> • {{ item.is_active ? "Ativo" : "Inativo" }} </span>
                </div>
              </q-item-section>
              <q-item-section side class="items-center">
                <q-btn
                  flat
                  round
                  color="primary"
                  icon="edit"
                  @click="openItemForm(item)"
                >
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click="confirmDeleteItem(item)"
                >
                  <q-tooltip>Excluir</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-else class="text-grey-6 text-center q-pa-md">
            Nenhum item cadastrado.
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="itemFormOpen">
      <q-card class="item-form-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ itemForm.id ? "Editar item" : "Novo item" }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md">
          <q-form @submit.prevent="saveItem">
            <q-input
              v-model="itemForm.name"
              label="Nome"
              outlined
              dense
              :rules="[(v) => !!v || 'Informe o nome']"
            />

            <q-input
              v-model.number="itemForm.price"
              label="Preço"
              outlined
              dense
              type="number"
              step="0.01"
              min="0"
              class="q-mt-sm"
            />

            <q-toggle
              v-model="itemForm.is_active"
              label="Item ativo"
              class="q-mt-sm"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Salvar"
            :loading="itemSaving"
            @click="saveItem"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { Dialog, Notify } from "quasar";
import { computed, onMounted, ref } from "vue";
import apiService from "src/services/api";

const loading = ref(false);
const saving = ref(false);
const dialogOpen = ref(false);
const search = ref("");
const showInactive = ref(false);
const optionsDialogOpen = ref(false);
const optionsLoading = ref(false);
const optionFormOpen = ref(false);
const optionSaving = ref(false);
const itemsDialogOpen = ref(false);
const itemsLoading = ref(false);
const itemFormOpen = ref(false);
const itemSaving = ref(false);

const pagination = {
  rowsPerPage: 10,
};

const products = ref([]);
const options = ref([]);
const optionItems = ref([]);
const selectedProduct = ref(null);
const selectedOption = ref(null);

const form = ref({
  id: null,
  name: "",
  description: "",
  base_price: null,
  image_url: "",
  has_options: false,
  is_active: true,
});

const optionForm = ref({
  id: null,
  name: "",
  type: "multiple",
  required: false,
  min_choices: null,
  max_choices: null,
});

const itemForm = ref({
  id: null,
  name: "",
  price: null,
  is_active: true,
});

const columns = [
  { name: "name", label: "Produto", field: "name", align: "left" },
  { name: "price", label: "Preço", field: "base_price", align: "left" },
  { name: "status", label: "Status", field: "is_active", align: "left" },
  { name: "options", label: "Opções", field: "has_options", align: "left" },
  { name: "actions", label: "Ações", field: "actions", align: "right" },
];

const optionTypeOptions = [
  { label: "Escolha única", value: "single" },
  { label: "Múltiplas escolhas", value: "multiple" },
];

const notify = ({ type = "info", message = "" } = {}) => {
  const msg = String(message || "").trim();
  if (!msg) return;
  Notify.create({ type, message: msg, position: "top" });
};

const normalizeProduct = (p) => {
  const statusActive =
    typeof p?.status === "string" ? p.status === "active" : null;

  return {
    id: p?.id ?? p?._id ?? p?.product_id ?? null,
    name: p?.name ?? p?.title ?? "",
    description: p?.description ?? p?.details ?? "",
    base_price:
      p?.base_price ?? p?.basePrice ?? p?.price ?? p?.value ?? p?.valor ?? 0,
    image_url: p?.image_url ?? p?.imageUrl ?? p?.image ?? "",
    has_options: Boolean(p?.has_options ?? p?.hasOptions ?? p?.options?.length),
    is_active: p?.is_active ?? p?.isActive ?? p?.active ?? statusActive ?? true,
  };
};

const getOptionTypeLabel = (type) => {
  if (type === "single") return "Escolha única";
  if (type === "multiple") return "Múltiplas escolhas";
  return type || "Não informado";
};

const normalizeOption = (option) => ({
  id: option?.id ?? option?._id ?? option?.option_id ?? null,
  name: option?.name ?? option?.title ?? "",
  type: option?.type ?? option?.option_type ?? "multiple",
  typeLabel: getOptionTypeLabel(option?.type ?? option?.option_type),
  required: Boolean(option?.required ?? option?.is_required ?? false),
  min_choices:
    option?.min_choices ??
    option?.minChoices ??
    option?.min ??
    option?.minimo ??
    null,
  max_choices:
    option?.max_choices ??
    option?.maxChoices ??
    option?.max ??
    option?.maximo ??
    null,
});

const normalizeItem = (item) => ({
  id: item?.id ?? item?._id ?? item?.item_id ?? null,
  name: item?.name ?? item?.title ?? "",
  price: item?.price ?? item?.value ?? item?.valor ?? 0,
  is_active: item?.is_active ?? item?.isActive ?? true,
});

const filteredProducts = computed(() => {
  const q = String(search.value || "")
    .trim()
    .toLowerCase();

  return products.value
    .filter((p) => (showInactive.value ? true : p.is_active))
    .filter((p) => {
      if (!q) return true;
      const blob = `${p.name} ${p.description}`.toLowerCase();
      return blob.includes(q);
    });
});

const formatMoney = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const resetForm = () => {
  form.value = {
    id: null,
    name: "",
    description: "",
    base_price: null,
    image_url: "",
    has_options: false,
    is_active: true,
  };
};

const resetOptionForm = () => {
  optionForm.value = {
    id: null,
    name: "",
    type: "multiple",
    required: false,
    min_choices: null,
    max_choices: null,
  };
};

const resetItemForm = () => {
  itemForm.value = {
    id: null,
    name: "",
    price: null,
    is_active: true,
  };
};

const openCreateDialog = () => {
  resetForm();
  dialogOpen.value = true;
};

const openEditDialog = (product) => {
  form.value = { ...product };
  dialogOpen.value = true;
};

const openOptionsDialog = (product) => {
  selectedProduct.value = product;
  optionsDialogOpen.value = true;
  options.value = [];
  void loadOptions();
};

const openOptionForm = (option = null) => {
  if (option) {
    optionForm.value = {
      id: option.id,
      name: option.name,
      type: option.type || "multiple",
      required: Boolean(option.required),
      min_choices: option.min_choices ?? null,
      max_choices: option.max_choices ?? null,
    };
  } else {
    resetOptionForm();
  }
  optionFormOpen.value = true;
};

const openItemsDialog = (option) => {
  selectedOption.value = option;
  itemsDialogOpen.value = true;
  optionItems.value = [];
  void loadItems();
};

const openItemForm = (item = null) => {
  if (item) {
    itemForm.value = {
      id: item.id,
      name: item.name,
      price: item.price,
      is_active: Boolean(item.is_active),
    };
  } else {
    resetItemForm();
  }
  itemFormOpen.value = true;
};

const normalizeChoiceValue = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const refresh = async () => {
  loading.value = true;
  try {
    const { data } = await apiService.getProdutos();
    const list = data?.data ?? data?.products ?? data ?? [];
    products.value = Array.isArray(list) ? list.map(normalizeProduct) : [];
  } catch (error) {
    console.warn("Falha ao carregar produtos", error);
    notify({
      type: "negative",
      message: "Não foi possível carregar os produtos.",
    });
  } finally {
    loading.value = false;
  }
};

const loadOptions = async () => {
  if (!selectedProduct.value?.id) return;
  optionsLoading.value = true;
  try {
    const { data } = await apiService.listOpcoesProduto(
      selectedProduct.value.id
    );
    const list = data?.data ?? data?.options ?? data ?? [];
    options.value = Array.isArray(list) ? list.map(normalizeOption) : [];
  } catch (error) {
    console.warn("Falha ao carregar opções", error);
    notify({
      type: "negative",
      message: "Não foi possível carregar as opções.",
    });
  } finally {
    optionsLoading.value = false;
  }
};

const loadItems = async () => {
  if (!selectedOption.value?.id) return;
  itemsLoading.value = true;
  try {
    const { data } = await apiService.listItensOpcao(selectedOption.value.id);
    const list = data?.data ?? data?.items ?? data ?? [];
    optionItems.value = Array.isArray(list) ? list.map(normalizeItem) : [];
  } catch (error) {
    console.warn("Falha ao carregar itens da opção", error);
    notify({
      type: "negative",
      message: "Não foi possível carregar os itens da opção.",
    });
  } finally {
    itemsLoading.value = false;
  }
};

const saveProduct = async () => {
  saving.value = true;
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || null,
      base_price: Number(form.value.base_price || 0),
      image_url: form.value.image_url || null,
      has_options: Boolean(form.value.has_options),
      is_active: Boolean(form.value.is_active),
    };

    if (form.value.id) {
      await apiService.updateProduto(form.value.id, payload);
      notify({ type: "positive", message: "Produto atualizado." });
    } else {
      await apiService.createProduto(payload);
      notify({ type: "positive", message: "Produto criado." });
    }

    dialogOpen.value = false;
    await refresh();
  } catch (error) {
    console.warn("Falha ao salvar produto", error);
    notify({
      type: "negative",
      message: "Não foi possível salvar o produto.",
    });
  } finally {
    saving.value = false;
  }
};

const saveOption = async () => {
  if (!selectedProduct.value?.id) return;
  optionSaving.value = true;
  try {
    const payload = {
      name: optionForm.value.name,
      type: optionForm.value.type,
      required: Boolean(optionForm.value.required),
      min_choices: normalizeChoiceValue(optionForm.value.min_choices),
      max_choices: normalizeChoiceValue(optionForm.value.max_choices),
    };

    if (optionForm.value.id) {
      await apiService.updateOpcaoProduto(
        selectedProduct.value.id,
        optionForm.value.id,
        payload
      );
      notify({ type: "positive", message: "Opção atualizada." });
    } else {
      await apiService.createOpcaoProduto(selectedProduct.value.id, payload);
      notify({ type: "positive", message: "Opção criada." });
    }

    optionFormOpen.value = false;
    await loadOptions();
  } catch (error) {
    console.warn("Falha ao salvar opção", error);
    notify({
      type: "negative",
      message: "Não foi possível salvar a opção.",
    });
  } finally {
    optionSaving.value = false;
  }
};

const saveItem = async () => {
  if (!selectedOption.value?.id) return;
  itemSaving.value = true;
  try {
    const payload = {
      name: itemForm.value.name,
      price: Number(itemForm.value.price || 0),
      is_active: Boolean(itemForm.value.is_active),
    };

    if (itemForm.value.id) {
      await apiService.updateItemOpcao(
        selectedOption.value.id,
        itemForm.value.id,
        payload
      );
      notify({ type: "positive", message: "Item atualizado." });
    } else {
      await apiService.createItemOpcao(selectedOption.value.id, payload);
      notify({ type: "positive", message: "Item criado." });
    }

    itemFormOpen.value = false;
    await loadItems();
  } catch (error) {
    console.warn("Falha ao salvar item", error);
    notify({
      type: "negative",
      message: "Não foi possível salvar o item.",
    });
  } finally {
    itemSaving.value = false;
  }
};

const confirmDisable = (product) => {
  Dialog.create({
    title: "Desativar produto",
    message: `Deseja desativar ${product.name}?`,
    cancel: true,
    persistent: true,
    ok: { label: "Desativar", color: "negative" },
  }).onOk(() => disableProduct(product));
};

const confirmDeleteOption = (option) => {
  Dialog.create({
    title: "Excluir opção",
    message: `Deseja excluir ${option.name}?`,
    cancel: true,
    persistent: true,
    ok: { label: "Excluir", color: "negative" },
  }).onOk(() => deleteOption(option));
};

const deleteOption = async (option) => {
  if (!selectedProduct.value?.id) return;
  try {
    await apiService.deleteOpcaoProduto(selectedProduct.value.id, option.id);
    notify({ type: "positive", message: "Opção excluída." });
    await loadOptions();
  } catch (error) {
    console.warn("Falha ao excluir opção", error);
    notify({
      type: "negative",
      message: "Não foi possível excluir a opção.",
    });
  }
};

const confirmDeleteItem = (item) => {
  Dialog.create({
    title: "Excluir item",
    message: `Deseja excluir ${item.name}?`,
    cancel: true,
    persistent: true,
    ok: { label: "Excluir", color: "negative" },
  }).onOk(() => deleteItem(item));
};

const deleteItem = async (item) => {
  if (!selectedOption.value?.id) return;
  try {
    await apiService.deleteItemOpcao(selectedOption.value.id, item.id);
    notify({ type: "positive", message: "Item excluído." });
    await loadItems();
  } catch (error) {
    console.warn("Falha ao excluir item", error);
    notify({
      type: "negative",
      message: "Não foi possível excluir o item.",
    });
  }
};

const disableProduct = async (product) => {
  try {
    await apiService.deleteProduto(product.id);
    notify({ type: "positive", message: "Produto desativado." });
    await refresh();
  } catch (error) {
    console.warn("Falha ao desativar produto", error);
    notify({
      type: "negative",
      message: "Não foi possível desativar o produto.",
    });
  }
};

onMounted(() => {
  void refresh();
});
</script>

<style scoped>
.products-table :deep(th) {
  font-weight: 600;
}

.product-dialog {
  width: 100%;
  max-width: 640px;
  border-radius: 14px;
}

.options-dialog,
.items-dialog,
.option-form-dialog,
.item-form-dialog {
  width: 100%;
  max-width: 720px;
  border-radius: 14px;
}
</style>
