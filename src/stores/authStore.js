import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userToken: null,
    storeToken: null,

    user: null,
    lojas: [],

    selectedLoja: null,

    loja: null,
    userLoja: null
  }),

  getters: {
    isUserAuthenticated: (state) => !!state.userToken,
    isStoreAuthenticated: (state) => !!state.storeToken,
    isAuthenticated: (state) => !!state.storeToken,
    credits: (state) => state.userLoja?.credits ?? 0,
    isStoreOpen: (state) => state.loja?.is_open ?? false
  },

  actions: {
    _setJSON(key, value) {
      try {
        if (value === null || value === undefined) {
          localStorage.removeItem(key)
          return
        }
        localStorage.setItem(key, JSON.stringify(value))
      } catch (e) {
        console.warn(`Falha ao salvar ${key} no localStorage`, e)
      }
    },

    _syncTokensToStorage() {
      if (this.userToken) localStorage.setItem('user_token', this.userToken)
      else localStorage.removeItem('user_token')

      if (this.storeToken) localStorage.setItem('store_token', this.storeToken)
      else localStorage.removeItem('store_token')
    },

    _syncStoreInfoToStorage() {
      this._setJSON('auth_user', this.user)
      this._setJSON('auth_lojas', this.lojas)
      this._setJSON('auth_selected_loja', this.selectedLoja)
      this._setJSON('auth_loja', this.loja)
      this._setJSON('auth_user_loja', this.userLoja)
    },

    setAuthData(payload = {}) {
      if (payload.token) this.userToken = payload.token

      if (payload.user !== undefined) this.user = payload.user
      if (Array.isArray(payload.lojas)) this.lojas = payload.lojas

      if (payload.selectedLoja !== undefined) this.selectedLoja = payload.selectedLoja
      if (payload.loja !== undefined) this.loja = payload.loja
      if (payload.userLoja !== undefined) this.userLoja = payload.userLoja

      if (payload.storeToken) this.storeToken = payload.storeToken

      this._syncTokensToStorage()
      this._syncStoreInfoToStorage()
    },

    async login(email, password) {
      try {
        const { data } = await api.post('/api/auth/login', { email, password })
        return data
      } catch (error) {
        console.error('Erro no login:', error)
        throw error
      }
    },

    async selectStore(lojaId) {
      try {
        if (!lojaId) throw new Error('loja_id é obrigatório para selecionar loja')

        const token =
          this.userToken ||
          localStorage.getItem('user_token')

        const headers = token ? { Authorization: `Bearer ${token}` } : undefined

        const { data } = await api.post('/api/auth/select-store', { loja_id: lojaId }, { headers })

        this.storeToken = data?.token ?? null

        this.loja = data?.loja ?? this.loja ?? null
        this.userLoja = data?.userLoja ?? this.userLoja ?? null

        const fromList = (this.lojas || []).find((l) => l?.id === lojaId) || null
        this.selectedLoja = fromList || data?.loja || { id: lojaId }

        this._syncTokensToStorage()
        this._syncStoreInfoToStorage()

        return data
      } catch (error) {
        console.error('Erro ao selecionar loja:', error)
        throw error
      }
    },

    logout() {
      this.userToken = null
      this.storeToken = null
      this.user = null
      this.lojas = []
      this.selectedLoja = null
      this.loja = null
      this.userLoja = null

      localStorage.removeItem('user_token')
      localStorage.removeItem('store_token')

      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_lojas')
      localStorage.removeItem('auth_selected_loja')
      localStorage.removeItem('auth_loja')
      localStorage.removeItem('auth_user_loja')
    },

    clearStoreSession() {
      this.storeToken = null
      this.selectedLoja = null
      this.loja = null
      this.userLoja = null

      localStorage.removeItem('store_token')
      localStorage.removeItem('auth_loja')
      localStorage.removeItem('auth_selected_loja')
      localStorage.removeItem('auth_user_loja')
    }
  },

  persist: true
})
