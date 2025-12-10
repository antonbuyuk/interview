## Accessibility (a11y)

### 1. ARIA атрибуты и семантика?
**Ответ:** ARIA (Accessible Rich Internet Applications) — атрибуты для улучшения доступности.

**Основные атрибуты:**
```html
<!-- Роли -->
<div role="button" tabindex="0">Click me</div>
<div role="alert">Error message</div>

<!-- Состояния и свойства -->
<button aria-expanded="false" aria-controls="menu">
  Menu
</button>
<div id="menu" aria-hidden="true">Menu content</div>

<!-- Метки -->
<input aria-label="Search" type="text">
<button aria-labelledby="close-btn-label">
  <span id="close-btn-label">Close</span>
</button>
```

**Семантический HTML:**
```html
<!-- Используйте семантические теги -->
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Content</p>
  </article>
</main>

<footer>Footer content</footer>
```

**Answer EN:** ARIA (Accessible Rich Internet Applications) attributes enhance web accessibility for assistive technologies.

**Key attributes:**
```html
<!-- Roles -->
<div role="button" tabindex="0">Click me</div>
<div role="alert">Error message</div>

<!-- States and properties -->
<button aria-expanded="false" aria-controls="menu">
  Menu
</button>
<div id="menu" aria-hidden="true">Menu content</div>

<!-- Labels -->
<input aria-label="Search" type="text">
<button aria-labelledby="close-btn-label">
  <span id="close-btn-label">Close</span>
</button>
```

**Semantic HTML:**
```html
<!-- Use semantic tags -->
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Content</p>
  </article>
</main>

<footer>Footer content</footer>
```

**Ответ Senior:**

**Принципы ARIA:**
- Используйте нативные HTML элементы, когда возможно
- ARIA только когда нативные элементы недостаточны
- Проверяйте с screen readers
- Тестируйте с реальными пользователями

**Продвинутые паттерны:**
- Live regions для динамического контента
- Landmark roles для структуры
- Focus management для модальных окон

### 2. Keyboard navigation и доступность?
**Ответ:** Приложение должно быть полностью доступным с клавиатуры.

**Практики:**
```vue
<template>
  <!-- Правильный порядок tabindex -->
  <button tabindex="0">First</button>
  <button tabindex="0">Second</button>
  <button tabindex="-1">Disabled</button>

  <!-- Обработка клавиш -->
  <div
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
    role="button"
    tabindex="0"
  >
    Clickable div
  </div>
</template>

<script setup>
const handleKeydown = (event) => {
  switch (event.key) {
    case 'ArrowDown':
      focusNext();
      break;
    case 'ArrowUp':
      focusPrevious();
      break;
    case 'Escape':
      closeModal();
      break;
  }
};
</script>
```

**Answer EN:** Applications must be fully keyboard accessible.

**Practices:**
```vue
<template>
  <!-- Correct tabindex order -->
  <button tabindex="0">First</button>
  <button tabindex="0">Second</button>
  <button tabindex="-1">Disabled</button>

  <!-- Keyboard handling -->
  <div
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
    role="button"
    tabindex="0"
  >
    Clickable div
  </div>
</template>

<script setup>
const handleKeydown = (event) => {
  switch (event.key) {
    case 'ArrowDown':
      focusNext();
      break;
    case 'ArrowUp':
      focusPrevious();
      break;
    case 'Escape':
      closeModal();
      break;
  }
};
</script>
```

**Ответ Senior:**

**Focus management:**
- Trap focus в модальных окнах
- Возврат focus после закрытия
- Visible focus indicators
- Skip links для навигации

**Практики:**
- Tab order логичный
- Все интерактивные элементы доступны
- Keyboard shortcuts документированы

---

