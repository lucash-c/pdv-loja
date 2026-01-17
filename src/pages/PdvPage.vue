<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h6">PDV</div>
      <q-space />
      <q-btn
        outline
        color="primary"
        icon="refresh"
        label="Atualizar cardápio"
        :loading="menuLoading"
        @click="loadMenu"
      />
    </div>

    <q-banner
      v-if="!lojaPublicKey"
      dense
      class="bg-orange-1 text-orange-10 q-mb-md rounded-borders"
    >
      <template #avatar><q-icon name="warning" /></template>
      Chave pública da loja não encontrada. Gere ou selecione uma loja válida.
    </q-banner>

    <q-banner
      v-else-if="menuError"
      dense
      class="bg-red-1 text-red-10 q-mb-md rounded-borders"
    >
      <template #avatar><q-icon name="error" /></template>
      Não foi possível carregar o cardápio. Tente novamente.
    </q-banner>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-7">
        <q-card class="q-mb-md">
          <q-card-section class="row items-center q-gutter-sm">
            <q-input
              v-model="search"
              outlined
              dense
              clearable
              debounce="250"
              placeholder="Buscar item"
              class="col"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </q-card-section>
        </q-card>

        <div v-if="menuLoading" class="row justify-center q-pa-lg">
          <q-spinner size="32px" color="primary" />
        </div>

        <div v-else class="row q-col-gutter-md">
          <div
            v-for="item in filteredMenuItems"
            :key="item.id"
            class="col-12 col-md-6"
          >
            <PdvMenuItemCard :item="item" @add="addToCart" />
          </div>

          <div v-if="!filteredMenuItems.length" class="col-12">
            <q-card>
              <q-card-section class="text-grey-6">
                Nenhum item encontrado.
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-5">
        <PdvCartPanel
          :items="cartItems"
          :total="cartTotal"
          @increase="increaseQty"
          @decrease="decreaseQty"
          @remove="removeFromCart"
          @update-observation="updateItemObservation"
        />

        <PdvOrderForm
          v-model:customer-name="orderForm.customerName"
          v-model:customer-whatsapp="orderForm.customerWhatsapp"
          v-model:delivery-address="orderForm.deliveryAddress"
          v-model:order-type="orderForm.orderType"
          v-model:payment-method="orderForm.paymentMethod"
          v-model:notes="orderForm.notes"
          :payment-options="paymentOptions"
          :order-type-options="orderTypeOptions"
          :delivery-disabled="orderForm.orderType !== 'entrega'"
        />

        <q-card class="q-mt-md">
          <q-card-section>
            <q-btn
              color="primary"
              class="full-width"
              icon="send"
              label="Enviar pedido"
              :loading="submitLoading"
              :disable="!canSubmit"
              @click="submitOrder"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <PdvOptionsDialog
      v-model="optionsDialogOpen"
      :item-name="selectedMenuItem?.name || 'Item'"
      :options="optionGroups"
      :selection="optionSelections"
      :loading="optionsLoading"
      :error="optionsError"
      :can-confirm="canConfirmOptions"
      :validation-message="optionsValidation"
      @selection-change="handleSelectionChange"
      @confirm="confirmOptions"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import apiService from "src/services/api";
import { useAuthStore } from "src/stores/authStore";
import PdvMenuItemCard from "src/components/pdv/PdvMenuItemCard.vue";
import PdvCartPanel from "src/components/pdv/PdvCartPanel.vue";
import PdvOrderForm from "src/components/pdv/PdvOrderForm.vue";
import PdvOptionsDialog from "src/components/pdv/PdvOptionsDialog.vue";

const $q = useQuasar();
const authStore = useAuthStore();

const search = ref("");
const menuLoading = ref(false);
const menuError = ref(false);
const menuItems = ref([]);

const cartItems = ref([]);
const submitLoading = ref(false);

const paymentOptions = ["PIX", "Cartão", "Dinheiro", "Outro"];
const orderTypeOptions = [
  { label: "Entrega", value: "entrega" },
  { label: "Retirada", value: "retirada" },
  { label: "Local", value: "local" },
];

const optionsDialogOpen = ref(false);
const optionsLoading = ref(false);
const optionsError = ref(false);
const optionsValidation = ref("");
const selectedMenuItem = ref(null);
const optionGroups = ref([]);
const optionSelections = ref({});

const orderForm = reactive({
  customerName: "",
  customerWhatsapp: "",
  deliveryAddress: "",
  orderType: "entrega",
  paymentMethod: "PIX",
  notes: "",
});

const lojaPublicKey = computed(
  () =>
    authStore.selectedLoja?.public_key ||
    authStore.selectedLoja?.publicKey ||
    authStore.loja?.public_key ||
    authStore.loja?.publicKey ||
    authStore.userLoja?.public_key ||
    null
);

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const normalizeMenuPayload = (data) => data?.data ?? data?.menu ?? data ?? {};

const extractMenuItems = (payload) => {
  if (Array.isArray(payload)) return payload;

  const direct =
    payload?.items ||
    payload?.products ||
    payload?.itens ||
    payload?.menu_items;
  if (Array.isArray(direct)) return direct;

  const categories = payload?.categories || payload?.categorias || [];
  if (Array.isArray(categories)) {
    return categories.flatMap((cat) => {
      const inner =
        cat?.items || cat?.products || cat?.itens || cat?.menu_items || [];
      return Array.isArray(inner) ? inner : [];
    });
  }

  return [];
};

const mapMenuItem = (item, index) => ({
  id:
    item?.id ||
    item?.product_id ||
    item?.sku ||
    item?.code ||
    `${item?.name || "item"}-${index}`,
  productId: item?.product_id || item?.id || null,
  name: item?.name || item?.product_name || item?.title || "Produto",
  description: item?.description || item?.details || item?.obs || "",
  price:
    Number(
      item?.price ?? item?.base_price ?? item?.unit_price ?? item?.valor ?? 0
    ) || 0,
  image: item?.image_url || item?.image || item?.photo_url || "",
  hasOptions: Boolean(
    item?.has_options ?? item?.hasOptions ?? item?.options?.length
  ),
  options: item?.options || [],
  isActive: item?.is_active !== false && item?.active !== false,
});

const resolveChargeType = (value) => {
  if (value === "sum") return "sum";
  if (value === "highest") return "highest";
  if (value === "average") return "average";
  if (value === "single") return "highest";
  if (value === "multiple") return "sum";
  return "sum";
};

const normalizeOption = (option) => ({
  id: option?.id ?? option?._id ?? option?.option_id ?? null,
  name: option?.name ?? option?.title ?? "Opção",
  chargeType: resolveChargeType(option?.type ?? option?.option_type),
  required: Boolean(option?.required ?? option?.is_required ?? false),
  min_choices: option?.min_choices ?? option?.minChoices ?? option?.min ?? null,
  max_choices: option?.max_choices ?? option?.maxChoices ?? option?.max ?? null,
  items: [],
  itemsRaw: [],
});

const normalizeOptionItem = (item) => ({
  id: item?.id ?? item?._id ?? item?.item_id ?? null,
  name: item?.name ?? item?.title ?? "Item",
  price: Number(item?.price ?? item?.value ?? item?.valor ?? 0),
  is_active: item?.is_active ?? item?.isActive ?? true,
});

const buildOptionLabel = (item) => {
  if (Number(item.price || 0) <= 0) return item.name;
  return `${item.name} (+${formatMoney(item.price)})`;
};

const filteredMenuItems = computed(() => {
  const q = String(search.value || "")
    .trim()
    .toLowerCase();
  return menuItems.value
    .filter((item) => item.isActive)
    .filter((item) => {
      if (!q) return true;
      const blob = `${item.name} ${item.description}`.toLowerCase();
      return blob.includes(q);
    });
});

const cartTotal = computed(() =>
  cartItems.value.reduce(
    (sum, item) =>
      sum + (item.unitPriceWithOptions || item.unitPrice || 0) * item.quantity,
    0
  )
);

const canSubmit = computed(
  () =>
    !!lojaPublicKey.value && cartItems.value.length > 0 && !submitLoading.value
);

const loadMenu = async () => {
  if (!lojaPublicKey.value) return;
  menuLoading.value = true;
  menuError.value = false;

  try {
    const { data } = await apiService.getPublicMenu(lojaPublicKey.value);
    const payload = normalizeMenuPayload(data);
    const items = extractMenuItems(payload);
    menuItems.value = items.map(mapMenuItem).filter((item) => item.name);
  } catch (error) {
    console.error("Falha ao carregar cardápio", error);
    menuError.value = true;
  } finally {
    menuLoading.value = false;
  }
};

const resetOptionState = () => {
  optionSelections.value = {};
  optionGroups.value = [];
  optionsValidation.value = "";
  optionsError.value = false;
};

const loadOptionsForItem = async (item) => {
  if (!item?.productId) return;
  optionsLoading.value = true;
  optionsError.value = false;
  try {
    const { data } = await apiService.listOpcoesProduto(item.productId);
    const list = data?.data ?? data?.options ?? data ?? [];
    const normalized = Array.isArray(list) ? list.map(normalizeOption) : [];

    const optionEntries = await Promise.all(
      normalized.map(async (option) => {
        try {
          const { data: itemsData } = await apiService.listItensOpcao(
            option.id
          );
          const itemsList =
            itemsData?.data ?? itemsData?.items ?? itemsData ?? [];
          const items = Array.isArray(itemsList)
            ? itemsList.map(normalizeOptionItem)
            : [];
          option.itemsRaw = items;
          option.items = items.map((optItem) => ({
            label: buildOptionLabel(optItem),
            value: optItem.id,
            disable: !optItem.is_active,
          }));
        } catch (error) {
          console.warn("Falha ao carregar itens da opção", error);
          option.itemsRaw = [];
          option.items = [];
        }
        return option;
      })
    );

    optionGroups.value = optionEntries.filter((option) => option.id);
  } catch (error) {
    console.error("Falha ao carregar opções", error);
    optionsError.value = true;
  } finally {
    optionsLoading.value = false;
  }
};

const openOptionsDialog = async (item) => {
  selectedMenuItem.value = item;
  resetOptionState();
  optionsDialogOpen.value = true;
  if (!item?.productId) {
    optionsDialogOpen.value = false;
    addItemToCart(item, []);
    return;
  }
  await loadOptionsForItem(item);

  if (!optionGroups.value.length) {
    optionsDialogOpen.value = false;
    addItemToCart(item, []);
  }
};

const isMultipleChoice = (option) => {
  if (!option) return true;
  const max = option.max_choices;
  if (max === null || max === undefined) return true;
  const parsed = Number(max);
  if (Number.isNaN(parsed)) return true;
  return parsed > 1;
};

const calculateOptionsPrice = (selectedOptions = []) => {
  const grouped = new Map();
  selectedOptions.forEach((opt) => {
    if (!grouped.has(opt.optionId)) {
      grouped.set(opt.optionId, { chargeType: opt.chargeType, prices: [] });
    }
    grouped.get(opt.optionId).prices.push(Number(opt.price || 0));
  });

  let total = 0;
  grouped.forEach(({ chargeType, prices }) => {
    if (!prices.length) return;
    if (chargeType === "highest") {
      total += Math.max(...prices);
      return;
    }
    if (chargeType === "average") {
      total += prices.reduce((sum, price) => sum + price, 0) / prices.length;
      return;
    }
    total += prices.reduce((sum, price) => sum + price, 0);
  });
  return total;
};

const addItemToCart = (item, selectedOptions = []) => {
  const signature = buildOptionSignature(selectedOptions);
  const existing = cartItems.value.find(
    (it) => it.productId === item.productId && it.optionSignature === signature
  );
  if (existing) {
    existing.quantity += 1;
    return;
  }

  const optionsPrice = calculateOptionsPrice(selectedOptions);
  const unitPriceWithOptions = item.price + optionsPrice;

  cartItems.value.push({
    id: `${item.productId || item.id}-${signature || "base"}`,
    productId: item.productId || item.id,
    name: item.name,
    unitPrice: item.price,
    unitPriceWithOptions,
    quantity: 1,
    options: selectedOptions,
    optionSignature: signature,
    observation: "",
  });
};

const addToCart = (item) => {
  if (item?.hasOptions) {
    void openOptionsDialog(item);
    return;
  }
  addItemToCart(item, []);
};

const increaseQty = (item) => {
  const target = cartItems.value.find((it) => it.id === item.id);
  if (target) target.quantity += 1;
};

const decreaseQty = (item) => {
  const target = cartItems.value.find((it) => it.id === item.id);
  if (!target) return;
  if (target.quantity <= 1) {
    cartItems.value = cartItems.value.filter((it) => it.id !== item.id);
    return;
  }
  target.quantity -= 1;
};

const removeFromCart = (item) => {
  cartItems.value = cartItems.value.filter((it) => it.id !== item.id);
};

const updateItemObservation = ({ item, value }) => {
  const target = cartItems.value.find((it) => it.id === item.id);
  if (target) {
    target.observation = value;
  }
};

const buildOptionSignature = (options) => {
  if (!Array.isArray(options) || !options.length) return "";
  return options
    .map((opt) => `${opt.optionId}:${opt.itemId}`)
    .sort()
    .join("|");
};

const handleSelectionChange = ({ option, value }) => {
  if (!option?.id) return;
  if (isMultipleChoice(option)) {
    const next = Array.isArray(value) ? value : [];
    if (option.max_choices && next.length > option.max_choices) {
      $q.notify({
        type: "warning",
        message: `Selecione no máximo ${option.max_choices} itens em ${option.name}.`,
      });
      return;
    }
    optionSelections.value = {
      ...optionSelections.value,
      [option.id]: next,
    };
  } else {
    optionSelections.value = {
      ...optionSelections.value,
      [option.id]: value,
    };
  }
  optionsValidation.value = "";
};

const validateOptions = () => {
  for (const option of optionGroups.value) {
    const selection = optionSelections.value?.[option.id];
    const values = isMultipleChoice(option) ? selection || [] : [selection];
    const filled = values.filter(Boolean);

    if (option.required && filled.length === 0) {
      optionsValidation.value = `Selecione ${option.name}.`;
      return false;
    }

    if (option.min_choices && filled.length < option.min_choices) {
      optionsValidation.value = `Selecione ao menos ${option.min_choices} itens em ${option.name}.`;
      return false;
    }

    if (option.max_choices && filled.length > option.max_choices) {
      optionsValidation.value = `Selecione no máximo ${option.max_choices} itens em ${option.name}.`;
      return false;
    }
  }
  optionsValidation.value = "";
  return true;
};

const buildSelectedOptions = () => {
  const selections = optionSelections.value || {};
  const selected = [];

  optionGroups.value.forEach((option) => {
    const selection = selections[option.id];
    const ids =
      isMultipleChoice(option)
        ? Array.isArray(selection)
          ? selection
          : []
        : selection
        ? [selection]
        : [];

    ids.forEach((id) => {
      const optionItem = option.itemsRaw.find((item) => item.id === id);
      if (!optionItem) return;
      selected.push({
        optionId: option.id,
        optionName: option.name,
        itemId: optionItem.id,
        itemName: optionItem.name,
        price: Number(optionItem.price || 0),
        chargeType: option.chargeType,
      });
    });
  });

  return selected;
};

const confirmOptions = () => {
  if (!selectedMenuItem.value) return;
  if (!validateOptions()) return;
  const selectedOptions = buildSelectedOptions();
  addItemToCart(selectedMenuItem.value, selectedOptions);
  optionsDialogOpen.value = false;
};

const canConfirmOptions = computed(() => !optionsLoading.value);

const buildPayload = () => ({
  external_id: `PDV-${Date.now()}`,
  customer_name: orderForm.customerName || "Cliente balcão",
  customer_whatsapp: "+55 " + orderForm.customerWhatsapp || undefined,
  delivery_address:
    orderForm.orderType === "entrega"
      ? orderForm.deliveryAddress || undefined
      : undefined,
  payment_method: orderForm.paymentMethod || "PIX",
  total: cartTotal.value,
  notes: orderForm.notes || undefined,
  order_type: orderForm.orderType || "entrega",
  items: cartItems.value.map((item) => ({
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.unitPriceWithOptions ?? item.unitPrice,
    observation: item.observation?.trim() || undefined,
    options: item.options?.map((opt) => ({
      option_id: opt.optionId,
      option_name: opt.optionName,
      item_id: opt.itemId,
      item_name: opt.itemName,
      price: opt.price,
    })),
  })),
});

const resetForm = () => {
  cartItems.value = [];
  orderForm.customerName = "";
  orderForm.customerWhatsapp = "";
  orderForm.deliveryAddress = "";
  orderForm.orderType = "entrega";
  orderForm.notes = "";
  orderForm.paymentMethod = "PIX";
};

const submitOrder = async () => {
  if (!canSubmit.value) return;

  submitLoading.value = true;
  try {
    const payload = buildPayload();
    const { data } = await apiService.createPedidoPublic(
      lojaPublicKey.value,
      payload
    );

    const pedido = data?.data ?? data?.pedido ?? data;
    const pedidoId = pedido?.id || pedido?.order_id || pedido?._id || null;

    if (pedidoId) {
      await apiService.updateStatusPedido(pedidoId, {
        status: "em preparo",
      });
    }

    $q.notify({
      type: "positive",
      message: `Pedido enviado. Total ${formatMoney(cartTotal.value)}.`,
    });

    resetForm();
  } catch (error) {
    console.error("Falha ao enviar pedido", error);
    $q.notify({
      type: "negative",
      message: "Não foi possível enviar o pedido. Tente novamente.",
    });
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => {
  if (lojaPublicKey.value) void loadMenu();
});

watch(lojaPublicKey, (value) => {
  if (value) void loadMenu();
});

watch(
  () => orderForm.orderType,
  (value) => {
    if (value !== "entrega") {
      orderForm.deliveryAddress = "";
    }
  }
);
</script>
