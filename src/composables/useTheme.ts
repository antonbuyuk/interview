/**
 * Composable для управления темой приложения (светлая/темная)
 */

import { ref, watch } from 'vue';

export type Theme = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'app-theme';

// Определяем предпочтение системы
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Текущая тема
const currentTheme = ref<Theme>('auto');
const effectiveTheme = ref<'light' | 'dark'>('light');

/**
 * Применяет тему к документу
 */
const applyTheme = (theme: 'light' | 'dark'): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  // Удаляем все классы тем
  root.classList.remove('dark', 'light');
  // Устанавливаем атрибут и класс
  root.setAttribute('data-theme', theme);
  root.classList.add(theme);
};

/**
 * Обновляет эффективную тему на основе текущей настройки
 */
const updateEffectiveTheme = (): void => {
  if (currentTheme.value === 'auto') {
    effectiveTheme.value = getSystemTheme();
  } else {
    effectiveTheme.value = currentTheme.value;
  }
  applyTheme(effectiveTheme.value);
};

/**
 * Инициализирует тему из localStorage или системных настроек
 */
const initTheme = (): void => {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored && (stored === 'light' || stored === 'dark' || stored === 'auto')) {
    currentTheme.value = stored;
  } else {
    currentTheme.value = 'auto';
  }

  updateEffectiveTheme();

  // Слушаем изменения системной темы
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateEffectiveTheme);
  }
};

/**
 * Устанавливает тему
 */
const setTheme = (theme: Theme): void => {
  currentTheme.value = theme;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
  updateEffectiveTheme();
};

/**
 * Переключает между светлой и темной темой
 * Упрощенная логика: только light <-> dark
 */
const toggleTheme = (): void => {
  if (currentTheme.value === 'light') {
    setTheme('dark');
  } else {
    // Если dark или auto, переключаем на light
    setTheme('light');
  }
};

/**
 * Инициализация темы при загрузке модуля
 */
if (typeof window !== 'undefined') {
  initTheme();
}

/**
 * Composable для использования темы
 */
export function useTheme() {
  // Инициализируем тему, если еще не инициализирована
  if (typeof window !== 'undefined' && !document.documentElement.hasAttribute('data-theme')) {
    initTheme();
  }

  watch(currentTheme, () => {
    updateEffectiveTheme();
  });

  // Также следим за изменениями effectiveTheme для реактивности в компонентах
  watch(effectiveTheme, () => {
    // effectiveTheme уже обновлен в updateEffectiveTheme
  });

  return {
    currentTheme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    isDark: () => effectiveTheme.value === 'dark',
    isLight: () => effectiveTheme.value === 'light',
  };
}
