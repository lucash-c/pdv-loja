import { createRouter, createWebHistory } from 'vue-router'

// Layouts
const MainLayout = () => import('src/layouts/MainLayout.vue')

// Páginas
const LoginPage = () => import('src/pages/LoginPage.vue')
const SelectLojaPage = () => import('src/pages/SelectLojaPage.vue')
const DashboardPage = () => import('src/pages/DashboardPage.vue')
const PedidosPage = () => import('src/pages/PedidosPage.vue')
// const ProdutosPage = () => import('src/pages/ProdutosPage.vue')
// const ConfiguracoesPage = () => import('src/pages/configuracoes/ConfiguracoesPage.vue')
const ErrorNotFound = () => import('src/pages/ErrorNotFound.vue')

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { public: true }
  },
  {
    path: '/select-loja',
    name: 'select-loja',
    component: SelectLojaPage,
    meta: { requiresUserAuth: true }
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/login' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardPage,
        meta: { requiresStoreAuth: true }
      },
      {
        path: 'pedidos',
        name: 'pedidos',
        component: PedidosPage,
        meta: { requiresStoreAuth: true }
      }
      /*
      {
        path: 'produtos',
        name: 'produtos',
        component: ProdutosPage,
        meta: { requiresStoreAuth: true }
      },
      {
        path: 'configuracoes',
        name: 'configuracoes',
        component: ConfiguracoesPage,
        meta: { requiresStoreAuth: true }
      },
      */
    ]
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: ErrorNotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userToken =
    localStorage.getItem('user_token') ||
    localStorage.getItem('token_user') ||
    localStorage.getItem('token')

  const storeToken =
    localStorage.getItem('store_token') ||
    localStorage.getItem('token_loja') ||
    localStorage.getItem('loja_token')

  if (to.meta.requiresStoreAuth) {
    if (!userToken) return next({ name: 'login' })
    if (!storeToken) return next({ name: 'select-loja' })
  }

  if (to.meta.requiresUserAuth && !userToken) {
    return next({ name: 'login' })
  }

  if (to.name === 'login') {
    if (userToken && storeToken) return next({ name: 'dashboard' })
    if (userToken && !storeToken) return next({ name: 'select-loja' })
  }

  next()
})

export default router
