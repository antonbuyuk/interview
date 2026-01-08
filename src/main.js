import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import routes from './routes';
import './styles/app.scss';
import { getSections } from './api/sections';
import SectionView from './views/SectionView.vue';

// Base URL для GitHub Pages (должен совпадать с base в vite.config.js)
const base = import.meta.env.BASE_URL || '/';

const router = createRouter({
  history: createWebHistory(base),
  routes,
});

// Динамически загружаем разделы из БД и добавляем роуты
async function loadSectionsRoutes() {
  try {
    const sections = await getSections();
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
