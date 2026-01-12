<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h6">Pedidos do Dia</div>

      <q-space />

      <q-btn
        outline
        color="primary"
        icon="refresh"
        :loading="loading"
        @click="refresh"
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
          placeholder="Buscar por cliente, telefone, id..."
          class="col"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <q-btn
          outline
          color="primary"
          icon="tune"
          label="Filtros"
          @click="filtersOpen = true"
        />
      </q-card-section>
    </q-card>

    <q-banner
      v-if="!isStoreOpen"
      dense
      class="bg-orange-1 text-orange-10 q-mb-md rounded-borders"
    >
      <template #avatar><q-icon name="warning" /></template>
      Loja fechada: não é possível aceitar pedidos.
    </q-banner>

    <q-banner
      v-else-if="credits <= 0"
      dense
      class="bg-orange-1 text-orange-10 q-mb-md rounded-borders"
    >
      <template #avatar><q-icon name="warning" /></template>
      Créditos insuficientes: recarregue para aceitar novos pedidos.
    </q-banner>

    <div class="row q-col-gutter-md">
      <div v-for="col in columns" :key="col.key" class="col-12 col-md-4">
        <q-card>
          <q-card-section class="row items-center">
            <div class="text-subtitle1 text-weight-medium">{{ col.title }}</div>
            <q-space />
            <q-badge :color="col.countColor" outline>{{
              col.list.length
            }}</q-badge>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none">
            <q-list separator>
              <q-item v-if="!col.list.length" class="q-pa-md">
                <q-item-section class="text-grey-7">{{
                  col.emptyText
                }}</q-item-section>
              </q-item>

              <q-item
                v-for="p in col.list"
                :key="pKey(p)"
                clickable
                v-ripple
                @click="openPedido(p)"
              >
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ displayId(p) }} • {{ customerName(p) || "Cliente" }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ formatTime(p) }} • {{ formatTotal(p) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-badge :color="col.statusColor" outline>{{
                    col.statusLabel
                  }}</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Component: Dialog Pedido -->
    <DialogPedido
      v-model="pedidoDialog"
      :pedido="selectedPedido"
      :action-loading="actionLoading"
      :can-accept="canAccept"
      :is-store-open="isStoreOpen"
      :credits="credits"
      :display-id="displayId"
      :customer-name="customerName"
      :customer-phone="customerPhone"
      :status-label="statusLabel"
      :format-date-time="formatDateTime"
      :format-total="formatTotal"
      :address-text="addressText"
      :pedido-items="pedidoItems"
      :item-qty="itemQty"
      :item-name="itemName"
      :item-obs="itemObs"
      :item-price-text="itemPriceText"
      :is-aguardando="isAguardando"
      :is-em-preparo="isEmPreparo"
      @aceitar="aceitar"
      @rejeitar="rejeitar"
      @despachar="despachar"
      @print="onPrint"
      @whatsapp="onWhatsApp"
    />

    <!-- Component: Alerta Novo Pedido (agora baseado na janela de 5 min) -->
    <AlertaNovoPedido
      v-model="novoPedidoDialog"
      :pedido="novoPedido"
      :action-loading="actionLoading"
      :can-accept="canAccept"
      :is-store-open="isStoreOpen"
      :credits="credits"
      :display-id="displayId"
      :customer-name="customerName"
      :format-total="formatTotal"
      :format-time="formatTime"
      @ver-detalhes="openPedido"
      @aceitar="aceitar"
      @rejeitar="rejeitar"
    />

    <!-- Dialog filtros -->
    <q-dialog v-model="filtersOpen">
      <q-card class="filters-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Filtros</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-sm">
          <q-toggle v-model="onlyToday" label="Apenas pedidos de hoje" />
          <q-toggle v-model="hideDespachados" label="Ocultar despachados" />
          <q-toggle
            v-model="autoSound"
            label="Tocar som ao chegar pedido (repetir)"
          />
          <q-toggle
            v-model="autoPopup"
            label="Abrir diálogo automático de novo pedido"
          />
          <q-toggle
            v-model="autoPrintOnAccept"
            label="Imprimir automaticamente ao aceitar"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Fechar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { LocalStorage, useQuasar } from "quasar";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import apiService from "src/services/api";
import { useAuthStore } from "src/stores/authStore";
import { usePedidosStore } from "src/stores/pedidosStore";

import DialogPedido from "src/components/pedidos/DialogPedido.vue";
import AlertaNovoPedido from "src/components/pedidos/AlertaNovoPedido.vue";

import { openWhatsApp } from "src/utils/whatsappLink";
import { printPedido as printPedidoUtil } from "src/utils/printPedido";

const $q = useQuasar();
const authStore = useAuthStore();
const pedidosStore = usePedidosStore();

/**
 * Estado / Preferências
 */
const search = ref("");
const filtersOpen = ref(false);

const onlyToday = ref(LocalStorage.getItem("pdv.onlyToday") ?? true);
const hideDespachados = ref(
  LocalStorage.getItem("pdv.hideDespachados") ?? false
);
const autoSound = ref(LocalStorage.getItem("pdv.autoSound") ?? true);
const autoPopup = ref(LocalStorage.getItem("pdv.autoPopup") ?? true);
const autoPrintOnAccept = ref(
  LocalStorage.getItem("pdv.autoPrintOnAccept") ?? true
);

watch(onlyToday, (v) => LocalStorage.set("pdv.onlyToday", !!v));
watch(hideDespachados, (v) => LocalStorage.set("pdv.hideDespachados", !!v));
watch(autoSound, (v) => LocalStorage.set("pdv.autoSound", !!v));
watch(autoPopup, (v) => LocalStorage.set("pdv.autoPopup", !!v));
watch(autoPrintOnAccept, (v) => LocalStorage.set("pdv.autoPrintOnAccept", !!v));

const pedidoDialog = ref(false);
const selectedPedido = ref(null);

const novoPedidoDialog = ref(false);
const novoPedido = ref(null);

const actionLoading = ref(false);

/**
 * Computeds (dados da loja)
 */
const credits = computed(
  () => authStore?.userLoja?.credits ?? authStore?.credits ?? 0
);
const isStoreOpen = computed(() => !!authStore.isStoreOpen);
const loading = computed(() => !!pedidosStore.loading);

const lojaId = computed(
  () =>
    authStore.loja?.id ||
    authStore.userLoja?.loja_id ||
    authStore.userLoja?.store_id ||
    null
);

const canAccept = computed(() => isStoreOpen.value && credits.value > 0);
const CREDIT_PER_ACCEPT = 1;

/**
 * Janela de aceite (5 minutos)
 */
const ACCEPT_WINDOW_MS = 5 * 60 * 1000;

const nowTick = ref(Date.now());
let nowTimer = null;

/**
 * Helpers de pedido
 */
const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const pKey = (p) => p?.id || p?.external_id || p?._id || JSON.stringify(p);
const createdAt = (p) =>
  p?.created_at || p?.createdAt || p?.created || p?.date || null;

const createdAtMs = (p) => {
  const c = createdAt(p);
  if (!c) return null;
  const dt = new Date(c);
  const t = dt.getTime();
  return Number.isNaN(t) ? null : t;
};

const isToday = (p) => {
  const c = createdAt(p);
  if (!c) return true;
  return String(c).startsWith(todayKey());
};

const normalizeStatus = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

const statusMatchers = {
  aguardando: (s) =>
    s === "aguardando" ||
    s === "aguardando aceite" ||
    s === "aguardando aceite da loja" ||
    s === "pending" ||
    s === "novo" ||
    s === "new" ||
    s === "recebido",
  emPreparo: (s) =>
    s === "em preparo" ||
    s === "preparo" ||
    s === "preparing" ||
    s === "aceito",
  despachado: (s) =>
    s === "despachado" ||
    s === "enviado" ||
    s === "shipped" ||
    s === "out_for_delivery",
  cancelado: (s) =>
    s === "cancelado" ||
    s === "rejeitado" ||
    s === "canceled" ||
    s === "cancelled" ||
    s === "rejected",
};

const isAguardandoRaw = (p) =>
  statusMatchers.aguardando(normalizeStatus(p?.status));
const isEmPreparo = (p) => statusMatchers.emPreparo(normalizeStatus(p?.status));
const isDespachado = (p) =>
  statusMatchers.despachado(normalizeStatus(p?.status));
const isCancelado = (p) => statusMatchers.cancelado(normalizeStatus(p?.status));

const isWithinAcceptWindow = (p) => {
  const t = createdAtMs(p);
  if (!t) return true; // fallback: se não tem data, não bloqueia
  return nowTick.value - t <= ACCEPT_WINDOW_MS;
};

/**
 * Aguardando agora significa: status aguardando + dentro da janela de 5 min
 * (Não existe mais coluna, mas ainda é usado pra ações/popup/som)
 */
const isAguardando = (p) => isAguardandoRaw(p) && isWithinAcceptWindow(p);

const statusLabel = (p) => {
  if (!p) return "-";
  // Se passou a janela, evitamos chamar de "Aguardando"
  if (isAguardandoRaw(p) && !isWithinAcceptWindow(p)) return "Expirado";
  if (isAguardando(p)) return "Aguardando";
  if (isEmPreparo(p)) return "Em preparo";
  if (isDespachado(p)) return "Despachado";
  if (isCancelado(p)) return "Cancelado";
  const s = normalizeStatus(p?.status);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "-";
};

const displayId = (p) => p?.external_id || p?.id || "-";

const customerName = (p) =>
  p?.customer?.name ||
  p?.cliente?.nome ||
  p?.client?.name ||
  p?.name ||
  p?.customer_name ||
  null;

const customerPhone = (p) =>
  p?.customer?.phone ||
  p?.customer?.whatsapp ||
  p?.cliente?.telefone ||
  p?.cliente?.whatsapp ||
  p?.phone ||
  p?.whatsapp ||
  p?.customer_whatsapp ||
  p?.customer_phone ||
  null;

const formatMoney = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const pedidoTotal = (p) =>
  p?.total || p?.total_price || p?.amount_total || p?.valor_total || 0;
const formatTotal = (p) => formatMoney(pedidoTotal(p));

const formatTime = (p) => {
  const c = createdAt(p);
  if (!c) return "--:--";
  const dt = new Date(c);
  if (Number.isNaN(dt.getTime())) return "--:--";
  return dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (p) => {
  const c = createdAt(p);
  if (!c) return null;
  const dt = new Date(c);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleString("pt-BR");
};

const addressText = (p) => {
  const addr =
    p?.delivery?.address ||
    p?.delivery_address ||
    p?.endereco ||
    p?.address ||
    p?.customer?.address ||
    p?.cliente?.endereco ||
    null;

  const obs = p?.notes || p?.observacoes || p?.obs || p?.observation || null;

  if (addr && obs) return `${addr}\n\nObs: ${obs}`;
  return addr || (obs ? `Obs: ${obs}` : null);
};

const pedidoItems = (p) => {
  const items = p?.items || p?.itens || p?.products || p?.order_items || [];
  return Array.isArray(items) ? items : [];
};

const itemQty = (it) => it?.quantity || it?.qty || it?.qtd || 1;
const itemName = (it) =>
  it?.name ||
  it?.product_name ||
  it?.produto?.name ||
  it?.produto_nome ||
  "Item";
const formatOptionEntry = (entry) => {
  if (entry == null) return null;
  if (typeof entry === "string" || typeof entry === "number") {
    return String(entry);
  }

  if (typeof entry === "object") {
    const name =
      entry?.name ||
      entry?.item_name ||
      entry?.option_name ||
      entry?.title ||
      entry?.label ||
      entry?.option_item?.name ||
      entry?.optionItem?.name ||
      entry?.product_option_item?.name ||
      entry?.productOptionItem?.name ||
      null;
    const price =
      entry?.price ??
      entry?.unit_price ??
      entry?.valor ??
      entry?.amount ??
      null;
    if (name && price) return `${name} (${formatMoney(price)})`;
    return name || (price ? formatMoney(price) : null);
  }

  return null;
};

const formatOptionsGroup = (group) => {
  if (group == null) return null;

  if (typeof group === "string" || typeof group === "number") {
    return String(group);
  }

  if (typeof group === "object") {
    const groupName =
      group?.name ||
      group?.option_name ||
      group?.title ||
      group?.label ||
      group?.option?.name ||
      group?.option?.title ||
      group?.option?.label ||
      null;
    const groupItems =
      group?.items ||
      group?.itens ||
      group?.values ||
      group?.options ||
      group?.option_items ||
      group?.selected_items ||
      group?.selectedItems ||
      group?.items_selected ||
      group?.selected_options ||
      group?.selectedOptions ||
      group?.option?.items ||
      [];
    const inlineItem =
      group?.item_name ||
      group?.itemName ||
      group?.item?.name ||
      group?.item?.title ||
      group?.option_item?.name ||
      group?.optionItem?.name ||
      null;
    const itemsText = Array.isArray(groupItems)
      ? groupItems.map(formatOptionEntry).filter(Boolean).join(", ")
      : formatOptionEntry(groupItems);
    if (groupName && itemsText) return `${groupName}: ${itemsText}`;
    if (groupName && inlineItem) return `${groupName}: ${inlineItem}`;
    return itemsText || inlineItem || groupName;
  }

  return null;
};

const formatFlatSelections = (raw) => {
  const grouped = new Map();

  raw.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const optionLabel =
      entry?.option_name ||
      entry?.optionName ||
      entry?.option?.name ||
      entry?.option?.title ||
      entry?.option?.label ||
      entry?.group ||
      entry?.name ||
      null;
    const optionKey =
      entry?.option_id || entry?.optionId || optionLabel || "Opções";
    const itemLabel =
      entry?.item_name ||
      entry?.itemName ||
      entry?.item?.name ||
      entry?.item?.title ||
      entry?.name ||
      entry?.label ||
      null;
    const price =
      entry?.price ??
      entry?.unit_price ??
      entry?.valor ??
      entry?.amount ??
      null;
    const itemText =
      itemLabel && price
        ? `${itemLabel} (${formatMoney(price)})`
        : itemLabel || (price ? formatMoney(price) : null);
    if (!itemText) return;

    if (!grouped.has(optionKey)) {
      grouped.set(optionKey, { name: optionLabel, items: [] });
    }
    grouped.get(optionKey).items.push(itemText);
  });

  return Array.from(grouped.values())
    .map((group) => {
      const itemsText = group.items.join(", ");
      if (group.name && itemsText) return `${group.name}: ${itemsText}`;
      return itemsText || group.name;
    })
    .filter(Boolean)
    .join("\n");
};

const formatItemOptions = (it) => {
  const raw =
    it?.options ||
    it?.opcoes ||
    it?.option_groups ||
    it?.complementos ||
    it?.adicionais ||
    it?.addons ||
    it?.extras ||
    it?.option_items ||
    it?.selected_options ||
    it?.options_text ||
    it?.optionsText ||
    it?.options_description ||
    it?.optionsDescription ||
    null;

  if (!raw) return null;

  if (typeof raw === "string" || typeof raw === "number") {
    return String(raw);
  }

  if (Array.isArray(raw)) {
    const hasFlatSelections = raw.some(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        (entry?.option_name ||
          entry?.optionName ||
          entry?.option_id ||
          entry?.optionId ||
          entry?.option) &&
        (entry?.item_name ||
          entry?.itemName ||
          entry?.item_id ||
          entry?.itemId ||
          entry?.item)
    );
    if (hasFlatSelections) {
      const flatText = formatFlatSelections(raw);
      if (flatText) return flatText;
    }
    return raw.map(formatOptionsGroup).filter(Boolean).join("\n");
  }

  if (typeof raw === "object") {
    if (
      raw?.name ||
      raw?.option_name ||
      raw?.title ||
      raw?.label ||
      raw?.items ||
      raw?.itens ||
      raw?.values
    ) {
      return formatOptionsGroup(raw);
    }

    return Object.entries(raw)
      .map(([key, value]) => {
        const valueText = Array.isArray(value)
          ? value.map(formatOptionEntry).filter(Boolean).join(", ")
          : formatOptionEntry(value);
        return valueText ? `${key}: ${valueText}` : String(key);
      })
      .filter(Boolean)
      .join("\n");
  }

  return null;
};

const itemOptions = (it) => formatItemOptions(it);
const itemObs = (it) => it?.notes || it?.obs || it?.observation || null;
const itemPrice = (it) => it?.price || it?.unit_price || it?.valor || 0;
const itemPriceText = (it) =>
  formatMoney(itemPrice(it) * Number(itemQty(it) || 1));

/**
 * Lista / filtros
 */
const allPedidosRaw = computed(() =>
  Array.isArray(pedidosStore.pedidos) ? pedidosStore.pedidos : []
);

const filteredBase = computed(() => {
  const q = String(search.value || "")
    .trim()
    .toLowerCase();
  let list = allPedidosRaw.value;

  if (onlyToday.value) list = list.filter(isToday);

  if (q) {
    list = list.filter((p) => {
      const blob = [
        displayId(p),
        customerName(p),
        customerPhone(p),
        statusLabel(p),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }

  return list;
});

/**
 * PENDENTES VÁLIDOS: aguardando e ainda dentro da janela
 * (usado para som/popup e também pra permitir aceitar)
 */
const pendentesValidos = computed(() =>
  filteredBase.value.filter(isAguardando)
);

const emPreparo = computed(() => filteredBase.value.filter(isEmPreparo));
const despachado = computed(() =>
  hideDespachados.value ? [] : filteredBase.value.filter(isDespachado)
);
const cancelado = computed(() => filteredBase.value.filter(isCancelado));

/**
 * Colunas: removido Aguardando
 */
const columns = computed(() => [
  {
    key: "emPreparo",
    title: "Em preparo",
    countColor: "primary",
    statusColor: "primary",
    statusLabel: "preparo",
    emptyText: "Nenhum pedido em preparo.",
    list: emPreparo.value,
  },
  {
    key: "despachado",
    title: "Despachado",
    countColor: "positive",
    statusColor: "positive",
    statusLabel: "enviado",
    emptyText: "Nenhum pedido despachado hoje.",
    list: despachado.value,
  },
  {
    key: "cancelado",
    title: "Cancelado",
    countColor: "negative",
    statusColor: "negative",
    statusLabel: "cancelado",
    emptyText: "Nenhum pedido cancelado hoje.",
    list: cancelado.value,
  },
]);

/**
 * UI actions
 */
const hydratePedidoItens = async (p) => {
  if (!p || typeof pedidosStore.fetchPedidoById !== "function") return;
  if (pedidoItems(p).length) return;

  const refId = p?.id || p?.external_id;
  if (!refId) return;

  try {
    const data = await pedidosStore.fetchPedidoById(refId);
    const payload = data?.data || data?.pedido || data;
    if (!payload) return;

    const merged = { ...p, ...payload };
    selectedPedido.value = merged;

    const idx = pedidosStore.pedidos.findIndex(
      (it) => it.id === p.id || it.external_id === p.external_id
    );
    if (idx >= 0) pedidosStore.pedidos[idx] = merged;
  } catch (e) {
    console.warn("Falha ao carregar itens do pedido", e);
  }
};

const openPedido = async (p) => {
  selectedPedido.value = p;
  pedidoDialog.value = true;
  await hydratePedidoItens(p);
};

const onWhatsApp = (p) => {
  const phone = customerPhone(p);
  const msg = `Olá, aqui é da ${
    authStore.selectedLoja?.name || "loja"
  }. Sobre o seu pedido ${displayId(p)}:`;
  openWhatsApp({ phone, message: msg, countryCode: "55" });
};

const onPrint = (p) => {
  const helpers = {
    displayId,
    customerName,
    customerPhone,
    statusLabel,
    formatDateTime,
    formatTotal,
    addressText,
    pedidoItems,
    itemQty,
    itemName,
    itemObs,
    itemOptions,
    itemPriceText,
  };
  printPedidoUtil(p, { auto: false, helpers });
};

/**
 * API / Sync
 */
const refresh = async () => {
  try {
    await pedidosStore.fetchPedidos?.();
  } catch (e) {
    console.warn("Falha ao atualizar pedidos", e);
    $q.notify({ type: "negative", message: "Falha ao atualizar pedidos." });
  }
};

const refreshCredits = async () => {
  const id = lojaId.value;
  if (!id) return;

  try {
    const { data } = await apiService.getCreditos(id);

    const nextCredits = Number(
      data?.credits ??
        data?.data?.credits ??
        data?.userLoja?.credits ??
        data?.user_loja?.credits ??
        data ??
        NaN
    );

    if (!Number.isNaN(nextCredits)) {
      authStore.userLoja = {
        ...(authStore.userLoja || {}),
        credits: nextCredits,
      };
    }
  } catch (e) {
    console.warn("Falha ao consultar créditos", e);
  }
};

const consumeCreditsForAccept = async (amount) => {
  const id = lojaId.value;
  if (!id) {
    $q.notify({
      type: "negative",
      message: "Loja não selecionada. Selecione uma loja e tente novamente.",
    });
    return false;
  }

  const creditsToConsume = Math.max(1, Number(amount || CREDIT_PER_ACCEPT));

  try {
    await apiService.consumeCreditos(id, { credits: creditsToConsume });
    await refreshCredits();
    return true;
  } catch (e) {
    const status = e?.response?.status;
    const msg =
      status === 400 || status === 422
        ? "Não foi possível consumir créditos. Verifique os dados e tente novamente."
        : status === 401
        ? "Sessão expirada. Faça login novamente."
        : status === 403
        ? "Você não tem permissão para consumir créditos desta loja."
        : "Créditos insuficientes para aceitar este pedido.";

    $q.notify({ type: "negative", message: msg });
    await refreshCredits();
    return false;
  }
};

const tryRefundCredits = async (amount) => {
  const id = lojaId.value;
  if (!id) return;
  const creditsToRefund = Math.max(1, Number(amount || CREDIT_PER_ACCEPT));
  try {
    if (typeof apiService.addCreditos !== "function") return;
    await apiService.addCreditos(id, { credits: creditsToRefund });
    await refreshCredits();
  } catch (e) {
    console.warn("Falha ao estornar créditos (compensação)", e);
  }
};

const resolvePedidoId = (p) => p?.id || p?.external_id;

/**
 * Alertas (som + popup) baseados em pendentesValidos (janela de 5 min)
 */
let pollTimer = null;
let beepInterval = null;

let audio = null;
try {
  audio = new Audio(
    new URL("src/assets/sounds/new-order.mp3", import.meta.url).href
  );
  audio.preload = "auto";
} catch {
  audio = null;
}

const playSoundOnce = async () => {
  try {
    if (!audio) return;
    audio.currentTime = 0;
    await audio.play();
  } catch {
    // browsers podem bloquear autoplay
  }
};

const startBeepLoop = () => {
  if (beepInterval) return;
  void playSoundOnce();
  beepInterval = setInterval(() => {
    if (!autoSound.value) return;
    if (pendentesValidos.value.length === 0) return;
    void playSoundOnce();
  }, 2500);
};

const stopBeepLoop = () => {
  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
};

const ensureAlertState = () => {
  const hasPending = pendentesValidos.value.length > 0;

  if (!autoSound.value) stopBeepLoop();
  else if (hasPending) startBeepLoop();
  else stopBeepLoop();

  if (!autoPopup.value) return;

  if (!hasPending) {
    novoPedidoDialog.value = false;
    novoPedido.value = null;
    return;
  }

  // não troca enquanto o dialog estiver aberto com um pedido ainda válido
  if (
    novoPedidoDialog.value &&
    novoPedido.value &&
    isAguardando(novoPedido.value)
  )
    return;

  novoPedido.value = pendentesValidos.value[0] || null;
  novoPedidoDialog.value = !!novoPedido.value;
};

/**
 * Ações do pedido
 */
const aceitar = async (p) => {
  if (!p) return;

  // Bloqueia aceitar fora da janela (mesmo que o backend ainda não tenha cancelado)
  if (!isAguardando(p)) {
    $q.notify({
      type: "warning",
      message: "Tempo de aceite expirado (5 minutos). O pedido será cancelado.",
    });
    await refresh();
    return;
  }

  if (!canAccept.value) {
    $q.notify({
      type: "warning",
      message: "Não é possível aceitar: loja fechada ou sem créditos.",
    });
    return;
  }

  actionLoading.value = true;
  const id = resolvePedidoId(p);

  try {
    const okCredits = await consumeCreditsForAccept(CREDIT_PER_ACCEPT);
    if (!okCredits) return;

    try {
      if (typeof pedidosStore.aceitarPedido === "function") {
        await pedidosStore.aceitarPedido(id);
      } else if (typeof pedidosStore.atualizarStatus === "function") {
        await pedidosStore.atualizarStatus(id, { status: "em preparo" });
      } else {
        throw new Error(
          "Store de pedidos não possui aceitarPedido/atualizarStatus"
        );
      }
    } catch (e) {
      await tryRefundCredits(CREDIT_PER_ACCEPT);
      throw e;
    }

    await refresh();

    if (autoPrintOnAccept.value) {
      const updated = allPedidosRaw.value.find((x) => pKey(x) === pKey(p)) || p;

      const helpers = {
        displayId,
        customerName,
        customerPhone,
        statusLabel,
        formatDateTime,
        formatTotal,
        addressText,
        pedidoItems,
        itemQty,
        itemName,
        itemObs,
        itemOptions,
        itemPriceText,
      };
      printPedidoUtil(updated, { auto: true, helpers });
    }

    pedidoDialog.value = false;
    novoPedidoDialog.value = false;
  } catch (e) {
    console.warn("Falha ao aceitar pedido", e);
    $q.notify({
      type: "negative",
      message: "Falha ao aceitar o pedido. Tente novamente.",
    });
  } finally {
    actionLoading.value = false;
    ensureAlertState();
  }
};

const rejeitar = async (p) => {
  if (!p) return;

  const ok = await $q
    .dialog({
      title: "Rejeitar pedido",
      message: `Deseja rejeitar o pedido ${displayId(p)}?`,
      cancel: true,
      persistent: true,
    })
    .then(() => true)
    .catch(() => false);

  if (!ok) return;

  actionLoading.value = true;
  try {
    const id = resolvePedidoId(p);

    if (typeof pedidosStore.rejeitarPedido === "function") {
      await pedidosStore.rejeitarPedido(id);
    } else if (typeof pedidosStore.atualizarStatus === "function") {
      await pedidosStore.atualizarStatus(id, { status: "cancelado" });
    } else {
      throw new Error(
        "Store de pedidos não possui rejeitarPedido/atualizarStatus"
      );
    }

    await refresh();
    pedidoDialog.value = false;
    novoPedidoDialog.value = false;
  } catch (e) {
    console.warn("Falha ao rejeitar pedido", e);
    $q.notify({ type: "negative", message: "Falha ao rejeitar o pedido." });
  } finally {
    actionLoading.value = false;
    ensureAlertState();
  }
};

const despachar = async (p) => {
  if (!p) return;

  const ok = await $q
    .dialog({
      title: "Despachar pedido",
      message: `Marcar o pedido ${displayId(p)} como despachado?`,
      cancel: true,
      persistent: true,
    })
    .then(() => true)
    .catch(() => false);

  if (!ok) return;

  actionLoading.value = true;
  try {
    const id = resolvePedidoId(p);

    if (typeof pedidosStore.atualizarStatus === "function") {
      await pedidosStore.atualizarStatus(id, { status: "despachado" });
    } else {
      throw new Error("Store de pedidos não possui atualizarStatus");
    }

    await refresh();
    pedidoDialog.value = false;
  } catch (e) {
    console.warn("Falha ao despachar pedido", e);
    $q.notify({ type: "negative", message: "Falha ao despachar o pedido." });
  } finally {
    actionLoading.value = false;
  }
};

/**
 * Polling (pausa com aba oculta)
 */
const tick = async () => {
  await refresh();
  await refreshCredits();
  ensureAlertState();
};

const startPolling = () => {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (document.visibilityState !== "visible") return;
    await tick();
  }, 10000);
};

const stopPolling = () => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
};

const onVisibilityChange = async () => {
  if (document.visibilityState === "visible") {
    await tick();
    startPolling();
  } else {
    stopPolling();
    stopBeepLoop();
  }
};

watch(
  () => [pendentesValidos.value.length, autoSound.value, autoPopup.value],
  () => ensureAlertState(),
  { immediate: true }
);

watch(allPedidosRaw, () => ensureAlertState(), { deep: false });

onMounted(async () => {
  // relógio para “expirar” pendentes na tela sem depender do refresh
  nowTimer = setInterval(() => {
    nowTick.value = Date.now();
  }, 1000);

  await tick();
  startPolling();
  document.addEventListener("visibilitychange", onVisibilityChange);
});

onBeforeUnmount(() => {
  stopPolling();
  stopBeepLoop();
  if (nowTimer) clearInterval(nowTimer);
  nowTimer = null;
  document.removeEventListener("visibilitychange", onVisibilityChange);
});
</script>

<style scoped>
.filters-card {
  width: 100%;
  max-width: 520px;
  border-radius: 14px;
}
</style>
