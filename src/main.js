import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import routes from './routes'

// Base URL для GitHub Pages (должен совпадать с base в vite.config.js)
const base = import.meta.env.BASE_URL || '/'

const router = createRouter({
  history: createWebHistory(base),
  routes
})

createApp(App).use(router).mount('#app')

