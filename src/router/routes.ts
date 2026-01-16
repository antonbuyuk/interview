import type { RouteRecordRaw } from 'vue-router';

// Lazy loading для всех роутов для оптимизации code splitting
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/vocabulary',
    name: 'vocabulary',
    component: () => import('../views/VocabularyView.vue'),
  },
];

export default routes;
