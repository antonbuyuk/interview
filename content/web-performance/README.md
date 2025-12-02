## Web Performance

### 1. Что такое Web Vitals?
**Ответ:** Web Vitals — это набор ключевых метрик производительности веб-сайтов, определенных Google для оценки пользовательского опыта. Основные метрики включают LCP (скорость загрузки основного контента), INP (задержка интерактивности) и CLS (стабильность визуального контента). Эти метрики напрямую влияют на ранжирование в поисковых системах и помогают выявлять проблемы производительности.

Метрики производительности:
- **LCP (Largest Contentful Paint)**: время загрузки основного контента
- **FID (First Input Delay)**: задержка первого взаимодействия
- **CLS (Cumulative Layout Shift)**: стабильность визуального контента

**Ответ Senior:**

**Core Web Vitals (2024):**
- LCP — хороший < 2.5s
- INP (Interaction to Next Paint) — заменил FID, хороший < 200ms
- CLS — хороший < 0.1

**Дополнительные метрики:**
- FCP (First Contentful Paint)
- TTI (Time to Interactive)
- TBT (Total Blocking Time)

**Измерение:**
- Chrome DevTools Lighthouse
- PageSpeed Insights
- Real User Monitoring (RUM)

### 2. Как оптимизировать загрузку изображений?
**Ответ:** Оптимизация изображений включает использование современных форматов (WebP, AVIF), которые обеспечивают лучшее сжатие при сохранении качества. Lazy loading откладывает загрузку изображений до момента их появления в viewport, уменьшая начальный размер страницы. Responsive images через `srcset` и `sizes` позволяют загружать изображения нужного размера в зависимости от устройства, что значительно экономит трафик и ускоряет загрузку.

- Использовать современные форматы (WebP, AVIF)
- Lazy loading
- Responsive images (`srcset`, `sizes`)
- Оптимизация размера файлов

**Ответ Senior:**

**Стратегии:**
```html
<!-- Responsive images -->
<img srcset="image-320w.webp 320w,
             image-640w.webp 640w,
             image-1280w.webp 1280w"
     sizes="(max-width: 640px) 320px,
            (max-width: 1280px) 640px,
            1280px"
     loading="lazy"
     alt="Description">

<!-- Picture element для форматов -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description">
</picture>
```

**Техники:**
- CDN для изображений
- Blur placeholder для лучшего UX
- Оптимизация размеров под viewport

### 3. Что такое code splitting?
**Ответ:** Code splitting — это техника разделения JavaScript кода на более мелкие части (chunks), которые загружаются по требованию, а не все сразу. Это уменьшает начальный размер бандла, ускоряет первичную загрузку страницы и позволяет параллельно загружать отдельные части приложения. Современные сборщики поддерживают автоматический code splitting на основе динамических импортов и маршрутов.

**Ответ Senior:**

**Стратегии:**
- Route-based splitting (по маршрутам)
- Component-based splitting (тяжелые компоненты)
- Vendor splitting (отдельный chunk для node_modules)

**В Nuxt/Vue:**
```javascript
// Динамический импорт
const HeavyComponent = () => import('./HeavyComponent.vue');

// Vue Router
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.vue')
  }
];
```

**Преимущества:**
- Меньше начальный bundle
- Параллельная загрузка
- Кэширование отдельных chunks

---

