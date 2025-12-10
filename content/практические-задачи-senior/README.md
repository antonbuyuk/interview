## Практические задачи (Senior)

### 1. Реализовать throttle функцию?
**Ответ:** Throttle — функция, ограничивающая частоту выполнения другой функции, гарантируя её вызов не чаще определенного интервала времени. В отличие от debounce, throttle выполняет функцию периодически, а не откладывает до окончания активности. Используется для обработки событий, которые должны срабатывать регулярно, но не слишком часто (например, при скролле или ресайзе).

```javascript
function throttle(func, delay) {
  let lastCall = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      return func.apply(this, args)
    }
  }
}
```

**Answer EN:** Throttle is a function that limits frequency of another function execution, guaranteeing its call no more often than specified time interval. Unlike debounce, throttle executes function periodically, not delays until activity ends. Used for handling events that should fire regularly but not too often (e.g., on scroll or resize).

```javascript
function throttle(func, delay) {
  let lastCall = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      return func.apply(this, args)
    }
  }
}
```

**Ответ Senior:**

**Оптимизированная версия с правильным сохранением контекста и возвратом значения:**

```javascript
// С опцией leading и trailing
function throttle(func, delay, options = {}) {
  let timeoutId;
  let lastCall = 0;
  const { leading = true, trailing = true } = options;

  return function(...args) {
    const now = Date.now();

    if (!lastCall && !leading) {
      lastCall = now;
    }

    const remaining = delay - (now - lastCall);

    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      func.apply(this, args);
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        lastCall = leading ? Date.now() : 0;
        timeoutId = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}
```

### 2. Реализовать deepEqual функцию?
**Ответ:** DeepEqual — функция для глубокого сравнения двух значений, которая рекурсивно проверяет все свойства объектов и элементы массивов на равенство. Используется когда нужно сравнить сложные структуры данных, а не просто ссылки. Важно обрабатывать edge cases: null, разные типы, циклические ссылки, и специальные объекты вроде Date или RegExp.

```javascript
function deepEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false
    }
  }
  return true
}
```

**Answer EN:** DeepEqual is a function for deep comparison of two values that recursively checks all object properties and array elements for equality. Used when need to compare complex data structures, not just references. Important to handle edge cases: null, different types, circular references, and special objects like Date or RegExp.

```javascript
function deepEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false
    }
  }
  return true
}
```

**Ответ Senior:**
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
  }
  return true;
}
```

**Ответ Senior:**

**Улучшенная версия с обработкой edge cases:**

```javascript
function deepEqual(a, b, visited = new WeakMap()) {
  if (a === b) return true;

  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  // Обработка циклических ссылок
  if (visited.has(a) && visited.get(a) === b) return true;
  visited.set(a, b);

  // Обработка специальных объектов
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key], visited)) return false;
  }

  return true;
}
```

### 3. Реализовать EventEmitter?
**Ответ:** EventEmitter — паттерн для реализации событийной системы, где объекты могут подписываться на события и реагировать на них. Реализация требует хранения коллекции обработчиков событий, методов для подписки (on), отписки (off) и вызова событий (emit). Дополнительно полезны методы once для одноразовой подписки и управление приоритетами обработчиков.

```javascript
class EventEmitter {
  constructor() {
    this.events = {}
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  emit(event, ...args) {
    if (!this.events[event]) return
    this.events[event].forEach(callback => callback(...args))
  }
}
```

**Answer EN:** EventEmitter is a pattern for implementing event system where objects can subscribe to events and react to them. Implementation requires storing collection of event handlers, methods for subscription (on), unsubscription (off) and event emission (emit). Additionally useful are once method for one-time subscription and handler priority management.

```javascript
class EventEmitter {
  constructor() {
    this.events = {}
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  emit(event, ...args) {
    if (!this.events[event]) return
    this.events[event].forEach(callback => callback(...args))
  }
}
```

**Ответ Senior:**

**Расширенная версия с дополнительными методами:**

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }
}
```

### 4. Реализовать debounce с immediate опцией?
**Ответ:** Debounce с опцией immediate позволяет выполнить функцию сразу при первом вызове, а затем игнорировать последующие вызовы до окончания периода задержки. Это полезно для таких случаев, как отправка формы или выполнение поиска, где нужно получить немедленный результат при первом действии, но избежать повторных вызовов при быстрых последовательных событиях. Опция immediate меняет поведение debounce с "выполнить после паузы" на "выполнить сразу, затем игнорировать".

```javascript
function debounce(func, delay, immediate = false) {
  let timeoutId
  return function(...args) {
    const callNow = immediate && !timeoutId
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      if (!immediate) func.apply(this, args)
    }, delay)
    if (callNow) func.apply(this, args)
  }
}
```

**Answer EN:** Debounce with immediate option allows executing function immediately on first call, then ignoring subsequent calls until delay period ends. Useful for cases like form submission or search execution where need immediate result on first action but avoid repeated calls on fast sequential events. Immediate option changes debounce behavior from "execute after pause" to "execute immediately, then ignore".

```javascript
function debounce(func, delay, immediate = false) {
  let timeoutId
  return function(...args) {
    const callNow = immediate && !timeoutId
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      if (!immediate) func.apply(this, args)
    }, delay)
    if (callNow) func.apply(this, args)
  }
}
```

**Ответ Senior:**

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

**Ответ Senior:**

**Производственная версия с полным контролем:**

```javascript
function debounce(func, delay, immediate = false) {
  let timeoutId;
  let result;

  const debounced = function(...args) {
    const callNow = immediate && !timeoutId;
    const context = this;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        result = func.apply(context, args);
      }
    }, delay);

    if (callNow) {
      result = func.apply(context, args);
    }

    return result;
  };

  debounced.cancel = function() {
    clearTimeout(timeoutId);
    timeoutId = null;
  };

  return debounced;
}
```

---
