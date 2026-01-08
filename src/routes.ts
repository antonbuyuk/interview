import type { RouteRecordRaw } from 'vue-router';
import HomeView from './views/HomeView.vue';
import FlashCardsView from './views/FlashCardsView.vue';
import PracticeModeView from './views/PracticeModeView.vue';
import VocabularyView from './views/VocabularyView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/training/flash-cards',
    name: 'flash-cards',
    component: FlashCardsView,
  },
  {
    path: '/training/practice',
    name: 'practice',
    component: PracticeModeView,
  },
  {
    path: '/vocabulary',
    name: 'vocabulary',
    component: VocabularyView,
  },
];

export default routes;
