<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="q-px-md">
        <q-btn
          flat
          dense
          round
          icon="menu"
          class="q-mr-sm"
          aria-label="Abrir menu"
          @click="drawerOpen = !drawerOpen"
        />

        <q-toolbar-title class="row items-center no-wrap">
          <q-avatar v-if="lojaLogo" size="32px" class="q-mr-sm" square>
            <img :src="lojaLogo" alt="Logo da loja" />
          </q-avatar>

          <q-avatar
            v-else
            size="32px"
            class="q-mr-sm"
            color="primary"
            text-color="white"
            icon="store"
          />

          <div class="column">
            <div class="text-subtitle1 text-weight-medium">
              {{ lojaNome || "PDV Loja" }}
            </div>

            <div class="text-caption text-grey-4">
              <span v-if="statusLabel">
                <q-icon :name="statusIcon" class="q-mr-xs" />
                {{ statusLabel }}
              </span>

              <span v-if="statusLabel && creditsLabel"> • </span>

              <span v-if="creditsLabel">{{ creditsLabel }}</span>
            </div>
          </div>
        </q-toolbar-title>

        <q-space />

        <q-btn
          class="q-mr-sm"
          outline
          :color="isStoreOpen ? 'positive' : 'grey-5'"
          :icon="isStoreOpen ? 'toggle_on' : 'toggle_off'"
          :label="isStoreOpen ? 'Aberta' : 'Fechada'"
          :loading="storeActionLoading"
          :disable="storeActionLoading || !canToggleStore"
          @click="toggleStore"
        />

        <q-btn
          flat
          color="negative"
          icon="logout"
          label="Sair"
          @click="handleLogout"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      show-if-above
      v-model="drawerOpen"
      side="left"
      bordered
      :width="280"
      class="bg-white"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item
            v-for="item in navItems"
            :key="item.to"
            clickable
            v-ripple
            :to="item.to"
            exact
            active-class="menu-item--active"
          >
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>

          <q-separator class="q-my-sm" />

          <q-item
            clickable
            v-ripple
            :disable="!canSwitchStore"
            @click="confirmSwitchStoreDialog"
          >
            <q-item-section avatar><q-icon name="swap_horiz" /></q-item-section>
            <q-item-section>Trocar loja</q-item-section>
            <q-item-section side>
              <q-badge v-if="canSwitchStore" color="primary" outline>
                {{ lojasCount }}
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { Dialog, LocalStorage, Notify } from "quasar";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import apiService from "src/services/api";
import { useAuthStore } from "src/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

/**
 * Drawer state (persistente)
 */
const drawerOpen = ref(LocalStorage.getItem("pdv.drawerOpen") ?? true);
watch(drawerOpen, (v) => LocalStorage.set("pdv.drawerOpen", !!v), {
  flush: "post",
});

/**
 * UI state
 */
const storeActionLoading = ref(false);

/**
 * Navegação
 */
const navItems = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/pdv", icon: "point_of_sale", label: "PDV" },
  { to: "/pedidos", icon: "receipt_long", label: "Pedidos" },
  { to: "/produtos", icon: "inventory_2", label: "Produtos" },
  { to: "/loja", icon: "store", label: "Loja" },
];

/**
 * Fonte de verdade do "aberta/fechada" = store-settings.is_open
 * Guardamos localmente (e também espelhamos em authStore.isStoreOpen por compatibilidade)
 */
const storeSettings = ref(null);

const lojaNome = computed(
  () => authStore.selectedLoja?.name || authStore.loja?.name || null
);

const lojaLogo = computed(
  () =>
    authStore.selectedLoja?.logo_url ||
    authStore.selectedLoja?.logo ||
    authStore.loja?.logo_url ||
    authStore.loja?.logo ||
    null
);

const isStoreOpen = computed(() => {
  const raw = storeSettings.value?.is_open;
  if (typeof raw === "boolean") return raw;
  // fallback para compatibilidade com páginas antigas
  return !!authStore.isStoreOpen;
});

const statusLabel = computed(() =>
  isStoreOpen.value ? "Loja aberta" : "Loja fechada"
);
const statusIcon = computed(() =>
  isStoreOpen.value ? "check_circle" : "cancel"
);

const creditsLabel = computed(() => {
  const c = authStore?.userLoja?.credits ?? authStore?.credits ?? null;
  return c !== null && c !== undefined ? `Créditos: ${c}` : null;
});

const lojasCount = computed(() =>
  Array.isArray(authStore.lojas) ? authStore.lojas.length : 0
);

const canSwitchStore = computed(() => {
  const hasUserToken =
    !!authStore.userToken || !!localStorage.getItem("user_token");
  return hasUserToken && lojasCount.value > 0;
});

const canToggleStore = computed(() => {
  const hasStoreToken =
    !!authStore.storeToken || !!localStorage.getItem("store_token");
  return hasStoreToken && !!(authStore.selectedLoja || authStore.loja);
});

/**
 * Notify seguro
 */
const notify = ({ type = "info", message = "" } = {}) => {
  const msg = String(message || "").trim();
  if (!msg) return;

  if (Notify && typeof Notify.create === "function") {
    Notify.create({
      type,
      message: msg,
      position: "top",
      timeout: type === "negative" ? 3500 : 2200,
    });
    return;
  }

  if (Dialog && typeof Dialog.create === "function") {
    Dialog.create({
      title: type === "negative" ? "Atenção" : "Aviso",
      message: msg,
      ok: { label: "OK" },
    });
    return;
  }

  window.alert(msg);
};

/**
 * Sessão / troca de loja
 */
const clearStoreSession = () => {
  authStore.storeToken = null;
  authStore.selectedLoja = null;
  authStore.loja = null;
  authStore.userLoja = null;
  storeSettings.value = null;

  localStorage.removeItem("store_token");
  localStorage.removeItem("auth_selected_loja");
  localStorage.removeItem("auth_loja");
  localStorage.removeItem("auth_user_loja");
};

const confirmSwitchStoreDialog = () => {
  if (!canSwitchStore.value) {
    notify({
      type: "warning",
      message: "Você não possui lojas disponíveis para trocar.",
    });
    return;
  }

  Dialog.create({
    title: "Trocar loja",
    message:
      "Você será direcionado para selecionar outra loja.\n\nSeu login será mantido, apenas o vínculo com a loja atual será alterado.",
    cancel: true,
    persistent: true,
    ok: { label: "Trocar", color: "primary" },
    cancelLabel: "Cancelar",
  }).onOk(() => {
    clearStoreSession();
    router.replace({ name: "select-loja" });
  });
};

/**
 * Sync: loja atual, store-settings e créditos (para o header)
 */
const lojaId = computed(
  () =>
    authStore.loja?.id ||
    authStore.userLoja?.loja_id ||
    authStore.userLoja?.store_id ||
    null
);

const syncLojaAtual = async () => {
  try {
    const { data } = await apiService.getLojaAtiva();
    const loja = data?.data ?? data?.loja ?? data;
    if (loja && typeof loja === "object") {
      authStore.loja = { ...(authStore.loja || {}), ...loja };
    }
  } catch (e) {
    console.warn("Falha ao sincronizar loja atual", e);
  }
};

const syncStoreSettings = async () => {
  try {
    const { data } = await apiService.getStoreSettings();
    const settings = data?.data ?? data?.settings ?? data;
    if (settings && typeof settings === "object") {
      storeSettings.value = settings;
      if (typeof settings.is_open === "boolean")
        authStore.loja = {
          ...(authStore.loja || {}),
          is_open: settings.is_open,
        };
    }
  } catch (e) {
    console.warn("Falha ao obter store-settings", e);
  }
};

const syncCredits = async () => {
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

const syncHeader = async () => {
  await syncLojaAtual();
  await syncStoreSettings();
  await syncCredits();
};

/**
 * Abrir/Fechar loja: UPSERT store-settings { is_open }
 * (mescla com settings atual pra não perder campos)
 */
const setStoreOpen = async (nextOpen) => {
  storeActionLoading.value = true;
  try {
    const current =
      storeSettings.value && typeof storeSettings.value === "object"
        ? storeSettings.value
        : {};
    const payload = { ...current, is_open: !!nextOpen };

    await apiService.upsertStoreSettings(payload);
    await syncStoreSettings();

    notify({
      type: "positive",
      message: nextOpen ? "Loja aberta com sucesso." : "Loja fechada.",
    });
  } catch (e) {
    console.warn("Falha ao abrir/fechar loja", e);
    notify({
      type: "negative",
      message: "Não foi possível atualizar o status da loja. Tente novamente.",
    });
  } finally {
    storeActionLoading.value = false;
  }
};

const toggleStore = async () => {
  if (!canToggleStore.value) {
    notify({
      type: "warning",
      message: "Selecione uma loja antes de abrir/fechar.",
    });
    return;
  }

  if (!isStoreOpen.value) {
    await setStoreOpen(true);
    return;
  }

  Dialog.create({
    title: "Fechar loja",
    message: "Tem certeza que deseja fechar a loja agora?",
    cancel: true,
    persistent: true,
    ok: { label: "Fechar", color: "negative" },
    cancelLabel: "Cancelar",
  }).onOk(async () => {
    await setStoreOpen(false);
  });
};

/**
 * Logout
 */
const handleLogout = async () => {
  try {
    if (isStoreOpen.value) await setStoreOpen(false);
  } finally {
    authStore.logout();
    router.replace({ name: "login" });
  }
};

/**
 * Keepalive: fecha loja ao sair/ocultar aba (best effort)
 * Endpoint correto: PUT /api/store-settings com { is_open: false }
 */
const closeStoreKeepalive = () => {
  if (!isStoreOpen.value) return;

  const token =
    authStore.storeToken || localStorage.getItem("store_token") || "";
  if (!token) return;

  // tenta preservar o payload atual (se existir)
  const current =
    storeSettings.value && typeof storeSettings.value === "object"
      ? storeSettings.value
      : {};
  const payload = JSON.stringify({ ...current, is_open: false });

  fetch("/api/store-settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
};

const onBeforeUnload = () => closeStoreKeepalive();
const onVisibilityChange = () => {
  if (document.visibilityState === "hidden") closeStoreKeepalive();
  if (document.visibilityState === "visible") void syncHeader();
};

let pollTimer = null;

onMounted(async () => {
  await syncHeader();

  // polling leve pro header (créditos/status)
  pollTimer = setInterval(() => {
    if (document.visibilityState !== "visible") return;
    void syncHeader();
  }, 25000);

  window.addEventListener("beforeunload", onBeforeUnload, { capture: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;

  window.removeEventListener("beforeunload", onBeforeUnload, { capture: true });
  document.removeEventListener("visibilitychange", onVisibilityChange);
});
</script>

<style scoped>
.menu-item--active {
  background: rgba(25, 118, 210, 0.08);
  border-radius: 10px;
}
</style>
