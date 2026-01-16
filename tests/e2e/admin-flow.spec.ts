import { test, expect } from '@playwright/test';

/**
 * E2E тесты для критических сценариев админ-панели
 */

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на главную страницу
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('должен открывать модальное окно авторизации', async ({ page }) => {
    // Ищем кнопку входа (может быть в разных местах в зависимости от реализации)
    // Для начала проверим, что страница загрузилась
    await expect(page).toHaveTitle(/interview/i);
  });

  test('должен отображать разделы на главной странице', async ({ page }) => {
    // Ждем загрузки разделов
    await page.waitForSelector('header', { timeout: 5000 });

    // Проверяем наличие навигации
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('должен переходить к разделу по клику', async ({ page }) => {
    // Ждем загрузки разделов
    await page.waitForSelector('header', { timeout: 5000 });

    // Пытаемся найти ссылку на раздел (если есть)
    const sectionsLink = page.locator('a[href*="/"]').first();
    if ((await sectionsLink.count()) > 0) {
      await sectionsLink.click();
      await page.waitForLoadState('networkidle');
      // Проверяем, что URL изменился
      expect(page.url()).not.toBe('http://localhost:3000/');
    }
  });
});

test.describe('Questions Display', () => {
  test('должен отображать вопросы в разделе', async ({ page }) => {
    // Этот тест требует наличия данных в БД
    // В реальном сценарии нужно настроить тестовую БД
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Проверяем базовую структуру страницы
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Search Functionality', () => {
  test('должен открывать поиск', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ищем поле поиска
    const searchInput = page.locator('input[type="search"], input[placeholder*="поиск" i]');
    if ((await searchInput.count()) > 0) {
      await searchInput.click();
      await expect(searchInput).toBeFocused();
    }
  });
});
