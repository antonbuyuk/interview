## CSS / Styling

### 1. Что такое CSS Grid и Flexbox?
**Ответ:** Flexbox и Grid — современные системы раскладки в CSS для создания гибких макетов. Flexbox предназначен для одномерной раскладки (по строке или колонке), идеально подходит для выравнивания элементов внутри контейнера. Grid обеспечивает двумерную раскладку (одновременно по строкам и колонкам), что делает его оптимальным выбором для создания сложных структур страниц.

- **Flexbox**: одномерная раскладка (строка или колонка)
- **Grid**: двумерная раскладка (строки и колонки одновременно)

**Answer EN:** Flexbox and Grid are modern CSS layout systems for creating flexible layouts. Flexbox is designed for one-dimensional layout (row or column), ideal for aligning elements within a container. Grid provides two-dimensional layout (rows and columns simultaneously), making it the optimal choice for creating complex page structures.

- **Flexbox**: one-dimensional layout (row or column)
- **Grid**: two-dimensional layout (rows and columns simultaneously)

**Ответ Senior:**

**Когда использовать:**
- Flexbox — для компонентов, навигации, выравнивания элементов
- Grid — для layout страниц, сложных двумерных структур

**Комбинирование:**
- Grid для основной структуры страницы
- Flexbox внутри Grid ячеек для компонентов

### 2. Что такое BEM?
**Ответ:** BEM (Block Element Modifier) — методология именования CSS классов, которая помогает создавать понятную и поддерживаемую структуру стилей. Блок — независимый компонент, Элемент — часть блока, а Модификатор — вариант или состояние. Такой подход устраняет конфликты стилей, делает код более предсказуемым и упрощает работу в команде.

Блок-Элемент-Модификатор — методология именования CSS классов:
```css
.block__element--modifier
```

**Answer EN:** BEM (Block Element Modifier) is a CSS class naming methodology that helps create clear and maintainable style structures. Block is an independent component, Element is part of a block, and Modifier is a variant or state. This approach eliminates style conflicts, makes code more predictable and simplifies team work.

Block-Element-Modifier CSS class naming methodology:
```css
.block__element--modifier
```

**Ответ Senior:**

**Правила BEM:**
- Блок — независимый компонент
- Элемент — часть блока (двойное подчеркивание)
- Модификатор — вариант (двойной дефис)

**Пример:**
```css
.card { } /* блок */
.card__header { } /* элемент */
.card__header--highlighted { } /* модификатор */
```

**Альтернативы:**
- CSS Modules
- Styled Components
- Tailwind CSS utility-first

### 3. Разница между `margin` и `padding`?
**Ответ:** Margin и padding определяют пространство вокруг элемента, но в разных контекстах. Margin — это внешний отступ за пределами границы элемента, который создает расстояние между соседними элементами. Padding — это внутренний отступ внутри границы элемента, который увеличивает пространство между границей и содержимым элемента.

- **margin**: внешний отступ (вне элемента)
- **padding**: внутренний отступ (внутри элемента)

**Answer EN:** Margin and padding define space around an element, but in different contexts. Margin is the outer spacing outside the element's border that creates distance between adjacent elements. Padding is the inner spacing inside the element's border that increases space between the border and element content.

- **margin**: outer spacing (outside element)
- **padding**: inner spacing (inside element)

**Ответ Senior:**

**Особенности:**
- Margin может схлопываться (collapsing)
- Padding считается частью размера элемента (box-sizing)
- Margin может быть отрицательным, padding — нет
- Padding влияет на область клика, margin — нет

**Best practices:**
- Используйте margin для расстояний между элементами
- Используйте padding для внутренних отступов контента

### 4. Что такое CSS переменные?
**Ответ:** CSS переменные (custom properties) — это механизм для создания переиспользуемых значений в CSS, объявляемых через синтаксис `--variable-name`. Они поддерживают каскадность, могут изменяться динамически через JavaScript и позволяют создавать темы и динамические стили. Основное преимущество — возможность централизованного управления значениями, которые используются в множестве мест.

Пользовательские свойства для хранения значений, которые можно переиспользовать:
```css
:root {
  --primary-color: #007bff;
}
.element {
  color: var(--primary-color);
}
```

**Answer EN:** CSS variables (custom properties) are a mechanism for creating reusable values in CSS, declared using `--variable-name` syntax. They support cascading, can be changed dynamically via JavaScript and allow creating themes and dynamic styles. Main advantage is centralized management of values used in multiple places.

Custom properties for storing reusable values:
```css
:root {
  --primary-color: #007bff;
}
.element {
  color: var(--primary-color);
}
```

**Ответ Senior:**

**Преимущества:**
- Динамическое изменение через JavaScript
- Каскадность (наследование)
- Fallback значения: `var(--color, #000)`
- Область видимости (локальные переменные)

**Практическое применение:**
```css
:root {
  --theme-color: #007bff;
}
.dark-theme {
  --theme-color: #6c757d;
}
.element {
  color: var(--theme-color); /* автоматически меняется */
}
```

---

