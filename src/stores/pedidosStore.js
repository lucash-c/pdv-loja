// src/stores/pedidosStore.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { format } from 'date-fns'

export const usePedidosStore = defineStore('pedidos', {
  state: () => ({
    pedidos: [],
    loading: false,
    lastFetchAt: null
  }),

  getters: {
    pedidosHoje: (state) => {
      const hoje = format(new Date(), 'yyyy-MM-dd')
      return state.pedidos.filter(p => p.created_at?.startsWith(hoje))
    },

    pedidosEmAberto: (state) => state.pedidos.filter(p => p.status === 'aguardando aceite')
  },

  actions: {
    async fetchPedidos() {
      this.loading = true
      try {
        const { data } = await api.get('/api/orders')
        this.pedidos = Array.isArray(data) ? data : []
        this.lastFetchAt = new Date()
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPedidoById(id) {
      try {
        const { data } = await api.get(`/api/orders/${id}`)
        return data
      } catch (error) {
        console.error('Erro ao buscar pedido:', error)
        throw error
      }
    },

    async aceitarPedido(pedidoId) {
      try {
        await api.put(`/api/orders/${pedidoId}/status`, { status: 'em preparo' })
        const pedido = this.pedidos.find(p => p.id === pedidoId)
        if (pedido) pedido.status = 'em preparo'
      } catch (error) {
        console.error('Erro ao aceitar pedido:', error)
        throw error
      }
    },

    async rejeitarPedido(pedidoId) {
      try {
        await api.put(`/api/orders/${pedidoId}/status`, { status: 'cancelado' })
        const pedido = this.pedidos.find(p => p.id === pedidoId)
        if (pedido) pedido.status = 'cancelado'
      } catch (error) {
        console.error('Erro ao rejeitar pedido:', error)
        throw error
      }
    },

    async atualizarStatus(pedidoId, payload = {}) {
      try {
        const { data } = await api.put(`/api/orders/${pedidoId}/status`, payload)
        const pedido = this.pedidos.find(p => p.id === pedidoId)
        if (pedido && data) Object.assign(pedido, data)
        return data
      } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error)
        throw error
      }
    }
  },

  persist: true
})
