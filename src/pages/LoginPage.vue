<template>
  <div class="login-page">
    <div class="login-card-wrap">
      <q-card class="login-card" bordered>
        <q-card-section class="q-pb-sm">
          <div class="row items-center no-wrap">
            <q-avatar
              size="40px"
              color="primary"
              text-color="white"
              icon="store"
            />
            <div class="q-ml-md">
              <div class="text-h6 text-weight-medium">Acessar PDV</div>
              <div class="text-caption text-grey-7">
                Entre com suas credenciais para continuar
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md">
          <q-form @submit.prevent="handleLogin" class="q-gutter-md">
            <q-input
              v-model.trim="email"
              label="E-mail"
              type="email"
              outlined
              autocomplete="email"
              :disable="loading"
              :error="!!fieldErrors.email"
              :error-message="fieldErrors.email"
            >
              <template #prepend>
                <q-icon name="mail" />
              </template>
            </q-input>

            <q-input
              v-model="password"
              label="Senha"
              :type="showPassword ? 'text' : 'password'"
              outlined
              autocomplete="current-password"
              :disable="loading"
              :error="!!fieldErrors.password"
              :error-message="fieldErrors.password"
            >
              <template #prepend>
                <q-icon name="lock" />
              </template>
              <template #append>
                <q-btn
                  flat
                  round
                  dense
                  :icon="showPassword ? 'visibility_off' : 'visibility'"
                  @click="showPassword = !showPassword"
                  :disable="loading"
                />
              </template>
            </q-input>

            <div class="row justify-center">
              <q-btn
                type="submit"
                label="Entrar"
                color="primary"
                class="login-btn"
                :loading="loading"
                :disable="loading"
              />
            </div>

            <div class="row justify-center q-mt-xs">
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                icon="help_outline"
                label="Esqueci minha senha"
                :disable="loading"
                @click="openForgotDialog"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-card-section v-if="hintMessage" class="q-pt-none">
          <q-banner dense inline-actions :class="bannerClass">
            <template #avatar>
              <q-icon :name="hintIcon" />
            </template>
            <div class="text-body2">{{ hintMessage }}</div>
            <template #action>
              <q-btn flat label="OK" @click="hintMessage = ''" />
            </template>
          </q-banner>
        </q-card-section>

        <q-card-section class="q-pt-none"> </q-card-section>
      </q-card>

      <div class="text-caption text-grey-6 q-mt-md text-center">
        PDV Loja • {{ year }}
      </div>
    </div>

    <!-- Dialog: Esqueci a senha -->
    <q-dialog v-model="forgotDialog" persistent>
      <q-card class="forgot-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Recuperar senha</div>
          <q-space />
          <q-btn
            icon="close"
            flat
            round
            dense
            :disable="forgotLoading"
            v-close-popup
          />
        </q-card-section>

        <q-card-section class="q-pt-sm">
          <div class="text-body2 text-grey-8">
            Informe seu e-mail. Se ele estiver cadastrado, enviaremos uma nova
            senha para você.
          </div>

          <q-form @submit.prevent="handleForgot" class="q-mt-md">
            <q-input
              v-model.trim="forgotEmail"
              label="E-mail"
              type="email"
              outlined
              autocomplete="email"
              :disable="forgotLoading"
              :error="!!forgotError"
              :error-message="forgotError"
            >
              <template #prepend>
                <q-icon name="mail" />
              </template>
            </q-input>

            <q-banner
              v-if="forgotInfo"
              dense
              class="q-mt-md bg-green-1 text-green-10"
            >
              <template #avatar>
                <q-icon name="check_circle" />
              </template>
              <div class="text-body2">{{ forgotInfo }}</div>
            </q-banner>
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" :disable="forgotLoading" v-close-popup />
          <q-btn
            color="primary"
            label="Enviar"
            :loading="forgotLoading"
            :disable="forgotLoading"
            @click="handleForgot"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "src/stores/authStore";
import apiClient from "src/services/api";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");

const loading = ref(false);
const showPassword = ref(false);

const hintMessage = ref("");
const hintType = ref("info"); // info | warning | negative

const hintIcon = computed(() => {
  if (hintType.value === "negative") return "error";
  if (hintType.value === "warning") return "warning";
  return "info";
});

const bannerClass = computed(() => {
  if (hintType.value === "negative") return "bg-red-1 text-red-10";
  if (hintType.value === "warning") return "bg-orange-1 text-orange-10";
  return "bg-grey-2 text-grey-9";
});

const fieldErrors = ref({ email: "", password: "" });

const year = computed(() => new Date().getFullYear());

const forgotDialog = ref(false);
const forgotEmail = ref("");
const forgotLoading = ref(false);
const forgotError = ref("");
const forgotInfo = ref("");

const isValidEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v || "").trim());

const validate = () => {
  fieldErrors.value = { email: "", password: "" };

  if (!email.value) fieldErrors.value.email = "Informe seu e-mail.";
  else if (!isValidEmail(email.value))
    fieldErrors.value.email = "Informe um e-mail válido.";

  if (!password.value) fieldErrors.value.password = "Informe sua senha.";

  return !fieldErrors.value.email && !fieldErrors.value.password;
};

const mapLoginError = (err) => {
  const status = err?.response?.status ?? null;
  const apiMsg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.response?.data?.detail ||
    "";

  if (status === 400 || status === 401) {
    return "E-mail ou senha incorretos. Verifique e tente novamente.";
  }
  if (status === 429) {
    return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  }
  if (status === 0 || status === null) {
    return "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
  }
  if (status >= 500) {
    return "O servidor está indisponível no momento. Tente novamente em instantes.";
  }
  if (apiMsg && typeof apiMsg === "string" && apiMsg.trim().length > 0)
    return apiMsg;

  return "Não foi possível entrar. Tente novamente.";
};

const handleLogin = async () => {
  if (loading.value) return;

  hintMessage.value = "";
  hintType.value = "info";

  if (!validate()) return;

  loading.value = true;
  try {
    const data = await authStore.login(email.value, password.value);
    authStore.setAuthData(data);

    const lojas = Array.isArray(data?.lojas) ? data.lojas : [];

    if (lojas.length === 0) {
      hintType.value = "warning";
      hintMessage.value = "Sua conta não possui lojas vinculadas.";
      return;
    }

    if (lojas.length === 1 && typeof authStore.selectStore === "function") {
      await authStore.selectStore(lojas[0].id);
      router.replace({ name: "dashboard" });
      return;
    }

    router.replace({ name: "select-loja" });
  } catch (err) {
    hintType.value = "negative";
    hintMessage.value = mapLoginError(err);
  } finally {
    loading.value = false;
  }
};

const openForgotDialog = () => {
  forgotError.value = "";
  forgotInfo.value = "";
  forgotEmail.value = email.value || "";
  forgotDialog.value = true;
};

const mapForgotError = (err) => {
  const status = err?.response?.status ?? null;

  if (status === 429)
    return "Muitas solicitações. Aguarde um pouco e tente novamente.";
  if (status === 0 || status === null)
    return "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
  if (status >= 500)
    return "O servidor está indisponível no momento. Tente novamente em instantes.";

  return "Não foi possível enviar a recuperação. Tente novamente.";
};

const handleForgot = async () => {
  if (forgotLoading.value) return;

  forgotError.value = "";
  forgotInfo.value = "";

  const v = String(forgotEmail.value || "").trim();
  if (!v) {
    forgotError.value = "Informe seu e-mail.";
    return;
  }
  if (!isValidEmail(v)) {
    forgotError.value = "Informe um e-mail válido.";
    return;
  }

  forgotLoading.value = true;
  try {
    await apiClient.forgotPassword({ email: v });

    forgotInfo.value =
      "Se este e-mail estiver cadastrado, você receberá uma nova senha em instantes.";
  } catch (err) {
    forgotError.value = mapForgotError(err);
  } finally {
    forgotLoading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(
      circle at 10% 10%,
      rgba(2, 123, 227, 0.12),
      transparent 45%
    ),
    radial-gradient(circle at 90% 20%, rgba(0, 200, 83, 0.1), transparent 40%),
    radial-gradient(circle at 30% 90%, rgba(255, 193, 7, 0.1), transparent 45%);
}

.login-card-wrap {
  width: 100%;
  max-width: 420px;
}

.login-card {
  border-radius: 14px;
}

.login-btn {
  width: 220px;
}

.forgot-card {
  width: 100%;
  max-width: 520px;
  border-radius: 14px;
}
</style>
