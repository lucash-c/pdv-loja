<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h6">Produtos</div>

      <q-space />

      <q-btn
        outline
        color="primary"
        icon="refresh"
        label="Atualizar"
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

const pagination = {
  rowsPerPage: 10,
};

const products = ref([]);

const form = ref({
  id: null,
  name: "",
  description: "",
  base_price: null,
  image_url: "",
  has_options: false,
  is_active: true,
});

const columns = [
  { name: "name", label: "Produto", field: "name", align: "left" },
  { name: "price", label: "Preço", field: "base_price", align: "left" },
  { name: "status", label: "Status", field: "is_active", align: "left" },
  { name: "options", label: "Opções", field: "has_options", align: "left" },
  { name: "actions", label: "Ações", field: "actions", align: "right" },
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
    is_active:
      p?.is_active ?? p?.isActive ?? p?.active ?? statusActive ?? true,
  };
};

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

const openCreateDialog = () => {
  resetForm();
  dialogOpen.value = true;
};

const openEditDialog = (product) => {
  form.value = { ...product };
  dialogOpen.value = true;
};

const refresh = async () => {
  loading.value = true;
  try {
    const { data } = await apiService.getProdutos();
    const list = data?.data ?? data?.products ?? data ?? [];
    products.value = Array.isArray(list)
      ? list.map(normalizeProduct)
      : [];
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

const confirmDisable = (product) => {
  Dialog.create({
    title: "Desativar produto",
    message: `Deseja desativar ${product.name}?`,
    cancel: true,
    persistent: true,
    ok: { label: "Desativar", color: "negative" },
  }).onOk(() => disableProduct(product));
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
</style>
