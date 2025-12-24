## Общие вопросы

### 1. Что такое SPA (Single Page Application)?
**Ответ:** SPA — веб-приложение, которое загружает одну HTML-страницу и динамически обновляет контент без перезагрузки. Весь UI рендерится на клиенте через JavaScript после первоначальной загрузки.

**Преимущества:**
- Быстрая навигация после первой загрузки
- Лучший UX (нет мигания при переходах)
- Эффективное использование клиентских ресурсов

**Недостатки:**
- Медленная первоначальная загрузка
- Проблемы с SEO (требует SSR/SSG)

**Answer EN:** SPA is a web application that loads a single HTML page and dynamically updates content without reloading. All UI is rendered on client via JavaScript after initial load.

**Advantages:**
- Fast navigation after first load
- Better UX (no flickering on transitions)
- Efficient client resource usage

**Disadvantages:**
- Slow initial load
- SEO issues (requires SSR/SSG)

**Ответ Senior:**

SPA — архитектурный подход, где весь UI рендерится на клиенте через JavaScript после первоначальной загрузки. Сервер предоставляет только данные (часто через REST API или GraphQL).

**Преимущества:**
- Быстрая навигация после первой загрузки
- Лучший UX (нет мигания при переходах)
- Эффективное использование клиентских ресурсов
- Возможность офлайн работы

**Недостатки:**
- Медленная первоначальная загрузка
- Проблемы с SEO (требует SSR/SSG)
- Высокая нагрузка на клиент
- Сложность отладки

**Технологии:** React Router, Vue Router, Angular Router для маршрутизации.

### 2. Что такое Virtual DOM?
**Ответ:** Virtual DOM — абстракция реального DOM в памяти, представление DOM в виде JavaScript объектов. При изменениях создаётся новый VDOM, сравнивается со старым (diffing), и только различия применяются к реальному DOM (reconciliation).

**Процесс:**
1. Создание VDOM дерева
2. Изменение состояния
3. Diffing (сравнение)
4. Reconciliation (обновление DOM)

**Answer EN:** Virtual DOM is an abstraction of real DOM in memory, representation of DOM as JavaScript objects. On changes, new VDOM is created, compared with old (diffing), and only differences are applied to real DOM (reconciliation).

**Process:**
1. Create VDOM tree
2. Change state
3. Diffing (comparison)
4. Reconciliation (DOM update)

**Ответ Senior:**

Virtual DOM — представление реального DOM в виде JavaScript объектов. При изменениях создаётся новый VDOM, сравнивается со старым (diffing), и только различия применяются к реальному DOM (reconciliation).

**Процесс работы:**
1. Создание VDOM дерева
2. Изменение состояния
3. Создание нового VDOM
4. Diffing (сравнение старого и нового)
5. Reconciliation (обновление реального DOM)

**Преимущества:**
- Батчинг обновлений
- Оптимизация изменений
- Абстракция от нативного DOM API

**Альтернативы:** Svelte использует компиляцию, Vue 3 — compile-time оптимизацию.

### 3. Разница между `null` и `undefined`?
**Ответ:**
- **null**: явно установленное пустое значение (объект)
- **undefined**: переменная объявлена, но значение не присвоено (примитив)

```javascript
let a = null      // явно установлено пустое значение
let b             // undefined - значение не присвоено
console.log(null === undefined)  // false
console.log(null == undefined)  // true
```

**Answer EN:**
- **null**: explicitly set empty value (object)
- **undefined**: variable declared but value not assigned (primitive)

```javascript
let a = null      // explicitly set empty value
let b             // undefined - value not assigned
console.log(null === undefined)  // false
console.log(null == undefined)   // true
```

**Ответ Senior:**

`null` — намеренное отсутствие значения (объект), `undefined` — значение ещё не было присвоено (примитив). В TypeScript: `null` и `undefined` — отдельные типы. В API: используйте `null` для "значение отсутствует", `undefined` для "свойство не задано".

**Проверки:**
```javascript
value === null; // только null
value === undefined; // только undefined
value == null; // и null, и undefined
value ?? defaultValue; // nullish coalescing
```

### 4. Что такое debounce и throttle?
**Ответ:**
- **debounce**: выполнение функции после паузы в действиях (откладывает выполнение)
- **throttle**: выполнение функции не чаще указанного интервала (ограничивает частоту)

```javascript
// debounce - после паузы
const debounced = debounce(() => console.log('Search'), 300)

// throttle - не чаще интервала
const throttled = throttle(() => console.log('Scroll'), 100)
```

**Answer EN:**
- **debounce**: function execution after pause in actions (delays execution)
- **throttle**: function execution no more often than specified interval (limits frequency)

```javascript
// debounce - after pause
const debounced = debounce(() => console.log('Search'), 300)

// throttle - no more often than interval
const throttled = throttle(() => console.log('Scroll'), 100)
```

**Ответ Senior:**
- **throttle**: выполнение функции не чаще определенного интервала

**Ответ Senior:**

**Debounce** — задержка выполнения до завершения серии действий. **Throttle** — ограничение частоты выполнения. Debounce для поиска/валидации, throttle для скролла/ресайза.

**Реализация:**
```javascript
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```

### 5. Что такое мемоизация?
**Ответ:** Мемоизация — кэширование результатов выполнения функции для избежания повторных вычислений. При повторном вызове с теми же аргументами возвращается закэшированный результат.

```javascript
const memoize = (fn) => {
  const cache = new Map()
  return (...args) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = fn(...args)
    cache.set(key, result)
    return result
  }
}
```

**Answer EN:** Memoization is caching function execution results to avoid repeated calculations. On repeated call with same arguments, cached result is returned.

```javascript
const memoize = (fn) => {
  const cache = new Map()
  return (...args) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = fn(...args)
    cache.set(key, result)
    return result
  }
}
```

**Ответ Senior:**

Мемоизация — техника кэширования результатов дорогих вычислений. React.useMemo и React.useCallback — встроенная мемоизация. Лучше для чистых функций с одинаковыми входными данными.

**Реализация:**
```javascript
function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
```

### 6. Разница между `forEach` и `map`?
**Ответ:**
- **forEach**: выполняет функцию для каждого элемента, возвращает `undefined`
- **map**: возвращает новый массив с результатами преобразования

```javascript
const arr = [1, 2, 3]

// forEach - для побочных эффектов
arr.forEach(x => console.log(x)) // undefined

// map - для преобразования
const doubled = arr.map(x => x * 2) // [2, 4, 6]
```

**Answer EN:**
- **forEach**: executes function for each element, returns `undefined`
- **map**: returns new array with transformation results

```javascript
const arr = [1, 2, 3]

// forEach - for side effects
arr.forEach(x => console.log(x)) // undefined

// map - for transformation
const doubled = arr.map(x => x * 2) // [2, 4, 6]
```

**Ответ Senior:**

**Ответ Senior:**

`forEach` — для побочных эффектов (логирование, DOM-манипуляции), не изменяет исходный массив, но может изменять элементы. `map` — для трансформации, создаёт новый массив, возвращает результат. Используйте `map` для функционального стиля, `forEach` для итераций с эффектами. Не используйте `map` если результат не нужен.

---

