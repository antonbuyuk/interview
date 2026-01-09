import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import App from './App.vue';
import routes from './routes';
import './styles/app.scss';
import { useSectionsStore } from './stores/sections';
import SectionView from './views/SectionView.vue';

// Base URL для GitHub Pages (должен совпадать с base в vite.config.ts)
const base = import.meta.env.BASE_URL || '/';

const pinia = createPinia();
const router: Router = createRouter({
  history: createWebHistory(base),
  routes,
});

// Создаем приложение и устанавливаем Pinia и Router
const app = createApp(App);
app.use(pinia);
app.use(router);

// Динамически загружаем разделы из БД и добавляем роуты
async function loadSectionsRoutes(): Promise<void> {
  try {
    const sectionsStore = useSectionsStore();
    await sectionsStore.loadSections();

    // Получаем актуальное значение sections после загрузки через метод
    const loadedSections = sectionsStore.getSectionsArray();

    if (!loadedSections || loadedSections.length === 0) {
      console.warn('Разделы не загружены или пусты');
      return;
    }

    // Добавляем маршруты для каждого раздела
    loadedSections.forEach(section => {
      router.addRoute({
        path: section.path,
        name: section.sectionId,
        component: SectionView,
        props: { section },
      });
    });

    console.log(
      `Добавлено ${loadedSections.length} маршрутов для разделов:`,
      loadedSections.map(s => s.path)
    );
  } catch (error) {
    console.error('Ошибка загрузки разделов для роутинга:', error);
  }
}

// Загружаем разделы и монтируем приложение
loadSectionsRoutes().then(() => {
  app.mount('#app');
});
