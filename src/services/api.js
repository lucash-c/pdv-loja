import { api } from 'src/boot/axios'

async function requestWithFallback(primaryRequest, fallbackRequest) {
  try {
    return await primaryRequest()
  } catch (error) {
    const status = error?.response?.status
    if (status === 404 && typeof fallbackRequest === 'function') {
      return await fallbackRequest()
    }
    throw error
  }
}

export default {
  // =========================
  // AUTH
  // =========================
  login(data) {
    return api.post('/api/auth/login', data)
  },

  register(data) {
    return api.post('/api/auth/register', data)
  },

  selectStore(data) {
    return api.post('/api/auth/select-store', data)
  },

  forgotPassword(data) {
    return api.post('/api/auth/forgot', data)
  },

  // =========================
  // LOJAS (MULTI-LOJA)
  // =========================
  createLoja(data) {
    return api.post('/api/lojas', data)
  },

  listLojas() {
    return api.get('/api/lojas')
  },

  getLojaAtiva() {
    return api.get('/api/lojas/current')
  },

  updateLojaAtiva(data) {
    return api.put('/api/lojas/current', data)
  },

  regeneratePublicKey() {
    return api.post('/api/lojas/current/regenerate-key')
  },

  // =========================
  // STORE SETTINGS (CONFIGURAÇÕES DA LOJA)
  // =========================
  getStoreSettings() {
    return api.get('/api/store-settings')
  },

  upsertStoreSettings(data) {
    return api.put('/api/store-settings', data)
  },

  // =========================
  // CRÉDITOS DA LOJA
  // =========================
  getCreditos(lojaId) {
    return api.get(`/api/lojas/${lojaId}/credits`)
  },

  addCreditos(lojaId, data) {
    return api.post(`/api/lojas/${lojaId}/credits/add`, data)
  },

  async consumeCreditos(lojaId, data) {
    return requestWithFallback(
      () => api.post(`/api/lojas/${lojaId}/credits/consume`, data),
      () => api.post(`/lojas/${lojaId}/credits/consume`, data)
    )
  },

  // =========================
  // PEDIDOS (ADMIN/PDV)
  // =========================
  listPedidos(params = {}) {
    return api.get('/api/orders', { params })
  },

  getPedidoById(id) {
    return api.get(`/api/orders/${id}`)
  },

  updateStatusPedido(id, data) {
    return api.put(`/api/orders/${id}/status`, data)
  },

  aceitarPedido(id) {
    return api.put(`/api/orders/${id}/status`, { status: 'aceito' })
  },

  rejeitarPedido(id) {
    return api.put(`/api/orders/${id}/status`, { status: 'rejeitado' })
  },

  concluirPedido(id) {
    return api.put(`/api/orders/${id}/status`, { status: 'concluído' })
  },

  // =========================
  // PRODUTOS
  // =========================
  async getProdutos(params = {}) {
    return requestWithFallback(
      () => api.get('/api/products', { params }),
      () => api.get('/products', { params })
    )
  },

  async createProduto(data) {
    return requestWithFallback(
      () => api.post('/api/products', data),
      () => api.post('/products', data)
    )
  },

  async getProdutoById(productId) {
    return requestWithFallback(
      () => api.get(`/api/products/${productId}`),
      () => api.get(`/products/${productId}`)
    )
  },

  async updateProduto(productId, data) {
    return requestWithFallback(
      () => api.put(`/api/products/${productId}`, data),
      () => api.put(`/products/${productId}`, data)
    )
  },

  async deleteProduto(productId) {
    return requestWithFallback(
      () => api.delete(`/api/products/${productId}`),
      () => api.delete(`/products/${productId}`)
    )
  },

  // =========================
  // OPÇÕES DO PRODUTO
  // =========================
  async listOpcoesProduto(productId) {
    return requestWithFallback(
      () => api.get(`/api/products/${productId}/options`),
      () => api.get(`/products/${productId}/options`)
    )
  },

  async createOpcaoProduto(productId, data) {
    return requestWithFallback(
      () => api.post(`/api/products/${productId}/options`, data),
      () => api.post(`/products/${productId}/options`, data)
    )
  },

  // =========================
  // ITENS DA OPÇÃO
  // =========================
  async listItensOpcao(optionId) {
    return requestWithFallback(
      () => api.get(`/api/products/options/${optionId}/items`),
      () => api.get(`/options/${optionId}/items`)
    )
  },

  async createItemOpcao(optionId, data) {
    return requestWithFallback(
      () => api.post(`/api/products/options/${optionId}/items`, data),
      () => api.post(`/options/${optionId}/items`, data)
    )
  },

  // =========================
  // CARDÁPIO PÚBLICO
  // =========================
  async getPublicMenu(publicKey) {
    return requestWithFallback(
      () => api.get(`/api/public/menu/${publicKey}`),
      () => api.get(`/public/menu/${publicKey}`)
    )
  }
}
