import { sections } from './data/sections.js';
import SectionView from './views/SectionView.vue';
import HomeView from './views/HomeView.vue';
import FlashCardsView from './views/FlashCardsView.vue';
import PracticeModeView from './views/PracticeModeView.vue';
import VocabularyView from './views/VocabularyView.vue';

const routes = [
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
  ...sections.map(section => ({
    path: section.path,
    name: section.id,
    component: SectionView,
    props: { section },
  })),
];

export default routes;
