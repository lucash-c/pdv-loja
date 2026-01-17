<template>
  <q-dialog :model-value="modelValue" @update:model-value="emitModel">
    <q-card class="pedido-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Pedido {{ displayId(pedido) }}</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="emitModel(false)" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-list dense bordered class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-caption text-grey-7"
                    >Cliente</q-item-label
                  >
                  <q-item-label>{{ customerName(pedido) || "-" }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="text-caption text-grey-7"
                    >Telefone</q-item-label
                  >
                  <q-item-label>{{
                    customerPhone(pedido) || "-"
                  }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="text-caption text-grey-7"
                    >Status</q-item-label
                  >
                  <q-item-label>{{ statusLabel(pedido) }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="text-caption text-grey-7"
                    >Tipo de pedido</q-item-label
                  >
                  <q-item-label>{{ orderTypeLabel(pedido) }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="text-caption text-grey-7"
                    >Horário</q-item-label
                  >
                  <q-item-label>{{
                    formatDateTime(pedido) || "-"
                  }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="text-caption text-grey-7"
                    >Total</q-item-label
                  >
                  <q-item-label class="text-weight-medium">{{
                    formatTotal(pedido)
                  }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div class="col-12 col-md-6">
            <q-list dense bordered class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-caption text-grey-7"
                    >Endereço / Observações</q-item-label
                  >
                  <q-item-label
                    class="text-body2"
                    style="white-space: pre-wrap"
                  >
                    {{ addressText(pedido) || "—" }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <q-card flat bordered class="q-mt-md rounded-borders">
              <q-card-section class="q-pb-sm">
                <div class="text-subtitle2">Itens</div>
              </q-card-section>

              <q-separator />

              <q-card-section class="q-pa-none">
                <q-list separator>
                  <q-item v-if="!pedidoItems(pedido).length" class="q-pa-md">
                    <q-item-section class="text-grey-7"
                      >Sem itens.</q-item-section
                    >
                  </q-item>

                  <q-item v-for="(it, idx) in pedidoItems(pedido)" :key="idx">
                    <q-item-section>
                      <q-item-label>
                        <span class="text-weight-medium"
                          >{{ itemQty(it) }}x</span
                        >
                        {{ itemName(it) }}
                      </q-item-label>
                      <q-item-label
                        caption
                        class="pedido-item-obs"
                        v-if="itemObs(it)"
                      >
                        {{ itemObs(it) }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="text-body2">{{ itemPriceText(it) }}</div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="between" class="q-pa-md">
        <div class="row q-gutter-sm">
          <q-btn
            outline
            color="primary"
            icon="chat"
            label="WhatsApp"
            :disable="!customerPhone(pedido)"
            @click="$emit('whatsapp', pedido)"
          />
          <q-btn
            outline
            color="grey-8"
            icon="print"
            label="Imprimir"
            @click="$emit('print', pedido)"
          />
        </div>

        <div class="row q-gutter-sm">
          <q-btn
            v-if="isAguardando(pedido)"
            color="negative"
            icon="close"
            label="Rejeitar"
            :loading="actionLoading"
            :disable="actionLoading"
            @click="$emit('rejeitar', pedido)"
          />
          <q-btn
            v-if="isAguardando(pedido)"
            color="positive"
            icon="check"
            label="Aceitar"
            :loading="actionLoading"
            :disable="actionLoading || !canAccept"
            @click="$emit('aceitar', pedido)"
          />
          <q-btn
            v-if="isEmPreparo(pedido)"
            color="positive"
            icon="local_shipping"
            label="Despachar"
            :loading="actionLoading"
            :disable="actionLoading"
            @click="$emit('despachar', pedido)"
          />
        </div>
      </q-card-actions>

      <q-banner
        v-if="!isStoreOpen"
        dense
        class="bg-orange-1 text-orange-10 q-mx-md q-mb-md rounded-borders"
      >
        <template #avatar><q-icon name="warning" /></template>
        Loja fechada: não é possível aceitar pedidos.
      </q-banner>

      <q-banner
        v-else-if="credits <= 0"
        dense
        class="bg-orange-1 text-orange-10 q-mx-md q-mb-md rounded-borders"
      >
        <template #avatar><q-icon name="warning" /></template>
        Créditos insuficientes: recarregue para aceitar novos pedidos.
      </q-banner>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  pedido: { type: Object, default: null },

  actionLoading: { type: Boolean, default: false },
  canAccept: { type: Boolean, default: true },
  isStoreOpen: { type: Boolean, default: true },
  credits: { type: Number, default: 0 },

  displayId: { type: Function, required: true },
  customerName: { type: Function, required: true },
  customerPhone: { type: Function, required: true },
  statusLabel: { type: Function, required: true },
  formatDateTime: { type: Function, required: true },
  formatTotal: { type: Function, required: true },
  addressText: { type: Function, required: true },
  orderTypeLabel: { type: Function, required: true },

  pedidoItems: { type: Function, required: true },
  itemQty: { type: Function, required: true },
  itemName: { type: Function, required: true },
  itemObs: { type: Function, required: true },
  itemPriceText: { type: Function, required: true },

  isAguardando: { type: Function, required: true },
  isEmPreparo: { type: Function, required: true },
});

const emit = defineEmits([
  "update:modelValue",
  "aceitar",
  "rejeitar",
  "despachar",
  "print",
  "whatsapp",
]);

const emitModel = (v) => emit("update:modelValue", v);
</script>

<style scoped>
.pedido-card {
  width: 100%;
  max-width: 980px;
  border-radius: 14px;
}

.pedido-item-obs {
  white-space: pre-line;
}
</style>
