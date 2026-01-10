<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6">Selecione uma loja</div>
        <div class="text-caption text-grey-7">
          Escolha a loja para continuar no PDV.
        </div>
      </div>

      <q-btn
        flat
        color="negative"
        icon="logout"
        label="Sair"
        @click="handleLogout"
      />
    </div>

    <q-card>
      <q-card-section>
        <div v-if="loading" class="row items-center justify-center q-pa-lg">
          <q-spinner size="32px" />
          <div class="q-ml-sm">Carregando...</div>
        </div>

        <div v-else>
          <div v-if="!lojas.length" class="text-center q-pa-lg">
            <q-icon name="store" size="48px" class="text-grey-6" />
            <div class="text-subtitle1 q-mt-md">Nenhuma loja disponível</div>
            <div class="text-caption text-grey-7">
              Sua conta não possui lojas vinculadas.
            </div>
            <q-btn
              class="q-mt-md"
              color="primary"
              label="Voltar ao login"
              @click="goLogin"
            />
          </div>

          <q-list v-else bordered separator>
            <q-item
              v-for="loja in lojas"
              :key="loja.id"
              clickable
              v-ripple
              :disable="selectingId === loja.id"
              @click="handleSelect(loja)"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" icon="store" />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ loja.name }}</q-item-label>
                <q-item-label caption>
                  <span v-if="loja.user_role"
                    >Perfil: {{ loja.user_role }}</span
                  >
                  <span v-if="loja.user_role && loja.is_active !== undefined">
                    •
                  </span>
                  <span v-if="loja.is_active !== undefined">
                    Status:
                    <span
                      :class="
                        loja.is_active ? 'text-positive' : 'text-negative'
                      "
                    >
                      {{ loja.is_active ? "Ativa" : "Inativa" }}
                    </span>
                  </span>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  color="primary"
                  label="Selecionar"
                  :loading="selectingId === loja.id"
                  @click.stop="handleSelect(loja)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="errorDialog">
      <q-card style="min-width: 320px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Erro</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="text-body2">{{ errorMessage }}</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "src/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const selectingId = ref(null);

const errorDialog = ref(false);
const errorMessage = ref("");

const lojas = computed(() =>
  Array.isArray(authStore.lojas) ? authStore.lojas : []
);

const showError = (msg) => {
  errorMessage.value = msg || "Ocorreu um erro inesperado.";
  errorDialog.value = true;
};

const goLogin = () => router.replace({ name: "login" });

const ensureAccess = () => {
  const userToken =
    authStore.userToken ||
    localStorage.getItem("user_token") ||
    localStorage.getItem("token_user") ||
    localStorage.getItem("token");

  if (!userToken) {
    goLogin();
    return false;
  }

  const storeToken =
    authStore.storeToken ||
    localStorage.getItem("store_token") ||
    localStorage.getItem("token_loja") ||
    localStorage.getItem("loja_token");

  if (storeToken) {
    router.replace({ name: "dashboard" });
    return false;
  }

  return true;
};

const handleSelect = async (loja) => {
  if (!loja?.id) return;

  selectingId.value = loja.id;
  try {
    await authStore.selectStore(loja.id);
    router.replace({ name: "dashboard" });
  } catch (e) {
    showError(
      e?.response?.data?.message ||
        "Falha ao selecionar a loja. Tente novamente."
    );
  } finally {
    selectingId.value = null;
  }
};

const handleLogout = () => {
  authStore.logout();
  goLogin();
};

onMounted(async () => {
  loading.value = true;
  try {
    const ok = ensureAccess();
    if (!ok) return;
  } finally {
    loading.value = false;
  }
});
</script>
