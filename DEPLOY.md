# Деплой на GitHub Pages

Проект настроен для автоматического деплоя на GitHub Pages через GitHub Actions.

## Автоматический деплой

При каждом пуше в ветку `main` автоматически запускается workflow, который:
1. Собирает проект
2. Деплоит на GitHub Pages

Сайт будет доступен по адресу: `https://antonbuyuk.github.io/interview/`

## Первоначальная настройка

1. Перейдите в настройки репозитория на GitHub: Settings → Pages
2. В разделе "Source" выберите "GitHub Actions"
3. Сохраните изменения

## Ручной деплой

Если нужно запустить деплой вручную:
1. Перейдите в раздел "Actions" на GitHub
2. Выберите workflow "Deploy to GitHub Pages"
3. Нажмите "Run workflow"

## Локальная сборка

Для проверки сборки локально:

```bash
npm run build
npm run preview
```

## Изменение base URL

Если вы изменили имя репозитория, обновите `base` в:
- `vite.config.js` (строка 5)
- `src/main.js` (строка 9)

Например, если репозиторий называется `my-repo`, base должен быть `/my-repo/`

