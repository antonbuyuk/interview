/**
 * Утилиты для работы с offline режимом
 */

import { ref, onMounted, onUnmounted } from 'vue';

const isOnline = ref(navigator.onLine);
const isServiceWorkerRegistered = ref(false);

/**
 * Регистрация Service Worker
 */
export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      isServiceWorkerRegistered.value = true;
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

/**
 * Composable для отслеживания online/offline статуса
 */
export function useOffline() {
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine;
  };

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    registerServiceWorker();
  });

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  });

  return {
    isOnline,
    isServiceWorkerRegistered,
  };
}
