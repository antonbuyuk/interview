import type { RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import VocabularyView from '../views/VocabularyView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/vocabulary',
    name: 'vocabulary',
    component: VocabularyView,
  },
];

export default routes;
