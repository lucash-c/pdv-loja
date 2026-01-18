import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { getActivePinia } from 'pinia'
import { useAuthStore } from 'src/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000
})

const getRequestPath = (error) => {
  const requestUrl = error?.config?.url
  if (!requestUrl) return ''
  try {
    const baseURL =
      error?.config?.baseURL || api.defaults.baseURL || window.location.origin
    return new URL(requestUrl, baseURL).pathname
  } catch (e) {
    console.log('Erro ao analisar URL no interceptor', e)
    return requestUrl
  }
}

const isStoreEndpoint = (path, error) => {
  if (!path) return false
  const normalized = path.replace(/\/+$/, '')
  if (
    normalized === '/api/lojas/current' ||
    normalized.startsWith('/api/store-settings') ||
    /^\/api\/lojas\/[^/]+\/credits$/.test(normalized)
  ) {
    return true
  }

  const errorCode = error?.response?.data?.error || error?.response?.data?.code
  if (typeof errorCode === 'string' && /loja|store/i.test(errorCode)) {
    return true
  }

  return false
}

const isUserAuthEndpoint = (path) => path?.startsWith('/api/auth')

export default boot(({ router }) => {
  api.interceptors.request.use((config) => {
    try {
      const pinia = getActivePinia()
      if (pinia) {
        const authStore = useAuthStore(pinia)

        const storeToken =
          authStore?.storeToken ||
          localStorage.getItem('store_token') ||
          localStorage.getItem('token_loja') ||
          localStorage.getItem('loja_token') ||
          localStorage.getItem('token')

        if (storeToken) {
          config.headers.Authorization = `Bearer ${storeToken}`
        }
      }
    } catch (e) {
      console.warn('Pinia não ativo no request interceptor', e)
    }

    return config
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      try {
        const pinia = getActivePinia()
        if (pinia && error.response?.status === 401) {
          const authStore = useAuthStore(pinia)
          const path = getRequestPath(error)

          if (isStoreEndpoint(path, error)) {
            authStore.clearStoreSession()

            if (router?.currentRoute?.value?.name !== 'select-loja') {
              router.replace({ name: 'select-loja' })
            }
          } else if (isUserAuthEndpoint(path)) {
            authStore.logout()
          }
        }
      } catch (e) {
        console.warn('Pinia não ativo no response interceptor', e)
      }
      return Promise.reject(error)
    }
  )

  return { api }
})

export { api }
