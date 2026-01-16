import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import App from './App.vue';
import routes from './router/routes';
import './styles/app.scss';
import { useSectionsStore } from './stores/sections';
import SectionView from './views/SectionView.vue';
import ErrorBoundary from './components/ErrorBoundary.vue';
import { initSentry } from './utils/sentry';
import { registerServiceWorker } from './utils/offline';

// Base URL для GitHub Pages (должен совпадать с base в vite.config.ts)
const base = import.meta.env.BASE_URL || '/';

const pinia = createPinia();
const router: Router = createRouter({
  history: createWebHistory(base),
  routes,
});

// Создаем приложение
const app = createApp(App);
app.component('ErrorBoundary', ErrorBoundary);

// ВАЖНО: Сначала устанавливаем Pinia, затем Router
// Это гарантирует, что все stores будут доступны в компонентах
app.use(pinia);
app.use(router);

// Инициализация Sentry для мониторинга ошибок и производительности
initSentry(app, router);

// Регистрация Service Worker для offline поддержки
registerServiceWorker();

// Инициализация темы (импорт модуля автоматически инициализирует тему)
import('./composables/useTheme');

// Инициализация keyboard shortcuts
import('./composables/useKeyboardShortcuts').then(m => {
  m.initDefaultShortcuts();
});

// Динамически загружаем разделы из БД и добавляем роуты
// ВАЖНО: Эта функция должна вызываться только после app.use(pinia)
async function loadSectionsRoutes(): Promise<void> {
  try {
    // Проверяем, что Pinia активен перед использованием store
    const { getActivePinia } = await import('pinia');
    const activePinia = getActivePinia();
    if (!activePinia) {
      // Если Pinia не активен, ждем немного и пробуем снова
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryPinia = getActivePinia();
      if (!retryPinia) {
        throw new Error('Pinia не инициализирован. Убедитесь, что app.use(pinia) был вызван.');
      }
    }

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
  } catch (error) {
    console.error('Ошибка загрузки разделов для роутинга:', error);
  }
}

// Загружаем разделы и монтируем приложение
// Используем nextTick для гарантии, что Pinia полностью инициализирован
nextTick(() => {
  loadSectionsRoutes()
    .then(async () => {
      // Сохраняем текущий путь до монтирования
      const currentPath = window.location.pathname;

      // Если текущий путь не является базовым маршрутом,
      // проверяем, что он найден после добавления динамических маршрутов
      if (currentPath !== base && currentPath !== `${base}/`) {
        const matched = router.resolve(currentPath);
        // Если маршрут найден, устанавливаем его как текущий перед монтированием
        if (matched.name) {
          try {
            // Используем replace, чтобы не добавлять запись в историю
            // Это нужно сделать ДО монтирования, чтобы роутер знал о маршруте
            await router.replace(currentPath);
          } catch (error) {
            // Игнорируем ошибки навигации
            console.warn('Ошибка навигации при инициализации:', error);
          }
        }
      }

      // Монтируем приложение после установки правильного маршрута
      app.mount('#app');
    })
    .catch(error => {
      console.error('Ошибка инициализации приложения:', error);
      // Монтируем приложение даже при ошибке, чтобы показать хотя бы базовые страницы
      app.mount('#app');
    });
});
