import { createApp } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import App from './App.vue';
import routes from './routes';
import './styles/app.scss';
import { getSections } from './api/sections';
import SectionView from './views/SectionView.vue';
import type { Section } from './types/api';

// Base URL для GitHub Pages (должен совпадать с base в vite.config.ts)
const base = import.meta.env.BASE_URL || '/';

const router: Router = createRouter({
  history: createWebHistory(base),
  routes,
});

// Динамически загружаем разделы из БД и добавляем роуты
async function loadSectionsRoutes(): Promise<void> {
  try {
    const sections: Section[] = await getSections();
    sections.forEach(section => {
      router.addRoute({
        path: section.path,
        name: section.sectionId,
        component: SectionView,
        props: { section },
      });
    });
  } catch (error) {
    console.error('Ошибка загрузки разделов для роутинга:', error);
  }
}

// Загружаем разделы перед монтированием приложения
loadSectionsRoutes().then(() => {
  createApp(App).use(router).mount('#app');
});
