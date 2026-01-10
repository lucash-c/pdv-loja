import { createApp } from 'vue'
import { Quasar } from 'quasar'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import 'quasar/dist/quasar.css'
import '@quasar/extras/material-icons/material-icons.css'

// Criar app e Pinia
const app = createApp(App)
const pinia = createPinia()

// Registrar plugins antes de qualquer store
app.use(Quasar)
app.use(pinia)
app.use(router)

// Boot do Axios é importado **depois** de Pinia estar ativo
import('./boot/axios.js')

app.mount('#app')
