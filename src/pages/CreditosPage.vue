<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div>
        <div class="row items-center q-gutter-sm text-h6">
          <q-icon name="account_balance_wallet" />
          <span>Adicionar créditos</span>
        </div>
        <div class="text-caption text-grey-7">
          No momento, não há cobrança. Você pode adicionar créditos grátis.
        </div>
      </div>
      <q-space />
      <q-badge color="primary" outline>
        Créditos atuais: {{ currentCredits }}
      </q-badge>
    </div>

    <q-banner
      dense
      class="bg-blue-1 text-blue-10 q-mb-md rounded-borders"
    >
      <template #avatar><q-icon name="info" /></template>
      Escolha um valor para adicionar. A recarga é gratuita.
    </q-banner>

    <div class="row q-col-gutter-md">
      <div
        v-for="amount in creditOptions"
        :key="amount"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card>
          <q-card-section class="row items-center">
            <div class="text-subtitle1 text-weight-medium">
              {{ amount }} créditos
            </div>
            <q-space />
            <q-icon name="add_circle" color="primary" />
          </q-card-section>
          <q-separator />
          <q-card-actions align="right">
            <q-btn
              color="primary"
              label="Add Creditos"
              :loading="actionLoading === amount"
              :disable="actionLoading === amount"
              @click="addCredits(amount)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { Notify } from "quasar";
import { computed, ref } from "vue";
import apiService from "src/services/api";
import { useAuthStore } from "src/stores/authStore";

const authStore = useAuthStore();

const creditOptions = [200, 500, 1000, 1500, 2000];
const actionLoading = ref(null);

const lojaId = computed(
  () =>
    authStore.loja?.id ||
    authStore.userLoja?.loja_id ||
    authStore.userLoja?.store_id ||
    null
);

const currentCredits = computed(
  () => authStore?.userLoja?.credits ?? authStore?.credits ?? 0
);

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

  window.alert(msg);
};

const addCredits = async (amount) => {
  if (!lojaId.value) {
    notify({
      type: "warning",
      message: "Selecione uma loja antes de adicionar créditos.",
    });
    return;
  }

  actionLoading.value = amount;

  try {
    const { data } = await apiService.addCreditos(lojaId.value, {
      credits: amount,
    });

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

    notify({
      type: "positive",
      message: `Créditos adicionados: +${amount}.`,
    });
  } catch (error) {
    console.warn("Falha ao adicionar créditos", error);
    notify({
      type: "negative",
      message: "Não foi possível adicionar créditos. Tente novamente.",
    });
  } finally {
    actionLoading.value = null;
  }
};
</script>
