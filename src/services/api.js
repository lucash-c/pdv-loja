import { api } from 'src/boot/axios'

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

  consumeCreditos(lojaId, data) {
    return api.post(`/api/lojas/${lojaId}/credits/consume`, data)
  },

  // =========================
  // PEDIDOS (ADMIN/PDV)
  // =========================
  createPedidoPublic(publicKey, data) {
    return api.post('/api/orders', data, {
      headers: {
        'X-LOJA-KEY': publicKey
      }
    })
  },

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
  getProdutos(params = {}) {
    return api.get('/products', { params })
  },

  createProduto(data) {
    return api.post('/products', data)
  },

  getProdutoById(productId) {
    return api.get(`/products/${productId}`)
  },

  updateProduto(productId, data) {
    return api.put(`/products/${productId}`, data)
  },

  deleteProduto(productId) {
    return api.delete(`/products/${productId}`)
  },

  // =========================
  // OPÇÕES DO PRODUTO
  // =========================
  listOpcoesProduto(productId) {
    return api.get(`/products/${productId}/options`)
  },

  createOpcaoProduto(productId, data) {
    return api.post(`/products/${productId}/options`, data)
  },

  updateOpcaoProduto(productId, optionId, data) {
    return api.put(`/products/${productId}/options/${optionId}`, data)
  },

  deleteOpcaoProduto(productId, optionId) {
    return api.delete(`/products/${productId}/options/${optionId}`)
  },

  // =========================
  // ITENS DA OPÇÃO
  // =========================
  listItensOpcao(optionId) {
    return api.get(`/products/options/${optionId}/items`)
  },

  createItemOpcao(optionId, data) {
    return api.post(`/products/options/${optionId}/items`, data)
  },

  updateItemOpcao(optionId, itemId, data) {
    return api.put(`/products/options/${optionId}/items/${itemId}`, data)
  },

  deleteItemOpcao(optionId, itemId) {
    return api.delete(`/products/options/${optionId}/items/${itemId}`)
  },

  // =========================
  // CARDÁPIO PÚBLICO
  // =========================
  getPublicMenu(publicKey) {
    return api.get(`/public/menu/${publicKey}`)
  }
}
