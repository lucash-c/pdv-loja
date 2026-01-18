<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div>
        <div class="row items-center q-gutter-sm text-h6">
          <q-icon name="storefront" />
          <span>Loja</span>
        </div>
        <div class="text-caption text-grey-7">
          Gerencie redes sociais e configurações da loja.
        </div>
      </div>

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
      <q-card-section class="row items-center">
        <div>
          <div class="text-subtitle1 text-weight-medium">Redes sociais</div>
          <div class="text-caption text-grey-7">
            Cadastre os links públicos para exibir no cardápio.
          </div>
        </div>
        <q-space />
        <q-btn
          color="primary"
          icon="save"
          label="Salvar redes"
          :loading="savingSocial"
          :disable="loading"
          @click="saveSocial"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit.prevent="saveSocial">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="socialForm.instagram"
                label="Instagram"
                outlined
                dense
                type="url"
                placeholder="https://instagram.com/sualoja"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="socialForm.facebook"
                label="Facebook"
                outlined
                dense
                type="url"
                placeholder="https://facebook.com/sualoja"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="socialForm.tiktok"
                label="TikTok"
                outlined
                dense
                type="url"
                placeholder="https://tiktok.com/@sualoja"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="socialForm.youtube"
                label="YouTube"
                outlined
                dense
                type="url"
                placeholder="https://youtube.com/@sualoja"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="socialForm.site"
                label="Site"
                outlined
                dense
                type="url"
                placeholder="https://www.sualoja.com.br"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section class="row items-center">
        <div>
          <div class="text-subtitle1 text-weight-medium">
            Configurações da loja
          </div>
          <div class="text-caption text-grey-7">
            Controle dados operacionais e horários de funcionamento.
          </div>
        </div>
        <q-space />
        <q-btn
          color="primary"
          icon="save"
          label="Salvar configurações"
          :loading="savingSettings"
          :disable="loading"
          @click="saveSettings"
        />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit.prevent="saveSettings">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="settingsForm.pix_key"
                label="Chave Pix"
                outlined
                dense
                placeholder="email@pix.com"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                v-model="settingsForm.open_time"
                label="Horário de abertura"
                outlined
                dense
                type="time"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                v-model="settingsForm.close_time"
                label="Horário de fechamento"
                outlined
                dense
                type="time"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { Notify } from "quasar";
import { onMounted, reactive, ref } from "vue";
import apiService from "src/services/api";
import { useAuthStore } from "src/stores/authStore";

const authStore = useAuthStore();

const loading = ref(false);
const savingSocial = ref(false);
const savingSettings = ref(false);

const loja = ref({});

const socialForm = reactive({
  instagram: "",
  facebook: "",
  tiktok: "",
  youtube: "",
  site: "",
});

const settingsForm = reactive({
  pix_key: "",
  open_time: "",
  close_time: "",
  is_open: false,
});

const toText = (value) =>
  value === null || value === undefined ? "" : String(value);

const pickField = (payload, keys) => {
  for (const key of keys) {
    const value = payload?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
};

const notify = (type, message) => {
  const msg = String(message || "").trim();
  if (!msg) return;
  Notify.create({ type, message: msg, position: "top", timeout: 2500 });
};

const syncStoreFromApi = (payload) => {
  if (!payload || typeof payload !== "object") return;
  const merged = { ...(authStore.loja || {}), ...payload };
  const next = { loja: merged };
  if (!authStore.selectedLoja || authStore.selectedLoja?.id === merged.id) {
    next.selectedLoja = { ...(authStore.selectedLoja || {}), ...payload };
  }
  authStore.setAuthData(next);
};

const applyLoja = (payload) => {
  loja.value = payload || {};
  socialForm.instagram = pickField(loja.value, ["instagram", "instagram_url"]);
  socialForm.facebook = pickField(loja.value, ["facebook", "facebook_url"]);
  socialForm.tiktok = pickField(loja.value, ["tiktok", "tiktok_url"]);
  socialForm.youtube = pickField(loja.value, ["youtube", "youtube_url"]);
  socialForm.site = pickField(loja.value, ["site", "site_url", "website"]);
};

const applySettings = (payload) => {
  const settings = payload || {};
  settingsForm.pix_key = toText(settings.pix_key);
  settingsForm.open_time = toText(settings.open_time);
  settingsForm.close_time = toText(settings.close_time);
};

const refresh = async () => {
  loading.value = true;
  try {
    const [lojaResponse, settingsResponse] = await Promise.all([
      apiService.getLojaAtiva(),
      apiService.getStoreSettings(),
    ]);

    const lojaPayload =
      lojaResponse?.data?.data ??
      lojaResponse?.data?.loja ??
      lojaResponse?.data;
    const settingsPayload =
      settingsResponse?.data?.data ??
      settingsResponse?.data?.settings ??
      settingsResponse?.data;

    applyLoja(lojaPayload);
    applySettings(settingsPayload);
  } catch (error) {
    console.error("Erro ao carregar dados da loja:", error);
    notify("negative", "Não foi possível carregar os dados da loja.");
  } finally {
    loading.value = false;
  }
};

const buildSocialPayload = () => {
  const normalize = (value) => {
    const trimmed = String(value || "").trim();
    return trimmed.length ? trimmed : null;
  };

  return {
    instagram: normalize(socialForm.instagram),
    facebook: normalize(socialForm.facebook),
    tiktok: normalize(socialForm.tiktok),
    youtube: normalize(socialForm.youtube),
    site: normalize(socialForm.site),
  };
};

const saveSocial = async () => {
  savingSocial.value = true;
  try {
    const payload = buildSocialPayload();
    const response = await apiService.updateLojaAtiva(payload);
    const updated =
      response?.data?.data ?? response?.data?.loja ?? response?.data;
    applyLoja(updated || payload);
    syncStoreFromApi(updated || payload);
    notify("positive", "Redes sociais atualizadas com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar redes sociais:", error);
    notify("negative", "Não foi possível salvar as redes sociais.");
  } finally {
    savingSocial.value = false;
  }
};

const saveSettings = async () => {
  savingSettings.value = true;
  try {
    const payload = {
      pix_key: settingsForm.pix_key || null,
      open_time: settingsForm.open_time || null,
      close_time: settingsForm.close_time || null,
    };
    const response = await apiService.upsertStoreSettings(payload);
    const updated =
      response?.data?.data ??
      response?.data?.settings ??
      response?.data ??
      payload;
    applySettings(updated);
    notify("positive", "Configurações atualizadas com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    notify("negative", "Não foi possível salvar as configurações.");
  } finally {
    savingSettings.value = false;
  }
};

onMounted(() => {
  refresh();
});
</script>
