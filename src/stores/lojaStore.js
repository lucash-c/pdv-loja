// src/stores/lojaStore.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useLojaStore = defineStore('loja', {
  state: () => ({
    settings: null,
    loading: false
  }),

  getters: {
    isOpen: (state) => state.settings?.is_open ?? false,
    pixKey: (state) => state.settings?.pix_key ?? null,
    openTime: (state) => state.settings?.open_time ?? null,
    closeTime: (state) => state.settings?.close_time ?? null
  },

  actions: {
    async fetchSettings() {
      this.loading = true
      try {
        const { data } = await api.get('/api/store-settings')
        this.settings = data ?? {}
      } catch (error) {
        console.error('Erro ao buscar configurações da loja:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateSettings(payload) {
      try {
        const { data } = await api.put('/api/store-settings', payload)
        this.settings = data ?? this.settings
        return data
      } catch (error) {
        console.error('Erro ao atualizar configurações da loja:', error)
        throw error
      }
    }
  },

  persist: true
})
