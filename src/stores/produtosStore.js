// src/stores/produtosStore.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useProdutosStore = defineStore('produtos', {
  state: () => ({
    produtos: [],
    loading: false
  }),

  getters: {
    produtosAtivos(state) {
      return state.produtos.filter(p => p.is_active !== false)
    }
  },

  actions: {
    async fetchProdutos(activeOnly = false) {
      this.loading = true
      try {
        const { data } = await api.get(
          activeOnly ? '/api/products?active=true' : '/api/products'
        )
        this.produtos = Array.isArray(data) ? data : []
      } finally {
        this.loading = false
      }
    },

    async getProdutoById(productId) {
      const { data } = await api.get(`/api/products/${productId}`)
      return data
    },

    async criarProduto(payload) {
      const { data } = await api.post('/api/products', payload)
      if (data) this.produtos.push(data)
      return data
    },

    async atualizarProduto(productId, payload) {
      const { data } = await api.put(`/api/products/${productId}`, payload)
      this.produtos = this.produtos.map(p => (p.id === productId ? data : p))
      return data
    },

    async desativarProduto(productId) {
      await api.delete(`/api/products/${productId}`)
      this.produtos = this.produtos.filter(p => p.id !== productId)
    },

    // =========================
    // OPÇÕES (DOC: /api/products/{productId}/options)
    // =========================
    async listarOpcoes(productId) {
      const { data } = await api.get(`/api/products/${productId}/options`)
      return Array.isArray(data) ? data : []
    },

    async criarOpcao(productId, payload) {
      const { data } = await api.post(`/api/products/${productId}/options`, payload)
      return data
    },

    // =========================
    // ITENS (DOC: /api/products/options/{optionId}/items)
    // =========================
    async listarItensOpcao(optionId) {
      const { data } = await api.get(`/api/products/options/${optionId}/items`)
      return Array.isArray(data) ? data : []
    },

    async criarItemOpcao(optionId, payload) {
      const { data } = await api.post(`/api/products/options/${optionId}/items`, payload)
      return data
    }
  }
})
