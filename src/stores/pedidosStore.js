// src/stores/pedidosStore.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

const toLocalDate = (value) => {
  if (!value) return null
  const dt = new Date(value)
  return Number.isNaN(dt.getTime()) ? null : dt
}

const isSameLocalDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const usePedidosStore = defineStore('pedidos', {
  state: () => ({
    pedidos: [],
    loading: false,
    lastFetchAt: null
  }),

  getters: {
    pedidosHoje: (state) => {
      const hoje = new Date()
      return state.pedidos.filter(p => {
        const createdAt = toLocalDate(p?.created_at)
        return createdAt ? isSameLocalDay(createdAt, hoje) : false
      })
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
