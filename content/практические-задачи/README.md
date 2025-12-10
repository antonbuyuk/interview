## Практические задачи

### 1. Реализовать debounce функцию
**Ответ:** Debounce — функция, откладывающая выполнение другой функции до тех пор, пока не пройдет определенное время без новых вызовов. Используется для оптимизации частых событий (поиск, resize, scroll), предотвращая лишние вычисления и запросы. Реализация основана на очистке предыдущего таймера при каждом новом вызове и установке нового таймера.

```javascript
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
```

**Answer EN:** Debounce is a function that delays execution of another function until a certain time passes without new calls. Used to optimize frequent events (search, resize, scroll), preventing unnecessary calculations and requests. Implementation is based on clearing previous timer on each new call and setting new timer.

```javascript
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
```

**Ответ Senior:**

**Продвинутая версия с immediate:**
```javascript
function debounce(func, delay, immediate = false) {
  let timeoutId;
  return function(...args) {
    const callNow = immediate && !timeoutId;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) func.apply(this, args);
    }, delay);
    if (callNow) func.apply(this, args);
  };
}
```

**TypeScript версия:**
```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
```

### 2. Найти уникальные значения в массиве
**Ответ:** Для получения уникальных значений массива самый простой и эффективный способ — использовать объект `Set`, который автоматически удаляет дубликаты. Альтернативный вариант через `filter` и `indexOf` работает медленнее, но полезен если нужна поддержка старых браузеров. Для объектов используйте `Map` с уникальными ключами.

```javascript
const unique = [...new Set(array)]
// или
const unique = array.filter((item, index) => array.indexOf(item) === index)
```

**Answer EN:** To get unique values from array, the simplest and most efficient way is to use `Set` object which automatically removes duplicates. Alternative via `filter` and `indexOf` works slower but useful if old browser support is needed. For objects use `Map` with unique keys.

```javascript
const unique = [...new Set(array)]
// or
const unique = array.filter((item, index) => array.indexOf(item) === index)
```

**Ответ Senior:**
// или
const unique = array.filter((item, index) => array.indexOf(item) === index);
```

**Ответ Senior:**

**Производительность:**
- `Set` — O(n), самый быстрый
- `filter + indexOf` — O(n²), медленнее
- Для объектов используйте `Map` с ключами

**С сохранением порядка:**
```javascript
const unique = Array.from(new Set(array));
```

**Для объектов:**
```javascript
const unique = Array.from(
  new Map(array.map(item => [item.id, item])).values()
);
```

### 3. Глубокое копирование объекта
**Ответ:** Глубокое копирование создает полностью независимую копию объекта со всеми вложенными структурами. Простой способ через `JSON.parse(JSON.stringify())` работает для простых объектов, но теряет функции, даты и другие не-JSON типы. Современный `structuredClone()` лучше обрабатывает большинство типов данных, но также не поддерживает функции.

```javascript
const deepCopy = JSON.parse(JSON.stringify(obj))
// или
const deepCopy = structuredClone(obj) // современный способ
```

**Answer EN:** Deep copying creates a completely independent copy of object with all nested structures. Simple way via `JSON.parse(JSON.stringify())` works for simple objects but loses functions, dates and other non-JSON types. Modern `structuredClone()` better handles most data types but also doesn't support functions.

```javascript
const deepCopy = JSON.parse(JSON.stringify(obj))
// or
const deepCopy = structuredClone(obj) // modern way
```

**Ответ Senior:**

**Ограничения:**
- `JSON.parse(JSON.stringify())` — теряет функции, Symbol, undefined, Date становится строкой
- `structuredClone()` — не копирует функции, Symbol, но лучше с датами

**Кастомная реализация:**
```javascript
function deepClone(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item, map));
  if (map.has(obj)) return map.get(obj);

  const clone = Object.create(Object.getPrototypeOf(obj));
  map.set(obj, clone);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], map);
    }
  }

  return clone;
}
```

---

