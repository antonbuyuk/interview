## JavaScript / TypeScript

### 1. Что такое замыкание (closure)?
**Ответ:** Замыкание — это функция, которая имеет доступ к переменным из внешней области видимости даже после того, как внешняя функция завершила выполнение.

```javascript
function outerFunction(x) {
  return function innerFunction(y) {
    return x + y;
  };
}
const addFive = outerFunction(5);
console.log(addFive(3)); // 8
```

**Answer EN:** A closure is a function that has access to variables from its outer (enclosing) scope even after the outer function has finished executing.

```javascript
function outerFunction(x) {
  return function innerFunction(y) {
    return x + y;
  };
}
const addFive = outerFunction(5);
console.log(addFive(3)); // 8
```

**Ответ Senior:**

Замыкание — это фундаментальная концепция JavaScript, где внутренняя функция сохраняет ссылку на лексическое окружение (Lexical Environment) внешней функции даже после её завершения. Это позволяет создавать мощные паттерны программирования.

**Как работает замыкание на уровне движка:**

1. При создании функции создаётся её лексическое окружение (Lexical Environment)
2. Лексическое окружение содержит ссылку на внешнее окружение (outer reference)
3. При вызове функции создаётся новый контекст выполнения (Execution Context)
4. Внутренняя функция "запечатывает" (capture) переменные из внешнего окружения

```javascript
// Замыкание сохраняет переменные по ссылке, а не по значению
function createCounters() {
  const counters = [];

  for (var i = 0; i < 3; i++) {
    // Проблема: var имеет функциональную область видимости
    // Все функции будут ссылаться на одно и то же i
    counters.push(function() {
      return i; // Все вернут 3
    });
  }

  return counters;
}

const counters1 = createCounters();
console.log(counters1[0]()); // 3 (ожидали 0)
console.log(counters1[1]()); // 3 (ожидали 1)
console.log(counters1[2]()); // 3 (ожидали 2)

// Решение 1: Использовать let (блочная область видимости)
function createCountersFixed1() {
  const counters = [];

  for (let i = 0; i < 3; i++) {
    // let создаёт новое окружение для каждой итерации
    counters.push(function() {
      return i; // Каждая функция замыкается на своё i
    });
  }

  return counters;
}

// Решение 2: IIFE (Immediately Invoked Function Expression)
function createCountersFixed2() {
  const counters = [];

  for (var i = 0; i < 3; i++) {
    counters.push((function(j) {
      return function() {
        return j; // Замыкается на параметр j
      };
    })(i));
  }

  return counters;
}

// Решение 3: bind
function createCountersFixed3() {
  const counters = [];

  function counter(index) {
    return index;
  }

  for (var i = 0; i < 3; i++) {
    counters.push(counter.bind(null, i));
  }

  return counters;
}
```

**Практические применения замыканий:**

**1. Модульный паттерн (Module Pattern):**
```javascript
const UserModule = (function() {
  // Приватные переменные
  let users = [];
  let nextId = 1;

  // Приватные методы
  function validateUser(user) {
    return user.name && user.email;
  }

  // Публичный API
  return {
    add(user) {
      if (validateUser(user)) {
        user.id = nextId++;
        users.push(user);
        return user;
      }
      throw new Error('Invalid user');
    },

    get(id) {
      return users.find(u => u.id === id);
    },

    getAll() {
      return [...users]; // Возвращаем копию
    },

    remove(id) {
      users = users.filter(u => u.id !== id);
    }
  };
})();

// Приватные переменные недоступны извне
// users и validateUser инкапсулированы
```

**2. Мемоизация и кэширование:**
```javascript
function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log('Cache hit');
      return cache.get(key);
    }

    console.log('Cache miss');
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveOperation = memoize((n) => {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += i;
  }
  return sum;
});

expensiveOperation(1000000); // Cache miss
expensiveOperation(1000000); // Cache hit (быстрее)
```

**3. Каррирование и частичное применение:**
```javascript
// Каррирование
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function(...nextArgs) {
        return curried.apply(this, args.concat(nextArgs));
      };
    }
  };
}

const add = curry((a, b, c) => a + b + c);
const add5 = add(5);
const add5and3 = add5(3);
console.log(add5and3(2)); // 10

// Частичное применение для API запросов
function createApiClient(baseURL) {
  return function(endpoint) {
    return function(method) {
      return function(data) {
        return fetch(`${baseURL}${endpoint}`, {
          method,
          body: JSON.stringify(data)
        });
      };
    };
  };
}

const api = createApiClient('https://api.example.com');
const usersEndpoint = api('/users');
const getUsers = usersEndpoint('GET');
const createUser = usersEndpoint('POST');
```

**4. Event handlers и колбэки:**
```javascript
function createButtonHandler(buttonId, clickCount) {
  let count = clickCount || 0;

  return function(event) {
    count++;
    console.log(`Button ${buttonId} clicked ${count} times`);
    // Доступ к count сохраняется между вызовами
  };
}

const handler = createButtonHandler('submit-btn', 0);
document.querySelector('#submit-btn').addEventListener('click', handler);

// Каждая кнопка имеет свой счётчик
const handler2 = createButtonHandler('cancel-btn', 10);
```

**5. Управление состоянием в функциональном стиле:**
```javascript
function createState(initialState) {
  let state = initialState;
  const listeners = [];

  return {
    getState() {
      return state;
    },

    setState(newState) {
      const prevState = state;
      state = typeof newState === 'function' ? newState(state) : newState;

      // Уведомляем всех слушателей
      listeners.forEach(listener => {
        listener(state, prevState);
      });
    },

    subscribe(listener) {
      listeners.push(listener);

      // Возвращаем функцию отписки
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    }
  };
}

const store = createState({ count: 0 });
const unsubscribe = store.subscribe((state) => {
  console.log('State changed:', state);
});

store.setState({ count: 1 }); // State changed: { count: 1 }
store.setState(prev => ({ count: prev.count + 1 })); // State changed: { count: 2 }
unsubscribe();
```

**Потенциальные проблемы:**

**1. Утечки памяти:**
```javascript
// Плохо: большой объект остаётся в памяти
function createHandler() {
  const largeData = new Array(1000000).fill('data');

  return function() {
    console.log('Handler called');
    // largeData остаётся в памяти, даже если не используется
  };
}

// Хорошо: освобождаем ссылки
function createHandlerOptimized() {
  let largeData = new Array(1000000).fill('data');

  return function() {
    console.log('Handler called');
    // После использования очищаем
    largeData = null;
  };
}
```

**2. Непредсказуемое поведение в циклах:**
```javascript
// Классическая ошибка
const functions = [];
for (var i = 0; i < 3; i++) {
  functions.push(() => console.log(i));
}
functions.forEach(fn => fn()); // 3, 3, 3

// Решение: let или IIFE
for (let i = 0; i < 3; i++) {
  functions.push(() => console.log(i)); // 0, 1, 2
}
```

**3. Изменение замыкаемых переменных:**
```javascript
function createCounter() {
  let count = 0;

  return {
    increment() {
      count++; // Изменяет переменную в замыкании
      return count;
    },
    getCount() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
// count недоступна напрямую, но изменяется через методы
```

**Замыкания в современном JavaScript:**

```javascript
// React hooks (концептуально)
function useState(initialValue) {
  let state = initialValue;

  const setState = (newValue) => {
    state = typeof newValue === 'function' ? newValue(state) : newValue;
    // Триггер ре-рендера компонента
    rerender();
  };

  return [state, setState];
}

// Vue 3 Composition API (концептуально)
function useCounter(initial = 0) {
  const count = ref(initial);

  const increment = () => {
    count.value++;
  };

  return { count, increment };
}
```

**Best Practices:**

1. ✅ Используйте замыкания для инкапсуляции и создания приватных переменных
2. ✅ Очищайте ссылки на большие объекты после использования
3. ✅ Избегайте замыканий в циклах с `var` (используйте `let`/`const`)
4. ✅ Документируйте, какие переменные замыкаются
5. ✅ Используйте замыкания для создания фабрик функций и модулей
6. ❌ Не создавайте замыкания без необходимости (производительность)
7. ❌ Не храните большие объекты в замыканиях, если они не нужны

### 2. Разница между `let`, `const` и `var`?
**Ответ:**
- **var**: функциональная область видимости, поднимается (hoisting), можно переопределять
- **let**: блочная область видимости, можно переназначать, не поднимается
- **const**: блочная область видимости, нельзя переназначать, но можно изменять содержимое объектов/массивов

```javascript
// var - функциональная область видимости
function testVar() {
  if (true) {
    var x = 10;
  }
  console.log(x); // 10 (доступно вне блока)
}

// let/const - блочная область видимости
function testLet() {
  if (true) {
    let y = 20;
    const z = 30;
  }
  console.log(y); // ReferenceError: y is not defined
}
```

**Answer EN:**
- **var**: function scope, hoisted, can be redeclared
- **let**: block scope, can be reassigned, not hoisted
- **const**: block scope, cannot be reassigned, but can modify object/array contents

```javascript
// var - function scope
function testVar() {
  if (true) {
    var x = 10;
  }
  console.log(x); // 10 (accessible outside block)
}

// let/const - block scope
function testLet() {
  if (true) {
    let y = 20;
    const z = 30;
  }
  console.log(y); // ReferenceError: y is not defined
}
```

**Ответ Senior:**

Различия между `var`, `let` и `const` критичны для понимания современного JavaScript. Они влияют на область видимости, hoisting, повторное объявление и поведение в циклах.

**Детальное сравнение:**

**1. Область видимости (Scope):**

```javascript
// var - функциональная область видимости
function testVar() {
  if (true) {
    var x = 10;
  }
  console.log(x); // 10 (доступно вне блока)
}

// let/const - блочная область видимости
function testLet() {
  if (true) {
    let y = 20;
    const z = 30;
  }
  console.log(y); // ReferenceError: y is not defined
  console.log(z); // ReferenceError: z is not defined
}
```

**2. Hoisting (Поднятие):**

```javascript
// var поднимается и инициализируется как undefined
console.log(a); // undefined (не ошибка)
var a = 5;

// Эквивалентно:
var a;
console.log(a); // undefined
a = 5;

// let/const поднимаются, но в "временной мёртвой зоне" (TDZ)
console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 10;

console.log(c); // ReferenceError: Cannot access 'c' before initialization
const c = 15;
```

**3. Повторное объявление:**

```javascript
// var можно переобъявлять
var x = 1;
var x = 2; // OK
console.log(x); // 2

// let нельзя переобъявлять в той же области видимости
let y = 1;
let y = 2; // SyntaxError: Identifier 'y' has already been declared

// Но можно в разных блоках
{
  let y = 3; // OK, другая область видимости
}

// const тоже нельзя переобъявлять
const z = 1;
const z = 2; // SyntaxError
```

**4. Поведение в циклах:**

```javascript
// Проблема с var в циклах
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // 3, 3, 3 (все ссылаются на одно и то же i)
  }, 100);
}

// Решение с let
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // 0, 1, 2 (каждый раз новое i)
  }, 100);
}

// Для const в цикле for...of
const arr = [1, 2, 3];
for (const item of arr) {
  console.log(item); // 1, 2, 3 (const OK, так как новое значение на каждой итерации)
}
```

**5. Изменяемость const:**

```javascript
// const не делает объект неизменяемым
const obj = { name: 'John' };
obj.name = 'Jane'; // OK - изменяем свойство
obj.age = 30; // OK - добавляем свойство
// obj = {}; // TypeError: Assignment to constant variable

const arr = [1, 2, 3];
arr.push(4); // OK - изменяем массив
arr[0] = 10; // OK
// arr = []; // TypeError

// Для неизменяемости нужен Object.freeze() или Immutable.js
const frozen = Object.freeze({ name: 'John' });
frozen.name = 'Jane'; // Тихий отказ (в строгом режиме - ошибка)
```

**Практические рекомендации:**

1. **Всегда используйте `const` по умолчанию** — изменяйте на `let` только при необходимости переназначения
2. **Никогда не используйте `var`** — используйте `let`/`const`
3. **`const` для примитивов** — строк, чисел, булевых
4. **`const` для ссылок** — объекты и массивы можно изменять, но нельзя переназначать

```javascript
// ✅ Хорошая практика
const API_URL = 'https://api.example.com';
const users = [];

function processUser(userId) {
  const user = fetchUser(userId);
  let processedData = transformUser(user);

  if (needsValidation(processedData)) {
    processedData = validateUser(processedData);
  }

  users.push(processedData);
  return processedData;
}

// ❌ Плохая практика
var apiUrl = 'https://api.example.com';
var users = [];

function processUser(userId) {
  var user = fetchUser(userId);
  var processedData = transformUser(user);

  if (needsValidation(processedData)) {
    var processedData = validateUser(processedData); // Переобъявление
  }

  users.push(processedData);
  return processedData;
}
```

**Временная мёртвая зона (Temporal Dead Zone):**

```javascript
// TDZ для let/const начинается с начала блока до объявления
function tdzExample() {
  // TDZ для 'value' начинается здесь
  console.log(typeof value); // ReferenceError

  let value = 42;
  // TDZ заканчивается здесь
}

// Интересный случай
console.log(typeof undeclaredVar); // 'undefined' (не ReferenceError)
console.log(typeof letVar); // ReferenceError (TDZ)
let letVar;
```

**Итого:**
- Используйте `const` для всех переменных, которые не будут переназначаться
- Используйте `let` когда переменная будет переназначена
- Никогда не используйте `var` в современном коде
- Понимайте TDZ и как она влияет на hoisting

### 3. Что такое Promise и async/await?
**Ответ:** Promise — объект, представляющий результат асинхронной операции (pending, fulfilled, rejected). async/await — синтаксический сахар для работы с Promise, делает асинхронный код похожим на синхронный.

```javascript
// Создание Promise
const fetchData = new Promise((resolve, reject) => {
  setTimeout(() => {
    const data = { id: 1, name: 'John' };
    resolve(data);
  }, 1000);
});

// Обработка Promise
fetchData
  .then(data => console.log('Данные:', data))
  .catch(error => console.error('Ошибка:', error));

// async/await
async function loadData() {
  try {
    const data = await fetchData;
    console.log('Данные:', data);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}
```

**Answer EN:** Promise is an object representing the result of an asynchronous operation (pending, fulfilled, rejected). async/await is syntactic sugar for working with Promises, making asynchronous code look like synchronous code.

```javascript
// Creating Promise
const fetchData = new Promise((resolve, reject) => {
  setTimeout(() => {
    const data = { id: 1, name: 'John' };
    resolve(data);
  }, 1000);
});

// Handling Promise
fetchData
  .then(data => console.log('Data:', data))
  .catch(error => console.error('Error:', error));

// async/await
async function loadData() {
  try {
    const data = await fetchData;
    console.log('Data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

**Ответ Senior:**

**Promise** — объект, представляющий результат асинхронной операции (pending, fulfilled, rejected).

**Состояния Promise:**
- **pending** — начальное состояние, операция выполняется
- **fulfilled** — операция успешно завершена
- **rejected** — операция завершилась с ошибкой

**async/await** — синтаксический сахар для работы с Promise, делает асинхронный код похожим на синхронный.

**Примеры использования Promise:**
```javascript
// Создание Promise
const fetchData = new Promise((resolve, reject) => {
  setTimeout(() => {
    const data = { id: 1, name: 'John' };
    resolve(data); // успешное выполнение
    // или reject(new Error('Ошибка')); // ошибка
  }, 1000);
});

// Обработка Promise
fetchData
  .then(data => {
    console.log('Данные получены:', data);
    return data.id;
  })
  .then(id => console.log('ID:', id))
  .catch(error => console.error('Ошибка:', error))
  .finally(() => console.log('Запрос завершен'));

// Promise.all - ожидание всех промисов
const promises = [fetchUser(), fetchPosts(), fetchComments()];
Promise.all(promises)
  .then(([user, posts, comments]) => {
    console.log('Все данные загружены');
  })
  .catch(error => console.error('Один из запросов failed'));

// Promise.race - первый выполненный промис
Promise.race([fetchFromCache(), fetchFromAPI()])
  .then(data => console.log('Быстрее всего:', data));

// Promise.allSettled - все промиссы завершены (успех или ошибка)
Promise.allSettled(promises)
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Промис ${index} успешен:`, result.value);
      } else {
        console.log(`Промис ${index} failed:`, result.reason);
      }
    });
  });
```

**Примеры async/await:**
```javascript
// Базовое использование
async function getUserData() {
  try {
    const user = await fetchUser();
    const posts = await fetchPosts(user.id);
    const comments = await fetchComments(posts[0].id);
    return { user, posts, comments };
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    throw error;
  }
}

// Параллельное выполнение
async function loadAllData() {
  // Все запросы выполняются параллельно
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ]);
  return { user, posts, comments };
}

// Обработка ошибок
async function safeFetch(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ошибка запроса:', error);
    return null; // возвращаем значение по умолчанию
  }
}
```

**Для чего и где использовать:**

**Promise лучше использовать:**
- При работе с асинхронными операциями (API запросы, чтение файлов, таймеры)
- Когда нужно обработать несколько асинхронных операций параллельно (`Promise.all`)
- Когда нужен первый результат из нескольких источников (`Promise.race`)
- Для избежания "callback hell" (вложенных колбэков)
- При работе с библиотеками, возвращающими Promise

**async/await лучше использовать:**
- Когда нужна последовательная обработка асинхронных операций
- Для более читаемого и понятного кода (похож на синхронный)
- Когда нужна простая обработка ошибок через try/catch
- В функциях, где требуется синхронный стиль написания

**Когда НЕ использовать:**
- В циклах без await (нужно использовать `Promise.all` для параллельного выполнения)
- В конструкторах классов (нельзя использовать await)
- В глобальной области видимости (нужно обернуть в async функцию)

**Ответ Senior:**

**Promise и async/await — глубокое понимание:**

**Внутреннее устройство Promise:**

```javascript
// Собственная реализация Promise (упрощенная)
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        this.onFulfilledCallbacks.forEach(cb => cb(value));
      }
    };

    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
        this.onRejectedCallbacks.forEach(cb => cb(reason));
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handleFulfilled = (value) => {
        try {
          const result = onFulfilled ? onFulfilled(value) : value;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      const handleRejected = (reason) => {
        try {
          const result = onRejected ? onRejected(reason) : reason;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      if (this.state === 'fulfilled') {
        setTimeout(() => handleFulfilled(this.value), 0);
      } else if (this.state === 'rejected') {
        setTimeout(() => handleRejected(this.reason), 0);
      } else {
        this.onFulfilledCallbacks.push(handleFulfilled);
        this.onRejectedCallbacks.push(handleRejected);
      }
    });
  }
}
```

**Promise.all vs Promise.allSettled vs Promise.any:**

```javascript
// Promise.all - ждёт все, падает при первой ошибке
Promise.all([p1, p2, p3])
  .then(results => console.log('Все успешны:', results))
  .catch(error => console.log('Один упал:', error)); // Останавливается на первой ошибке

// Promise.allSettled - ждёт все, не падает при ошибках
Promise.allSettled([p1, p2, p3])
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Promise ${index} успешен:`, result.value);
      } else {
        console.log(`Promise ${index} failed:`, result.reason);
      }
    });
  });

// Promise.any - первый успешный (ES2021)
Promise.any([p1, p2, p3])
  .then(firstSuccess => console.log('Первый успешный:', firstSuccess))
  .catch(errors => console.log('Все упали:', errors)); // AggregatorError

// Promise.race - первый завершившийся (любой исход)
Promise.race([p1, p2, p3])
  .then(result => console.log('Первый завершился:', result));
```

**Обработка ошибок в async/await:**

```javascript
// ❌ Плохо: теряем ошибки
async function badExample() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.log(error); // Только логируем
    // Ошибка не пробрасывается дальше
  }
}

// ✅ Хорошо: пробрасываем ошибки
async function goodExample() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.error('Ошибка:', error);
    throw error; // Пробрасываем дальше
  }
}

// ✅ Альтернатива: не перехватываем
async function betterExample() {
  const data = await fetchData(); // Ошибка автоматически пробрасывается
  return data;
}
```

**Последовательное vs параллельное выполнение:**

```javascript
// ❌ Последовательно (медленно)
async function slow() {
  const user = await fetchUser(); // ждём
  const posts = await fetchPosts(user.id); // ждём
  const comments = await fetchComments(posts[0].id); // ждём
  return { user, posts, comments }; // Время: sum
}

// ✅ Параллельно (быстро)
async function fast() {
  const user = await fetchUser();
  const [posts, comments] = await Promise.all([
    fetchPosts(user.id),
    fetchComments(user.id) // если можем
  ]);
  return { user, posts, comments }; // Время: max
}

// ✅ Ещё быстрее: независимые запросы
async function fastest() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ]);
  return { user, posts, comments };
}
```

**Таймауты и отмена:**

```javascript
// Promise с таймаутом
function fetchWithTimeout(url, timeout = 5000) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}

// Отмена через AbortController
async function fetchWithAbort(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Запрос отменён');
    }
    throw error;
  }
}
```

**Ретри и экспоненциальный backoff:**

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Экспоненциальный backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Async генераторы:**

```javascript
async function* fetchPages(url) {
  let page = 1;
  while (true) {
    const response = await fetch(`${url}?page=${page}`);
    const data = await response.json();

    if (data.length === 0) break;

    yield data;
    page++;
  }
}

// Использование
for await (const page of fetchPages('/api/posts')) {
  console.log('Получена страница:', page);
}
```

### 4. Разница между `==` и `===`?
**Ответ:**
- `==` — нестрогое сравнение (с приведением типов)
- `===` — строгое сравнение (без приведения типов)

```javascript
// == - нестрогое сравнение
'5' == 5; // true (приведение типов)
null == undefined; // true

// === - строгое сравнение
'5' === 5; // false (разные типы)
null === undefined; // false
```

**Answer EN:**
- `==` — loose equality (with type coercion)
- `===` — strict equality (without type coercion)

```javascript
// == - loose equality
'5' == 5; // true (type coercion)
null == undefined; // true

// === - strict equality
'5' === 5; // false (different types)
null === undefined; // false
```

**Ответ Senior:**

**Алгоритм абстрактного равенства (`==`):**

`==` использует сложный алгоритм приведения типов, который может привести к неожиданным результатам:

```javascript
// Приведение к числу
'5' == 5; // true (строка приводится к числу)
true == 1; // true (true -> 1)
false == 0; // true (false -> 0)
null == undefined; // true (специальное правило)

// Проблемные случаи
[] == 0; // true ([] -> '' -> 0)
[] == false; // true
[1, 2] == '1,2'; // true
'' == 0; // true
'  ' == 0; // true (пробелы приводятся к 0)

// Object к примитиву
const obj = {
  valueOf: () => 42,
  toString: () => 'hello'
};
obj == 42; // true (valueOf вызывается первым)
obj == 'hello'; // false
```

**Правило приведения типов для `==`:**

1. Если типы одинаковы → использует `===`
2. Если один `null`, другой `undefined` → `true`
3. Если один строка, другой число → строка → число
4. Если один булево → булево → число
5. Если один объект → `ToPrimitive` (valueOf/toString)
6. Остальное → `false`

**Всегда используйте `===`:**

```javascript
// ✅ Правильно
if (value === null) { }
if (value === undefined) { }
if (value === 0) { }
if (value === '') { }

// ❌ Проблематично
if (value == null) { } // Проверяет и null, и undefined
if (value == 0) { } // Может быть неожиданным
```

**Object.is() — строжайшее сравнение:**

```javascript
// === не различает +0 и -0
+0 === -0; // true
Object.is(+0, -0); // false

// === считает NaN !== NaN
NaN === NaN; // false
Object.is(NaN, NaN); // true

// Используйте Object.is для особых случаев
Object.is(value1, value2); // Самый строгий способ сравнения
```

### 5. Что такое булевы операторы?
**Ответ:** Булевы операторы используются для выполнения логических операций и сравнений.

**Логические операторы:**
- `&&` (И) — возвращает первое falsy значение или последнее значение, если все truthy
- `||` (ИЛИ) — возвращает первое truthy значение или последнее значение, если все falsy
- `!` (НЕ) — инвертирует булево значение

```javascript
// && - логическое И
const result1 = true && false; // false
const result2 = 'hello' && 'world'; // 'world' (последнее truthy)

// || - логическое ИЛИ
const result3 = true || false; // true
const result4 = '' || 'default'; // 'default' (первое truthy)

// ! - логическое НЕ
const result5 = !true; // false
const result6 = !0; // true
```

**Answer EN:** Boolean operators are used for logical operations and comparisons.

**Logical operators:**
- `&&` (AND) — returns first falsy value or last value if all truthy
- `||` (OR) — returns first truthy value or last value if all falsy
- `!` (NOT) — inverts boolean value

```javascript
// && - logical AND
const result1 = true && false; // false
const result2 = 'hello' && 'world'; // 'world' (last truthy)

// || - logical OR
const result3 = true || false; // true
const result4 = '' || 'default'; // 'default' (first truthy)

// ! - logical NOT
const result5 = !true; // false
const result6 = !0; // true
```

**Ответ Senior:**
- `||` (ИЛИ) — возвращает первое truthy значение или последнее значение, если все falsy
- `!` (НЕ) — инвертирует булево значение
- `??` (Nullish coalescing) — возвращает правый операнд, если левый `null` или `undefined`

**Операторы сравнения:**
- `>` — больше
- `<` — меньше
- `>=` — больше или равно
- `<=` — меньше или равно
- `==` — равно (с приведением типов)
- `===` — строго равно (без приведения типов)
- `!=` — не равно (с приведением типов)
- `!==` — строго не равно (без приведения типов)

**Truthy и Falsy значения:**
- **Falsy**: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`
- **Truthy**: все остальные значения (включая `[]`, `{}`, `"0"`)

**Короткое замыкание (Short-circuit evaluation):**
```javascript
// && останавливается на первом falsy
const result = user && user.name; // вернет undefined, если user falsy

// || останавливается на первом truthy
const name = user.name || 'Guest'; // вернет 'Guest', если user.name falsy

// ?? работает только с null/undefined
const value = data ?? 'default'; // вернет 'default' только если data null/undefined
```

**Приоритет операторов (от высшего к низшему):**
1. Группировка: `()`
2. Унарные: `!`, `typeof`, `void`, `delete`, `+`, `-`, `++`, `--`
3. Мультипликативные: `*`, `/`, `%`
4. Аддитивные: `+`, `-`
5. Реляционные: `<`, `<=`, `>`, `>=`, `in`, `instanceof`
6. Равенство: `==`, `!=`, `===`, `!==`
7. Логическое И: `&&`
8. Логическое ИЛИ: `||`
9. Nullish coalescing: `??`
10. Условный (тернарный): `? :`
11. Присваивание: `=`, `+=`, `-=`, и т.д.

**Важные моменты:**
- `&&` имеет более высокий приоритет, чем `||`
- `??` имеет более низкий приоритет, чем `&&` и `||`, но выше чем `? :`
- Используйте скобки `()` для явного указания порядка выполнения

```javascript
// && выполняется раньше ||
const result1 = true || false && false; // true (сначала &&, потом ||)
const result2 = (true || false) && false; // false (сначала ||, потом &&)

// ?? имеет низкий приоритет
const value = null ?? 'default' || 'fallback'; // 'default' (сначала ||, потом ??)
const value2 = (null ?? 'default') || 'fallback'; // 'default' (сначала ??, потом ||)
```

**Ответ Senior:**

**Логические операторы как условные операторы:**

`&&` и `||` возвращают значения, а не булевы значения. Это используется для условного выполнения:

```javascript
// && - условное выполнение
user && user.isActive && doSomething(); // Выполнится только если оба truthy

// || - значения по умолчанию
const name = user.name || 'Anonymous'; // Но проблематично если name = ''

// ?? - правильная альтернатива
const name = user.name ?? 'Anonymous'; // Сработает только для null/undefined
```

**Проблемы с `||` и `??`:**

```javascript
// || не различает пустую строку и отсутствие значения
const config = {
  theme: '',
  language: null
};

const theme = config.theme || 'dark'; // 'dark' (неправильно, была пустая строка!)
const theme2 = config.theme ?? 'dark'; // '' (правильно)

// ?? идеально для опциональных полей
function greet(name) {
  const displayName = name ?? 'Guest';
  return `Hello, ${displayName}`;
}

greet(null); // 'Hello, Guest'
greet(''); // 'Hello, ' (пустая строка)
greet(undefined); // 'Hello, Guest'
```

**Опциональная цепочка с логическими операторами:**

```javascript
// Безопасный доступ к вложенным свойствам
const value = obj?.prop?.subProp?.value ?? 'default';

// Эквивалентно:
const value = obj && obj.prop && obj.prop.subProp && obj.prop.subProp.value || 'default';
// Но ?? лучше для null/undefined
```

**Использование для присваивания:**

```javascript
// || для значений по умолчанию
const options = {
  timeout: config.timeout || 5000,
  retries: config.retries || 3
};

// ?? для null/undefined
const options2 = {
  timeout: config.timeout ?? 5000, // Если config.timeout === 0, останется 0
  retries: config.retries ?? 3
};
```

### 6. Что такое деструктуризация?
**Ответ:** Деструктуризация — извлечение значений из массивов или объектов в отдельные переменные.

```javascript
// Деструктуризация объекта
const { name, age } = user;
const { name: userName, age: userAge } = user; // с переименованием

// Деструктуризация массива
const [first, second] = array;
const [first, , third] = array; // пропуск элементов
```

**Answer EN:** Destructuring is extracting values from arrays or objects into separate variables.

```javascript
// Object destructuring
const { name, age } = user;
const { name: userName, age: userAge } = user; // with renaming

// Array destructuring
const [first, second] = array;
const [first, , third] = array; // skipping elements
```

**Ответ Senior:**

**Продвинутая деструктуризация:**

```javascript
// Значения по умолчанию
const { name = 'Anonymous', age = 0 } = user;

// Переименование
const { name: userName, age: userAge } = user;

// Вложенная деструктуризация
const { address: { city, street } } = user;

// Остаток (rest)
const { name, ...rest } = user;
const [first, ...others] = array;

// Деструктуризация в параметрах функции
function greet({ name, age = 0 }) {
  return `Hello, ${name}, age ${age}`;
}

// Пропуск элементов массива
const [, , third] = array;

// Обмен переменных
let a = 1, b = 2;
[a, b] = [b, a];
```

**Практическое применение:**

```javascript
// Деструктуризация из возвращаемых значений
const [error, data] = await fetchData();
if (error) return;

// Деструктуризация в циклах
for (const { id, name } of users) {
  console.log(`${id}: ${name}`);
}

// Комплексная деструктуризация
const {
  user: {
    profile: { firstName, lastName },
    settings: { theme = 'dark' }
  },
  metadata
} = apiResponse;
```

### 7. Разница между `map`, `filter`, `reduce`?
**Ответ:**
- **map**: преобразует каждый элемент массива
- **filter**: возвращает новый массив с элементами, прошедшими проверку
- **reduce**: сводит массив к одному значению

```javascript
const numbers = [1, 2, 3, 4, 5];

// map - преобразование
const doubled = numbers.map(n => n * 2); // [2, 4, 6, 8, 10]

// filter - фильтрация
const evens = numbers.filter(n => n % 2 === 0); // [2, 4]

// reduce - сводит к одному значению
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15
```

**Answer EN:**
- **map**: transforms each array element
- **filter**: returns new array with elements passing the test
- **reduce**: reduces array to a single value

```javascript
const numbers = [1, 2, 3, 4, 5];

// map - transformation
const doubled = numbers.map(n => n * 2); // [2, 4, 6, 8, 10]

// filter - filtering
const evens = numbers.filter(n => n % 2 === 0); // [2, 4]

// reduce - reducing to single value
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15
```

**Ответ Senior:**

**Детали работы методов:**

```javascript
// map - трансформация каждого элемента
[1, 2, 3].map(x => x * 2); // [2, 4, 6]
// Всегда возвращает массив той же длины

// filter - фильтрация
[1, 2, 3, 4].filter(x => x % 2 === 0); // [2, 4]
// Может вернуть массив меньшей длины

// reduce - свёртка
[1, 2, 3].reduce((acc, x) => acc + x, 0); // 6
// Может вернуть любое значение
```

**Композиция методов:**

```javascript
// Цепочка методов
users
  .filter(u => u.active)
  .map(u => ({ name: u.name, email: u.email }))
  .reduce((acc, u) => {
    acc[u.email] = u.name;
    return acc;
  }, {});

// Производительность: создаются промежуточные массивы
// Для больших данных лучше один reduce
users.reduce((acc, u) => {
  if (u.active) {
    acc[u.email] = u.name;
  }
  return acc;
}, {});
```

**Продвинутые примеры:**

```javascript
// reduce для группировки
const grouped = items.reduce((acc, item) => {
  const key = item.category;
  if (!acc[key]) acc[key] = [];
  acc[key].push(item);
  return acc;
}, {});

// reduce для создания объектов
const indexed = array.reduce((acc, item, index) => {
  acc[item.id] = { ...item, index };
  return acc;
}, {});
```

### 8. Что такое hoisting?
**Ответ:** Hoisting — поднятие объявлений переменных и функций в начало области видимости перед выполнением кода.

```javascript
// Функции поднимаются полностью
console.log(foo()); // 'bar' (работает!)

function foo() {
  return 'bar';
}

// var поднимается, но инициализируется как undefined
console.log(x); // undefined
var x = 5;

// let/const поднимаются, но в TDZ
console.log(y); // ReferenceError
let y = 10;
```

**Answer EN:** Hoisting is the behavior of moving variable and function declarations to the top of their scope before code execution.

```javascript
// Functions are hoisted completely
console.log(foo()); // 'bar' (works!)

function foo() {
  return 'bar';
}

// var is hoisted but initialized as undefined
console.log(x); // undefined
var x = 5;

// let/const are hoisted but in TDZ
console.log(y); // ReferenceError
let y = 10;
```

**Ответ Senior:**

**Как работает hoisting:**

```javascript
// Функции поднимаются полностью
console.log(foo()); // 'bar' (работает!)
function foo() {
  return 'bar';
}

// var поднимается, но не инициализируется
console.log(x); // undefined
var x = 5;

// let/const поднимаются, но в TDZ
console.log(y); // ReferenceError
let y = 10;

// Function expressions не поднимаются
console.log(baz); // undefined
var baz = function() { return 'baz'; };
```

**Порядок hoisting:**

1. Function declarations
2. var declarations
3. let/const (в TDZ до объявления)

**Практические последствия:**

```javascript
// var в цикле
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 3, 3, 3
}

// let в цикле (новая переменная на каждой итерации)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 0, 1, 2
}
```

### 9. Типы данных в JavaScript?
**Ответ:** В JavaScript есть примитивы и объекты. Примитивы: `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`. Объекты: `object`, `array`, `function`, `date`, и т.д.

```javascript
// Примитивы передаются по значению
let a = 5;
let b = a;
b = 10;
console.log(a); // 5 (не изменилось)

// Объекты передаются по ссылке
let obj1 = { name: 'John' };
let obj2 = obj1;
obj2.name = 'Jane';
console.log(obj1.name); // 'Jane' (изменилось)
```

**Answer EN:** JavaScript has primitives and objects. Primitives: `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`. Objects: `object`, `array`, `function`, `date`, etc.

```javascript
// Primitives are passed by value
let a = 5;
let b = a;
b = 10;
console.log(a); // 5 (unchanged)

// Objects are passed by reference
let obj1 = { name: 'John' };
let obj2 = obj1;
obj2.name = 'Jane';
console.log(obj1.name); // 'Jane' (changed)
```

**Ответ Senior:**

**Примитивы vs Объекты:**

```javascript
// Примитивы передаются по значению
let a = 5;
let b = a;
b = 10;
console.log(a); // 5 (не изменилось)

// Объекты передаются по ссылке
let obj1 = { x: 5 };
let obj2 = obj1;
obj2.x = 10;
console.log(obj1.x); // 10 (изменилось)
```

**Особенности типов:**

```javascript
// typeof не всегда точен
typeof null; // 'object' (баг JS)
typeof []; // 'object'
typeof function() {}; // 'function'

// Правильные проверки
Array.isArray([]); // true
obj === null; // проверка на null
```

**Symbol и BigInt:**

```javascript
// Symbol - уникальные идентификаторы
const sym1 = Symbol('id');
const sym2 = Symbol('id');
sym1 === sym2; // false (уникальны)

// BigInt - для больших чисел
const big = 9007199254740991n;
typeof big; // 'bigint'
```

### 10. Что такое Event Loop?
**Ответ:** Event Loop — механизм, который управляет выполнением асинхронного кода в JavaScript. JavaScript однопоточный, но Event Loop позволяет выполнять неблокирующие операции.

**Как работает:**
1. **Call Stack** — стек вызовов синхронного кода
2. **Web APIs** — браузерные API (setTimeout, fetch, DOM события)
3. **Callback Queue** — очередь колбэков
4. **Event Loop** — переносит колбэки из очереди в стек, когда стек пуст

```javascript
console.log('1')
setTimeout(() => console.log('2'), 0)
console.log('3')
// Вывод: 1, 3, 2
```

**Answer EN:** Event Loop is a mechanism that manages execution of asynchronous code in JavaScript. JavaScript is single-threaded, but Event Loop allows non-blocking operations.

**How it works:**
1. **Call Stack** — stack of synchronous code calls
2. **Web APIs** — browser APIs (setTimeout, fetch, DOM events)
3. **Callback Queue** — queue of callbacks
4. **Event Loop** — moves callbacks from queue to stack when stack is empty

```javascript
console.log('1')
setTimeout(() => console.log('2'), 0)
console.log('3')
// Output: 1, 3, 2
```

**Ответ Senior:**
1. **Call Stack** — стек вызовов синхронного кода
2. **Web APIs** — браузерные API (setTimeout, fetch, DOM события)
3. **Callback Queue** — очередь колбэков (макрозадачи)
4. **Microtask Queue** — очередь микрозадач (Promise.then, queueMicrotask)

**Приоритет выполнения:**
- Сначала выполняется весь синхронный код из Call Stack
- Затем все микрозадачи из Microtask Queue
- Затем одна макрозадача из Callback Queue
- Процесс повторяется

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');
// Вывод: 1, 4, 3, 2
```

**Типы очередей:**
- **Макрозадачи**: setTimeout, setInterval, события DOM, I/O операции
- **Микрозадачи**: Promise.then/catch/finally, queueMicrotask, MutationObserver

**Ответ Senior:**

**Детальная работа Event Loop:**

```javascript
// Приоритет выполнения
console.log('1');

setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
queueMicrotask(() => console.log('4'));
setTimeout(() => console.log('5'), 0);

console.log('6');
// Вывод: 1, 6, 3, 4, 2, 5
// Порядок: синхронный код → все микрозадачи → одна макрозадача
```

**Производительность:**

```javascript
// Микрозадачи блокируют макрозадачи
Promise.resolve().then(() => {
  console.log('Микрозадача');
  // Долгие вычисления заблокируют макрозадачи
  for (let i = 0; i < 1000000; i++) {}
});

setTimeout(() => console.log('Макрозадача'), 0);
// Макрозадача будет ждать завершения всех микрозадач
```

**requestAnimationFrame:**

```javascript
// requestAnimationFrame выполняется между рендерами
requestAnimationFrame(() => {
  // Выполнится перед следующим ререндером
  console.log('RAF');
});
```

### 11. Как работает `this` в JavaScript?
**Ответ:** `this` — контекст выполнения функции, который определяется способом вызова функции.

**Правила определения `this`:**
1. **Глобальный контекст** — `this` указывает на `window` (в браузере) или `global` (в Node.js)
2. **Метод объекта** — `this` указывает на объект, к которому принадлежит метод
3. **Стрелочные функции** — `this` берется из внешней области видимости
4. **call/apply/bind** — явно задают контекст

```javascript
const obj = {
  name: 'John',
  greet() {
    console.log(this.name) // 'John'
  }
}
obj.greet()
```

**Answer EN:** `this` is the execution context of a function, determined by how the function is called.

**Rules for determining `this`:**
1. **Global context** — `this` points to `window` (in browser) or `global` (in Node.js)
2. **Object method** — `this` points to the object the method belongs to
3. **Arrow functions** — `this` is taken from outer scope
4. **call/apply/bind** — explicitly set context

```javascript
const obj = {
  name: 'John',
  greet() {
    console.log(this.name) // 'John'
  }
}
obj.greet()
```

**Ответ Senior:**
1. **Глобальный контекст** — `this` указывает на `window` (в браузере) или `global` (в Node.js)
2. **Метод объекта** — `this` указывает на объект, к которому принадлежит метод
3. **Стрелочные функции** — `this` берется из лексической области видимости (не имеет собственного `this`)
4. **`call`, `apply`, `bind`** — явное указание контекста
5. **Конструктор** — `this` указывает на создаваемый экземпляр
6. **Event handlers** — `this` указывает на элемент, на который навешан обработчик

```javascript
// Глобальный контекст
console.log(this); // window (в браузере)

// Метод объекта
const obj = {
  name: 'John',
  greet() {
    console.log(this.name); // 'John'
  }
};

// Стрелочная функция (лексический this)
const obj2 = {
  name: 'John',
  greet: () => {
    console.log(this.name); // undefined (this из глобального контекста)
  }
};

// call, apply, bind
function greet() {
  console.log(this.name);
}
const person = { name: 'Alice' };
greet.call(person); // 'Alice'
greet.apply(person); // 'Alice'
const boundGreet = greet.bind(person);
boundGreet(); // 'Alice'
```

**Ответ Senior:**

**Детальные правила `this`:**

```javascript
// 1. Приоритет правил (от высшего к низшему):
// - new binding
// - explicit binding (call/apply/bind)
// - implicit binding (метод объекта)
// - default binding (глобальный контекст)

// 2. Потеря контекста
const obj = {
  name: 'John',
  greet() {
    console.log(this.name);
  }
};

const greet = obj.greet;
greet(); // undefined (потеря контекста)

// Решения:
greet.call(obj); // Явное указание
const bound = obj.greet.bind(obj); // Привязка
```

**Стрелочные функции и `this`:**

```javascript
// Стрелочные функции НЕ имеют своего this
const obj = {
  name: 'John',
  regular() {
    return () => {
      console.log(this.name); // 'John' (из regular)
    };
  },
  arrow: () => {
    console.log(this.name); // undefined (глобальный this)
  }
};

// Используйте стрелочные для сохранения this
class Component {
  constructor() {
    this.name = 'Component';
    // ✅ Сохраняет this
    this.handleClick = () => {
      console.log(this.name);
    };
  }
}
```

**`bind`, `call`, `apply` детально:**

Эти три метода позволяют явно указать контекст `this` для функции. Все они являются методами объекта `Function.prototype`.

**1. `call` — немедленный вызов с указанным контекстом:**

```javascript
// Синтаксис: func.call(thisArg, arg1, arg2, ...)
function greet(greeting, punctuation) {
  console.log(`${greeting}, я ${this.name}${punctuation}`);
}

const person = { name: 'Алиса' };
greet.call(person, 'Привет', '!'); // "Привет, я Алиса!"

// call передает аргументы через запятую
function introduce(age, city) {
  return `Меня зовут ${this.name}, мне ${age}, я из ${city}`;
}
introduce.call({ name: 'Иван' }, 25, 'Москва'); // "Меня зовут Иван, мне 25, я из Москва"
```

**2. `apply` — немедленный вызов с массивом аргументов:**

```javascript
// Синтаксис: func.apply(thisArg, [arg1, arg2, ...])
greet.apply(person, ['Привет', '!']); // "Привет, я Алиса!"

// apply полезен когда аргументы в массиве
const args = ['Здравствуй', '.'];
greet.apply(person, args); // "Здравствуй, я Алиса."

// Практическое применение: передача массива в функцию, ожидающую отдельные аргументы
const numbers = [5, 6, 2, 3, 7];
Math.max.apply(null, numbers); // 7 (эквивалент Math.max(5, 6, 2, 3, 7))

// В ES6+ можно использовать spread оператор вместо apply
Math.max(...numbers); // 7
```

**3. `bind` — создание новой функции с привязанным контекстом:**

```javascript
// Синтаксис: func.bind(thisArg, arg1, arg2, ...)
// Возвращает НОВУЮ функцию, не вызывает исходную

const boundGreet = greet.bind(person);
boundGreet('Привет', '!'); // "Привет, я Алиса!"

// bind можно использовать для частичного применения (partial application)
const greetHello = greet.bind(person, 'Привет');
greetHello('!'); // "Привет, я Алиса!"

// Привязка контекста для колбэков
class Button {
  constructor(name) {
    this.name = name;
  }

  click() {
    console.log(`Кнопка ${this.name} нажата`);
  }
}

const button = new Button('Отправить');
// ❌ Потеря контекста
setTimeout(button.click, 1000); // undefined

// ✅ Решение через bind
setTimeout(button.click.bind(button), 1000); // "Кнопка Отправить нажата"
```

**Различия и когда использовать:**

```javascript
// call vs apply - разница только в способе передачи аргументов
function sum(a, b, c) {
  return a + b + c;
}

sum.call(null, 1, 2, 3); // 6 (аргументы через запятую)
sum.apply(null, [1, 2, 3]); // 6 (аргументы в массиве)

// bind vs call/apply - bind НЕ вызывает функцию сразу
const boundSum = sum.bind(null, 1, 2);
boundSum(3); // 6 (вызов позже)

sum.call(null, 1, 2, 3); // 6 (вызов сразу)
```

**Практические применения:**

**1. Заимствование методов (method borrowing):**
```javascript
// Преобразование array-like объектов в массивы
const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
const realArray = Array.prototype.slice.call(arrayLike); // ['a', 'b', 'c']

// Использование методов массивов на NodeList
const divs = document.querySelectorAll('div');
const divsArray = Array.prototype.slice.call(divs);
divsArray.forEach(div => console.log(div));

// В ES6+ можно использовать Array.from()
const divsArray2 = Array.from(divs);
```

**2. Решение проблемы потери контекста:**
```javascript
const calculator = {
  value: 0,
  add(num) {
    this.value += num;
    return this;
  },
  multiply(num) {
    this.value *= num;
    return this;
  }
};

// ❌ Потеря контекста
const add = calculator.add;
add(5); // TypeError или undefined

// ✅ Решения:
add.call(calculator, 5); // Явное указание контекста
const boundAdd = calculator.add.bind(calculator);
boundAdd(5); // Привязка контекста
```

**3. Каррирование и частичное применение:**
```javascript
function multiply(a, b, c) {
  return a * b * c;
}

// Частичное применение через bind
const multiplyBy2 = multiply.bind(null, 2);
multiplyBy2(3, 4); // 24 (2 * 3 * 4)

const multiplyBy2And3 = multiply.bind(null, 2, 3);
multiplyBy2And3(4); // 24 (2 * 3 * 4)
```

**4. Сохранение контекста в классах:**
```javascript
class Logger {
  constructor(prefix) {
    this.prefix = prefix;
    // Привязываем метод к экземпляру
    this.log = this.log.bind(this);
  }

  log(message) {
    console.log(`[${this.prefix}] ${message}`);
  }
}

const logger = new Logger('APP');
const log = logger.log;
log('Тест'); // "[APP] Тест" (контекст сохранен)
```

**Важные особенности:**

- `call` и `apply` вызывают функцию немедленно
- `bind` возвращает новую функцию, не вызывая исходную
- `call` принимает аргументы через запятую
- `apply` принимает аргументы в виде массива
- `bind` позволяет частично применить аргументы (currying)
- Все три метода игнорируются стрелочными функциями (они не имеют собственного `this`)

### 12. Что такое прототипы и прототипное наследование?
**Ответ:** Прототипное наследование — механизм, при котором объекты могут наследовать свойства и методы от других объектов через цепочку прототипов.

**Ключевые концепции:**
- Каждый объект имеет скрытое свойство `[[Prototype]]` (доступно через `__proto__`)
- Функции имеют свойство `prototype`, которое используется при создании объектов через `new`
- При обращении к свойству, если его нет в объекте, поиск идет по цепочке прототипов

```javascript
function Person(name) {
  this.name = name
}
Person.prototype.greet = function() {
  return `Hello, I'm ${this.name}`
}
const person = new Person('John')
console.log(person.greet()) // "Hello, I'm John"
```

**Answer EN:** Prototypal inheritance is a mechanism where objects can inherit properties and methods from other objects through the prototype chain.

**Key concepts:**
- Each object has a hidden `[[Prototype]]` property (accessible via `__proto__`)
- Functions have a `prototype` property used when creating objects via `new`
- When accessing a property, if not found in object, search goes up the prototype chain

```javascript
function Person(name) {
  this.name = name
}
Person.prototype.greet = function() {
  return `Hello, I'm ${this.name}`
}
const person = new Person('John')
console.log(person.greet()) // "Hello, I'm John"
```

**Ответ Senior:**
- Каждый объект имеет скрытое свойство `[[Prototype]]` (доступно через `__proto__`)
- Функции имеют свойство `prototype`, которое используется при создании объектов через `new`
- При обращении к свойству, JavaScript ищет его в объекте, затем в прототипе, и так по цепочке

```javascript
// Создание объекта с прототипом
function Person(name) {
  this.name = name;
}

Person.prototype.greet = function() {
  return `Hello, I'm ${this.name}`;
};

const person = new Person('John');
console.log(person.greet()); // 'Hello, I'm John'

// Прототипное наследование
function Developer(name, language) {
  Person.call(this, name);
  this.language = language;
}

Developer.prototype = Object.create(Person.prototype);
Developer.prototype.constructor = Developer;

Developer.prototype.code = function() {
  return `${this.name} codes in ${this.language}`;
};

const dev = new Developer('Alice', 'JavaScript');
console.log(dev.greet()); // наследуется от Person
console.log(dev.code()); // собственный метод
```

**Ответ Senior:**

**Цепочка прототипов:**

```javascript
// Поиск свойства по цепочке
const obj = {};
// obj -> Object.prototype -> null

// Проверка наличия свойства
obj.hasOwnProperty('prop'); // Собственное свойство
'prop' in obj; // Включая прототипную цепочку

// Создание объекта без прототипа
const noProto = Object.create(null);
noProto.toString; // undefined (нет Object.prototype)
```

**Оптимизация производительности:**

```javascript
// Избегайте изменения прототипов во время выполнения
// Это нарушает оптимизацию движка

// ❌ Плохо: изменение прототипа после создания
Person.prototype.newMethod = function() {};

// ✅ Хорошо: определение прототипа до создания
function Person() {}
Person.prototype.method = function() {};
```

### 13. Что такое constructor, class и prototype? Как они связаны?
**Ответ:** `constructor`, `class` и `prototype` — ключевые концепции JavaScript для создания объектов и наследования. Constructor — функция для создания объектов, class — синтаксический сахар над конструкторами, prototype — механизм наследования.

```javascript
// Constructor
function Person(name) {
  this.name = name
}
Person.prototype.greet = function() {
  return `Hello, I'm ${this.name}`
}

// Class (синтаксический сахар)
class Person {
  constructor(name) {
    this.name = name
  }
  greet() {
    return `Hello, I'm ${this.name}`
  }
}
```

**Answer EN:** `constructor`, `class` and `prototype` are key JavaScript concepts for object creation and inheritance. Constructor is a function for creating objects, class is syntactic sugar over constructors, prototype is inheritance mechanism.

```javascript
// Constructor
function Person(name) {
  this.name = name
}
Person.prototype.greet = function() {
  return `Hello, I'm ${this.name}`
}

// Class (syntactic sugar)
class Person {
  constructor(name) {
    this.name = name
  }
  greet() {
    return `Hello, I'm ${this.name}`
  }
}
```

**Ответ Senior:**

**Что это:** Функция, используемая для создания и инициализации объектов. При вызове с `new` создает новый экземпляр.

```javascript
// Функция-конструктор
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const person = new Person('John', 30);
console.log(person.name); // 'John'
console.log(person.age); // 30

// constructor свойство указывает на функцию-конструктор
console.log(person.constructor === Person); // true
```

**Как работает `new`:**
```javascript
function Person(name) {
  this.name = name;
}

// Когда вызывается new Person('John'), происходит:
// 1. Создается новый пустой объект {}
// 2. this указывает на этот объект
// 3. Выполняется код функции Person
// 4. Объект связывается с Person.prototype
// 5. Возвращается объект (если функция не возвращает свой объект)

// Эквивалент того, что делает new:
function myNew(constructor, ...args) {
  const obj = {}; // 1. Создаем пустой объект
  Object.setPrototypeOf(obj, constructor.prototype); // 4. Связываем с prototype
  const result = constructor.apply(obj, args); // 2-3. Вызываем конструктор
  return result instanceof Object ? result : obj; // 5. Возвращаем объект
}
```

**Class (класс):**

**Что это:** Синтаксический сахар над прототипным наследованием. Представляет более удобный способ создания конструкторов и наследования.

```javascript
// ES6 классы - синтаксический сахар над функциями-конструкторами
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    return `Hello, I'm ${this.name}`;
  }

  static createAdmin() {
    return new Person('Admin', 0);
  }
}

const person = new Person('John', 30);
console.log(person.greet()); // 'Hello, I'm John'

// Класс - это функция
console.log(typeof Person); // 'function'
console.log(Person.prototype.greet); // функция greet
```

**Что происходит под капотом:**
```javascript
// Класс Person эквивалентен:
function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.greet = function() {
  return `Hello, I'm ${this.name}`;
};

Person.createAdmin = function() {
  return new Person('Admin', 0);
};
```

**Prototype (прототип):**

**Что это:** Объект, от которого другие объекты наследуют свойства и методы.

**Связь между constructor, class и prototype:**

```javascript
class Person {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return `Hello, ${this.name}`;
  }
}

const person = new Person('John');

// 1. Person.prototype - объект прототипа
console.log(Person.prototype); // { greet: [Function], constructor: [Function] }

// 2. person.__proto__ или Object.getPrototypeOf(person) - ссылка на прототип
console.log(person.__proto__ === Person.prototype); // true
console.log(Object.getPrototypeOf(person) === Person.prototype); // true

// 3. Person.prototype.constructor - ссылка на конструктор/класс
console.log(Person.prototype.constructor === Person); // true
console.log(person.constructor === Person); // true

// 4. Цепочка прототипов
// person -> Person.prototype -> Object.prototype -> null
console.log(person.__proto__.__proto__ === Object.prototype); // true
console.log(person.__proto__.__proto__.__proto__ === null); // true
```

**Наследование с классами:**

```javascript
// Базовый класс
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} makes a sound`;
  }
}

// Наследование
class Dog extends Animal {
  constructor(name, breed) {
    super(name); // Вызов конструктора родителя
    this.breed = breed;
  }

  speak() {
    return `${this.name} barks`;
  }

  fetch() {
    return `${this.name} fetches the ball`;
  }
}

const dog = new Dog('Rex', 'Labrador');

// Цепочка прототипов:
// dog -> Dog.prototype -> Animal.prototype -> Object.prototype -> null

console.log(dog.speak()); // 'Rex barks' (переопределенный метод)
console.log(dog instanceof Dog); // true
console.log(dog instanceof Animal); // true
console.log(dog instanceof Object); // true

// Проверка прототипов
console.log(Object.getPrototypeOf(dog) === Dog.prototype); // true
console.log(Object.getPrototypeOf(Dog.prototype) === Animal.prototype); // true
console.log(Dog.prototype.constructor === Dog); // true
```

**Что происходит при наследовании:**

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
}

// Под капотом происходит:
// 1. Dog.prototype = Object.create(Animal.prototype)
// 2. Dog.prototype.constructor = Dog
// 3. Dog.__proto__ = Animal (для статических методов)

// Эквивалент без классов:
function Animal(name) {
  this.name = name;
}

function Dog(name, breed) {
  Animal.call(this, name); // super(name)
  this.breed = breed;
}

Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
```

**Статические методы и свойства:**

```javascript
class MathUtils {
  static PI = 3.14159;

  static add(a, b) {
    return a + b;
  }

  static multiply(a, b) {
    return a * b;
  }
}

// Статические методы принадлежат классу, а не экземпляру
console.log(MathUtils.add(2, 3)); // 5
console.log(MathUtils.PI); // 3.14159

const utils = new MathUtils();
console.log(utils.add); // undefined (не доступно в экземпляре)

// Статические методы наследуются
class AdvancedMath extends MathUtils {
  static power(a, b) {
    return Math.pow(a, b);
  }
}

console.log(AdvancedMath.add(2, 3)); // 5 (унаследован)
console.log(AdvancedMath.power(2, 3)); // 8 (собственный)
```

**Приватные поля и методы (ES2022):**

```javascript
class BankAccount {
  #balance = 0; // Приватное поле

  constructor(initialBalance) {
    this.#balance = initialBalance;
  }

  #validateAmount(amount) { // Приватный метод
    return amount > 0;
  }

  deposit(amount) {
    if (this.#validateAmount(amount)) {
      this.#balance += amount;
    }
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount(100);
account.deposit(50);
console.log(account.getBalance()); // 150
// account.#balance; // SyntaxError: Private field '#balance' must be declared in an enclosing class
```

**Геттеры и сеттеры:**

```javascript
class Person {
  constructor(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  set fullName(name) {
    const parts = name.split(' ');
    this.firstName = parts[0];
    this.lastName = parts[1];
  }
}

const person = new Person('John', 'Doe');
console.log(person.fullName); // 'John Doe' (вызывается как свойство)

person.fullName = 'Jane Smith'; // Вызывается сеттер
console.log(person.firstName); // 'Jane'
console.log(person.lastName); // 'Smith'
```

**Проверка типов и instanceof:**

```javascript
class Animal {}
class Dog extends Animal {}
class Cat extends Animal {}

const dog = new Dog();
const cat = new Cat();

// instanceof проверяет цепочку прототипов
console.log(dog instanceof Dog); // true
console.log(dog instanceof Animal); // true
console.log(dog instanceof Object); // true
console.log(dog instanceof Cat); // false

// Как работает instanceof:
function myInstanceof(obj, constructor) {
  let proto = Object.getPrototypeOf(obj);
  while (proto !== null) {
    if (proto === constructor.prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
```

**Разница между class и function constructor:**

| Характеристика | Class | Function Constructor |
|----------------|-------|----------------------|
| Hoisting | ❌ Не поднимается | ✅ Поднимается |
| Строгий режим | ✅ Всегда | ❌ По умолчанию |
| Вызов без new | ❌ TypeError | ⚠️ Работает, но неожиданно |
| Приватные поля | ✅ ES2022 | ❌ Нет |
| Наследование | ✅ extends | ⚠️ Вручную через Object.create |

**Практические примеры:**

**Пример 1: Создание переиспользуемых компонентов**
```javascript
class Component {
  constructor(element) {
    this.element = element;
  }

  render() {
    throw new Error('render() must be implemented');
  }

  mount() {
    this.element.innerHTML = this.render();
  }
}

class Button extends Component {
  constructor(element, text) {
    super(element);
    this.text = text;
  }

  render() {
    return `<button>${this.text}</button>`;
  }
}
```

**Пример 2: Миксины через прототипы**
```javascript
// Миксин для логирования
const Logger = {
  log(message) {
    console.log(`[${this.constructor.name}] ${message}`);
  }
};

class User {
  constructor(name) {
    this.name = name;
  }
}

// Добавляем методы миксина в прототип
Object.assign(User.prototype, Logger);

const user = new User('John');
user.log('User created'); // [User] User created
```

**Пример 3: Фабрика объектов**
```javascript
class AnimalFactory {
  static create(type, name) {
    switch (type) {
      case 'dog':
        return new Dog(name);
      case 'cat':
        return new Cat(name);
      default:
        throw new Error('Unknown animal type');
    }
  }
}

const dog = AnimalFactory.create('dog', 'Rex');
```

**Важные моменты:**

1. **Классы не поднимаются (hoisting)** — нельзя использовать до объявления
2. **Классы всегда в строгом режиме** — автоматически
3. **constructor не обязателен** — если не указан, создается пустой
4. **super обязателен в конструкторе** — если класс наследуется
5. **Методы класса не перечисляемы** — не появляются в for...in

**Ответ Senior:**

**Классы как функции-конструкторы:**

```javascript
// Классы - это синтаксический сахар
class Person {
  constructor(name) {
    this.name = name;
  }
}

// Эквивалентно:
function Person(name) {
  this.name = name;
}

// Но классы имеют дополнительные проверки
Person(); // TypeError: Class constructor Person cannot be invoked without 'new'
```

**Приватные поля и методы (ES2022):**

```javascript
class BankAccount {
  #balance = 0; // Приватное поле

  deposit(amount) {
    if (amount > 0) {
      this.#balance += amount;
    }
  }

  // Приватные поля доступны только внутри класса
  // this.#balance недоступно снаружи
}
```

**Геттеры и сеттеры:**

```javascript
class Temperature {
  constructor(celsius) {
    this._celsius = celsius;
  }

  get celsius() {
    return this._celsius;
  }

  set celsius(value) {
    this._celsius = value;
  }

  get fahrenheit() {
    return this._celsius * 9/5 + 32;
  }
}
```

### 14. Разница между `WeakMap`/`WeakSet` и `Map`/`Set`?
**Ответ:** `WeakMap` и `WeakSet` — коллекции с "слабыми" ссылками, которые не препятствуют сборке мусора. В отличие от `Map`/`Set`, они принимают только объекты в качестве ключей, не имеют итераторов и автоматически удаляют записи при удалении ключа.

```javascript
// WeakMap - только объекты как ключи
const weakMap = new WeakMap()
const obj = {}
weakMap.set(obj, 'value')
// obj удален → запись автоматически удалена из WeakMap

// Map - любые типы ключей, есть итераторы
const map = new Map()
map.set('string', 'value')
map.set(1, 'value')
```

**Answer EN:** `WeakMap` and `WeakSet` are collections with "weak" references that don't prevent garbage collection. Unlike `Map`/`Set`, they accept only objects as keys, don't have iterators and automatically remove entries when key is deleted.

```javascript
// WeakMap - only objects as keys
const weakMap = new WeakMap()
const obj = {}
weakMap.set(obj, 'value')
// obj deleted → entry automatically removed from WeakMap

// Map - any key types, has iterators
const map = new Map()
map.set('string', 'value')
map.set(1, 'value')
```

**Ответ Senior:**

**Отличия:**

| Характеристика | `WeakMap`/`WeakSet` | `Map`/`Set` |
|----------------|---------------------|-------------|
| Типы ключей | Только объекты | Любые типы |
| Итераторы | ❌ Нет | ✅ Есть |
| Метод `size` | ❌ Нет | ✅ Есть |
| Методы `keys()`, `values()`, `entries()` | ❌ Нет | ✅ Есть |
| Сборка мусора | ✅ Автоматическая | ❌ Не удаляются |
| Удаление при удалении ключа | ✅ Автоматически | ❌ Остаются в памяти |

**Когда использовать `WeakMap`:**

**1. Приватные данные объектов (инкапсуляция):**
```javascript
const privateData = new WeakMap();

class User {
  constructor(name, email) {
    // Приватные данные хранятся в WeakMap, недоступны извне
    privateData.set(this, {
      name,
      email,
      password: this.generatePassword()
    });
  }

  getName() {
    return privateData.get(this).name;
  }

  getEmail() {
    return privateData.get(this).email;
  }

  // Приватные данные недоступны напрямую
  // privateData.get(user) - undefined извне класса
}

const user = new User('John', 'john@example.com');
console.log(user.getName()); // 'John'
// privateData.get(user) - недоступно извне
```

**2. Кэширование результатов вычислений:**
```javascript
const cache = new WeakMap();

function expensiveComputation(obj) {
  // Проверяем кэш
  if (cache.has(obj)) {
    return cache.get(obj);
  }

  // Выполняем вычисления
  const result = obj.value * 1000 + Math.random();

  // Сохраняем в кэш
  cache.set(obj, result);
  return result;
}

const data1 = { value: 10 };
const data2 = { value: 20 };

expensiveComputation(data1); // вычисление
expensiveComputation(data1); // из кэша
expensiveComputation(data2); // вычисление

// Когда data1 удаляется из памяти, он автоматически удаляется из кэша
data1 = null; // кэш для data1 будет очищен сборщиком мусора
```

**3. Хранение метаданных DOM элементов:**
```javascript
const elementData = new WeakMap();

function attachData(element, data) {
  elementData.set(element, data);
}

function getData(element) {
  return elementData.get(element);
}

const button = document.querySelector('#myButton');
attachData(button, { clicks: 0, lastClick: null });

button.addEventListener('click', () => {
  const data = getData(button);
  data.clicks++;
  data.lastClick = Date.now();
});

// Когда элемент удаляется из DOM, метаданные автоматически удаляются
// Не нужно вручную очищать память
```

**4. Подсчет ссылок на объекты:**
```javascript
const refCount = new WeakMap();

function trackReference(obj) {
  const count = refCount.get(obj) || 0;
  refCount.set(obj, count + 1);
}

function untrackReference(obj) {
  const count = refCount.get(obj) || 0;
  if (count > 0) {
    refCount.set(obj, count - 1);
  }
}
```

**Когда использовать `WeakSet`:**

**1. Отслеживание обработанных объектов:**
```javascript
const processed = new WeakSet();

function processObject(obj) {
  // Проверяем, был ли объект уже обработан
  if (processed.has(obj)) {
    console.log('Объект уже обработан, пропускаем');
    return;
  }

  // Обрабатываем объект
  obj.processed = true;
  obj.timestamp = Date.now();

  // Помечаем как обработанный
  processed.add(obj);
}

const obj1 = { id: 1 };
const obj2 = { id: 2 };

processObject(obj1); // обработано
processObject(obj1); // пропущено (уже обработано)
processObject(obj2); // обработано

// Когда объекты удаляются, они автоматически удаляются из WeakSet
```

**2. Предотвращение циклических ссылок:**
```javascript
const visited = new WeakSet();

function deepClone(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // Проверяем на циклические ссылки
  if (visited.has(obj)) {
    throw new Error('Обнаружена циклическая ссылка');
  }

  visited.add(obj);

  const clone = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key]);
    }
  }

  visited.delete(obj);
  return clone;
}
```

**3. Отслеживание подписок/слушателей:**
```javascript
const subscribed = new WeakSet();

class EventEmitter {
  subscribe(obj, callback) {
    if (!subscribed.has(obj)) {
      subscribed.add(obj);
      this.addListener(obj, callback);
    }
  }

  unsubscribe(obj) {
    if (subscribed.has(obj)) {
      subscribed.delete(obj);
      this.removeListener(obj);
    }
  }
}
```

**Практические примеры использования:**

**Пример 1: Vue 3 реактивность (концептуально):**
```javascript
// Vue использует WeakMap для хранения реактивных данных
const reactiveMap = new WeakMap();

function reactive(obj) {
  // Проверяем, не был ли объект уже сделан реактивным
  if (reactiveMap.has(obj)) {
    return reactiveMap.get(obj);
  }

  const proxy = new Proxy(obj, {
    get(target, key) {
      track(target, key); // отслеживание зависимостей
      return target[key];
    },
    set(target, key, value) {
      target[key] = value;
      trigger(target, key); // триггер обновлений
      return true;
    }
  });

  reactiveMap.set(obj, proxy);
  return proxy;
}
```

**Пример 2: Кэширование результатов для объектов:**
```javascript
const memoCache = new WeakMap();

function memoize(fn) {
  return function(obj, ...args) {
    if (!memoCache.has(obj)) {
      memoCache.set(obj, new Map());
    }

    const cache = memoCache.get(obj);
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(obj, ...args);
    cache.set(key, result);
    return result;
  };
}

const expensiveOperation = memoize((obj, multiplier) => {
  return obj.value * multiplier;
});
```

**Важные ограничения:**

```javascript
// ❌ WeakMap не работает с примитивами
const wm = new WeakMap();
wm.set('string', 'value'); // TypeError: Invalid value used as weak map key
wm.set(123, 'value'); // TypeError

// ✅ Только объекты
const obj = {};
wm.set(obj, 'value'); // OK

// ❌ Нет способа узнать размер или перебрать элементы
const wm = new WeakMap();
wm.size; // undefined
wm.keys(); // TypeError: wm.keys is not a function
wm.values(); // TypeError
wm.entries(); // TypeError

// ❌ Нет способа очистить все элементы
wm.clear(); // TypeError: wm.clear is not a function
```

**Преимущества использования:**

1. **Автоматическая очистка памяти** — не нужно вручную удалять записи
2. **Предотвращение утечек памяти** — объекты могут быть удалены сборщиком мусора
3. **Приватность данных** — данные недоступны без ссылки на объект
4. **Производительность** — меньше ручного управления памятью

**Когда НЕ использовать:**

- Когда нужны итераторы или размер коллекции
- Когда ключи — примитивы (string, number)
- Когда нужно вручную управлять жизненным циклом данных
- Когда нужна возможность очистить всю коллекцию

### 15. Что такое Proxy и Reflect?
**Ответ:** `Proxy` — объект-обертка для перехвата операций над целевым объектом. `Reflect` — встроенный объект с методами для операций, которые можно перехватить через Proxy.

**Использование Proxy:**
- Валидация свойств
- Логирование доступа к свойствам
- Виртуальные свойства
- Реактивность (как в Vue 3)

```javascript
// Proxy для валидации
const validator = {
  set(target, property, value) {
    if (property === 'age' && typeof value !== 'number') {
      throw new TypeError('Age must be a number')
    }
    target[property] = value
    return true
  }
}

const person = new Proxy({}, validator)
person.age = 30 // OK
person.age = 'thirty' // TypeError

// Reflect для метапрограммирования
const obj = { name: 'John' }
Reflect.has(obj, 'name') // true
Reflect.get(obj, 'name') // 'John'
Reflect.set(obj, 'age', 30) // true
```

**Answer EN:** `Proxy` is a wrapper object for intercepting operations on target object. `Reflect` is a built-in object with methods for operations that can be intercepted via Proxy.

**Proxy usage:**
- Property validation
- Access logging
- Virtual properties
- Reactivity (like in Vue 3)

```javascript
// Proxy for validation
const validator = {
  set(target, property, value) {
    if (property === 'age' && typeof value !== 'number') {
      throw new TypeError('Age must be a number')
    }
    target[property] = value
    return true
  }
}

const person = new Proxy({}, validator)
person.age = 30 // OK
person.age = 'thirty' // TypeError

// Reflect for metaprogramming
const obj = { name: 'John' }
Reflect.has(obj, 'name') // true
Reflect.get(obj, 'name') // 'John'
Reflect.set(obj, 'age', 30) // true
```

**Ответ Senior:**
```

**Ответ Senior:**

**Продвинутое использование Proxy:**

```javascript
// Реактивность (Vue 3 концепция)
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      track(target, key); // Отслеживание зависимостей
      return Reflect.get(target, key);
    },
    set(target, key, value) {
      const result = Reflect.set(target, key, value);
      trigger(target, key); // Триггер обновлений
      return result;
    }
  });
}

// Виртуальные свойства
const virtualProps = new Proxy({}, {
  get(target, prop) {
    if (prop === 'fullName') {
      return `${target.firstName} ${target.lastName}`;
    }
    return target[prop];
  }
});

// Логирование доступа
const logged = new Proxy(obj, {
  get(target, prop) {
    console.log(`Getting ${prop}`);
    return target[prop];
  },
  set(target, prop, value) {
    console.log(`Setting ${prop} = ${value}`);
    target[prop] = value;
    return true;
  }
});
```

**Reflect API:**

```javascript
// Reflect предоставляет метаоперации как функции
Reflect.has(obj, 'prop'); // 'prop' in obj
Reflect.get(obj, 'prop'); // obj.prop
Reflect.set(obj, 'prop', value); // obj.prop = value
Reflect.deleteProperty(obj, 'prop'); // delete obj.prop
Reflect.ownKeys(obj); // Object.keys() + символы
```

### 16. Что такое итераторы и генераторы?
**Ответ:** Итераторы — объекты с методом `next()`, возвращающим `{value, done}`. Генераторы — функции, возвращающие итераторы через `yield`.

**Итераторы:**
```javascript
const iterable = {
  [Symbol.iterator]() {
    let count = 0
    return {
      next() {
        if (count < 3) {
          return { value: count++, done: false }
        }
        return { done: true }
      }
    }
  }
}

for (const value of iterable) {
  console.log(value) // 0, 1, 2
}
```

**Генераторы:**
```javascript
function* numberGenerator() {
  yield 1
  yield 2
  yield 3
}
const gen = numberGenerator()
console.log(gen.next().value) // 1
```

**Answer EN:** Iterators are objects with `next()` method returning `{value, done}`. Generators are functions that return iterators via `yield`.

**Iterators:**
```javascript
const iterable = {
  [Symbol.iterator]() {
    let count = 0
    return {
      next() {
        if (count < 3) {
          return { value: count++, done: false }
        }
        return { done: true }
      }
    }
  }
}

for (const value of iterable) {
  console.log(value) // 0, 1, 2
}
```

**Generators:**
```javascript
function* numberGenerator() {
  yield 1
  yield 2
  yield 3
}
const gen = numberGenerator()
console.log(gen.next().value) // 1
```

**Ответ Senior:**
}

const gen = numberGenerator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2

// Async генераторы
async function* fetchPages() {
  for (let i = 1; i <= 3; i++) {
    const response = await fetch(`/api/page/${i}`);
    yield await response.json();
  }
}
```

**Ответ Senior:**

**Генераторы для управления потоком:**

```javascript
// Кооперативная многозадачность
function* task1() {
  yield 'task1-1';
  yield 'task1-2';
}

function* task2() {
  yield 'task2-1';
  yield 'task2-2';
}

function scheduler(...tasks) {
  while (tasks.length) {
    for (const task of tasks) {
      const { value, done } = task.next();
      if (done) {
        tasks.splice(tasks.indexOf(task), 1);
      } else {
        console.log(value);
      }
    }
  }
}
```

**Генераторы для ленивых вычислений:**

```javascript
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
console.log(fib.next().value); // 0
console.log(fib.next().value); // 1
console.log(fib.next().value); // 1
```

### 17. Как предотвратить memory leaks во фронтенде?
**Ответ:** Утечки памяти возникают, когда объекты остаются в памяти после того, как больше не нужны.

**Основные причины:**
1. **Глобальные переменные** — переменные в глобальной области видимости
2. **Забытые таймеры** — `setInterval`, `setTimeout` без очистки
3. **Event listeners** — не удаленные обработчики событий
4. **Замыкания** — ссылки на большие объекты в замыканиях
5. **DOM ссылки** — сохраненные ссылки на удаленные DOM элементы

**Решения:**
```javascript
// 1. Очистка таймеров
const timerId = setInterval(() => {}, 1000)
clearInterval(timerId) // обязательно очистить

// 2. Удаление event listeners
const handler = () => {}
element.addEventListener('click', handler)
element.removeEventListener('click', handler)

// 3. Очистка в Vue компонентах
onUnmounted(() => {
  clearInterval(timerId)
  element.removeEventListener('click', handler)
})
```

**Answer EN:** Memory leaks occur when objects remain in memory after they're no longer needed.

**Main causes:**
1. **Global variables** — variables in global scope
2. **Forgotten timers** — `setInterval`, `setTimeout` without cleanup
3. **Event listeners** — not removed event handlers
4. **Closures** — references to large objects in closures
5. **DOM references** — saved references to deleted DOM elements

**Solutions:**
```javascript
// 1. Cleanup timers
const timerId = setInterval(() => {}, 1000)
clearInterval(timerId) // must cleanup

// 2. Remove event listeners
const handler = () => {}
element.addEventListener('click', handler)
element.removeEventListener('click', handler)

// 3. Cleanup in Vue components
onUnmounted(() => {
  clearInterval(timerId)
  element.removeEventListener('click', handler)
})
```

**Ответ Senior:**
})(); // переменная не доступна снаружи

// 5. WeakMap для временных данных
const cache = new WeakMap(); // автоматически очищается при удалении ключа
```

**Ответ Senior:**

**Детектирование утечек:**

```javascript
// Performance API для мониторинга памяти
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Memory:', entry.usedJSHeapSize);
  }
});
observer.observe({ entryTypes: ['measure'] });

// Chrome DevTools Memory Profiler
// Heap Snapshots для сравнения
```

**Паттерны предотвращения:**

```javascript
// 1. Используйте AbortController для отмены запросов
const controller = new AbortController();
fetch(url, { signal: controller.signal });
controller.abort(); // Отмена предотвращает утечки

// 2. WeakRef для слабых ссылок (ES2021)
const weakRef = new WeakRef(largeObject);
const obj = weakRef.deref(); // undefined если объект удалён

// 3. FinalizationRegistry для очистки (ES2021)
const registry = new FinalizationRegistry((heldValue) => {
  console.log('Object cleaned up:', heldValue);
});
registry.register(obj, 'metadata');
```

### 18. Продвинутые типы TypeScript: Conditional Types и Mapped Types?
**Ответ:** Продвинутые типы для создания гибких и переиспользуемых типовых определений. Conditional Types позволяют создавать типы на основе условий, Mapped Types — преобразовывать существующие типы.

**Conditional Types:**
```typescript
type NonNullable<T> = T extends null | undefined ? never : T

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any
```

**Mapped Types:**
```typescript
type Partial<T> = {
  [P in keyof T]?: T[P]
}

type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}
```

**Answer EN:** Advanced types for creating flexible and reusable type definitions. Conditional Types allow creating types based on conditions, Mapped Types transform existing types.

**Conditional Types:**
```typescript
type NonNullable<T> = T extends null | undefined ? never : T

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any
```

**Mapped Types:**
```typescript
type Partial<T> = {
  [P in keyof T]?: T[P]
}

type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}
```

**Ответ Senior:**
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Person = { name: string; age: number };
type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }
```

**Ответ Senior:**

**Продвинутые паттерны:**

```typescript
// Template literal types
type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<'click'>; // 'onClick'

// Recursive types
type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

// Utility types
type Required<T> = { [P in keyof T]-?: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

**Практические применения:**

```typescript
// Типобезопасный API client
type ApiMethods<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => Promise<T[K]>;
};

// Создание типов из значений
const routes = ['home', 'about', 'contact'] as const;
type Route = typeof routes[number]; // 'home' | 'about' | 'contact'
```

### 19. Что такое инкапсуляция в JavaScript?
**Ответ:** Инкапсуляция — принцип объектно-ориентированного программирования, который позволяет скрывать внутреннюю реализацию объекта и предоставлять только необходимый публичный интерфейс. В JavaScript инкапсуляция достигается через замыкания, приватные поля классов (ES2022) и паттерны проектирования.

**Основные способы реализации:**

**1. Замыкания (Closures):**
```javascript
function createCounter() {
  let count = 0 // Приватная переменная

  return {
    increment() {
      count++
    },
    getValue() {
      return count
    }
  }
}

const counter = createCounter()
counter.increment()
console.log(counter.getValue()) // 1
console.log(counter.count) // undefined (недоступно извне)
```

**2. Приватные поля классов (ES2022):**
```javascript
class Counter {
  #count = 0 // Приватное поле

  increment() {
    this.#count++
  }

  getValue() {
    return this.#count
  }
}
```

**Answer EN:** Encapsulation is an object-oriented programming principle that allows hiding internal object implementation and providing only necessary public interface. In JavaScript, encapsulation is achieved through closures, private class fields (ES2022) and design patterns.

**Main implementation ways:**

**1. Closures:**
```javascript
function createCounter() {
  let count = 0 // Private variable

  return {
    increment() {
      count++
    },
    getValue() {
      return count
    }
  }
}

const counter = createCounter()
counter.increment()
console.log(counter.getValue()) // 1
console.log(counter.count) // undefined (not accessible)
```

**2. Private class fields (ES2022):**
```javascript
class Counter {
  #count = 0 // Private field

  increment() {
    this.#count++
  }

  getValue() {
    return this.#count
  }
}
```

**Ответ Senior:**

**2. Приватные поля классов (ES2022):**
```javascript
class BankAccount {
  #balance = 0; // Приватное поле

  deposit(amount) {
    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount();
account.deposit(100);
console.log(account.getBalance()); // 100
console.log(account.#balance); // SyntaxError: Private field
```

**3. Символы (Symbols):**
```javascript
const _balance = Symbol('balance');

class Account {
  constructor() {
    this[_balance] = 0;
  }

  deposit(amount) {
    this[_balance] += amount;
  }
}

const account = new Account();
account.deposit(100);
console.log(account[_balance]); // 100 (доступно, но сложно найти)
```

**Ответ Senior:**

**Продвинутые паттерны инкапсуляции:**

**1. Модульный паттерн (Module Pattern):**
```javascript
const UserModule = (function() {
  // Приватные переменные и функции
  let users = [];
  let nextId = 1;

  function validateUser(user) {
    return user.name && user.email;
  }

  function generateId() {
    return nextId++;
  }

  // Публичный API
  return {
    add(user) {
      if (validateUser(user)) {
        user.id = generateId();
        users.push(user);
        return user;
      }
      throw new Error('Invalid user');
    },

    get(id) {
      return users.find(u => u.id === id);
    },

    getAll() {
      return [...users]; // Возвращаем копию
    },

    remove(id) {
      users = users.filter(u => u.id !== id);
    }
  };
})();

// Приватные функции недоступны извне
UserModule.validateUser({}); // TypeError
UserModule.add({ name: 'John', email: 'john@example.com' }); // ✅
```

**2. WeakMap для приватных данных:**
```javascript
const privateData = new WeakMap();

class Person {
  constructor(name, age) {
    // Сохраняем приватные данные в WeakMap
    privateData.set(this, {
      name,
      age,
      secret: 'confidential'
    });
  }

  getName() {
    return privateData.get(this).name;
  }

  getAge() {
    return privateData.get(this).age;
  }

  // Приватные данные недоступны извне
}

const person = new Person('Alice', 30);
console.log(person.getName()); // 'Alice'
console.log(person.secret); // undefined
```

**3. Приватные методы и геттеры/сеттеры:**
```javascript
class Temperature {
  #celsius = 0;

  // Приватный метод
  #validate(value) {
    if (value < -273.15) {
      throw new Error('Temperature below absolute zero');
    }
  }

  set celsius(value) {
    this.#validate(value);
    this.#celsius = value;
  }

  get celsius() {
    return this.#celsius;
  }

  get fahrenheit() {
    return this.#celsius * 9/5 + 32;
  }

  set fahrenheit(value) {
    this.celsius = (value - 32) * 5/9;
  }
}

const temp = new Temperature();
temp.celsius = 25;
console.log(temp.fahrenheit); // 77
temp.celsius = -300; // Error: Temperature below absolute zero
```

**4. Инкапсуляция через Proxy:**
```javascript
function createPrivateObject(target, privateProps) {
  const privateSet = new Set(privateProps);

  return new Proxy(target, {
    get(obj, prop) {
      if (privateSet.has(prop)) {
        throw new Error(`Property ${prop} is private`);
      }
      return obj[prop];
    },

    set(obj, prop, value) {
      if (privateSet.has(prop)) {
        throw new Error(`Property ${prop} is private`);
      }
      obj[prop] = value;
      return true;
    },

    has(obj, prop) {
      return !privateSet.has(prop) && prop in obj;
    },

    ownKeys(obj) {
      return Object.keys(obj).filter(key => !privateSet.has(key));
    }
  });
}

const obj = createPrivateObject(
  { public: 'visible', secret: 'hidden' },
  ['secret']
);

console.log(obj.public); // 'visible'
console.log(obj.secret); // Error: Property secret is private
```

**5. Инкапсуляция состояния в функциональном стиле:**
```javascript
function createStatefulCounter() {
  let state = {
    count: 0,
    history: []
  };

  function updateState(updater) {
    const newState = updater(state);
    state = { ...newState };
    return state;
  }

  return {
    increment() {
      return updateState(s => ({
        count: s.count + 1,
        history: [...s.history, 'increment']
      }));
    },

    decrement() {
      return updateState(s => ({
        count: s.count - 1,
        history: [...s.history, 'decrement']
      }));
    },

    getState() {
      return { ...state }; // Возвращаем копию
    },

    reset() {
      state = { count: 0, history: [] };
    }
  };
}

const counter = createStatefulCounter();
counter.increment();
counter.increment();
console.log(counter.getState()); // { count: 2, history: ['increment', 'increment'] }
```

**Преимущества инкапсуляции:**

1. **Защита данных** — предотвращение неконтролируемого изменения состояния
2. **Упрощение интерфейса** — скрытие сложной внутренней реализации
3. **Поддержка кода** — изменения внутренней реализации не влияют на внешний код
4. **Предотвращение ошибок** — контроль доступа к данным через валидацию
5. **Модульность** — четкое разделение ответственности

**Когда использовать:**

- Когда нужно защитить внутреннее состояние объекта
- При создании библиотек и API
- Для реализации бизнес-логики с ограничениями доступа
- При работе с чувствительными данными
- Для создания переиспользуемых компонентов

### 20. Что такое каррирование (currying)?
**Ответ:** Каррирование — техника преобразования функции с несколькими аргументами в последовательность функций, каждая из которых принимает один аргумент. Позволяет создавать специализированные функции из более общих.

```javascript
// Обычная функция
function add(a, b, c) {
  return a + b + c
}

// Каррированная версия
function curriedAdd(a) {
  return function(b) {
    return function(c) {
      return a + b + c
    }
  }
}

// Использование
const add5 = curriedAdd(5)
const add5And10 = add5(10)
console.log(add5And10(3)) // 18

// Или сразу
console.log(curriedAdd(5)(10)(3)) // 18
```

**Answer EN:** Currying is a technique of transforming a function with multiple arguments into a sequence of functions, each taking one argument. Allows creating specialized functions from more general ones.

```javascript
// Regular function
function add(a, b, c) {
  return a + b + c
}

// Curried version
function curriedAdd(a) {
  return function(b) {
    return function(c) {
      return a + b + c
    }
  }
}

// Usage
const add5 = curriedAdd(5)
const add5And10 = add5(10)
console.log(add5And10(3)) // 18

// Or immediately
console.log(curriedAdd(5)(10)(3)) // 18
```

**Ответ Senior:**

**Преимущества каррирования:**

1. **Частичное применение (Partial Application)** — создание специализированных функций
2. **Переиспользование кода** — одна функция для разных случаев
3. **Композиция функций** — легко комбинировать функции
4. **Ленивые вычисления** — функция выполняется только когда все аргументы переданы

**Универсальная функция каррирования:**

```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args)
    } else {
      return function(...nextArgs) {
        return curried.apply(this, args.concat(nextArgs))
      }
    }
  }
}

// Пример использования
const multiply = (a, b, c) => a * b * c
const curriedMultiply = curry(multiply)

console.log(curriedMultiply(2)(3)(4)) // 24
console.log(curriedMultiply(2, 3)(4)) // 24
console.log(curriedMultiply(2)(3, 4)) // 24
console.log(curriedMultiply(2, 3, 4)) // 24

// Частичное применение
const multiplyBy2 = curriedMultiply(2)
const multiplyBy2And3 = multiplyBy2(3)
console.log(multiplyBy2And3(4)) // 24
```

**Практические примеры:**

**1. Создание специализированных функций:**
```javascript
// Общая функция логирования
const log = (level, message, timestamp) => {
  console.log(`[${level}] ${timestamp}: ${message}`)
}

// Каррированная версия
const curriedLog = curry(log)
const logError = curriedLog('ERROR')
const logErrorNow = logError(new Date().toISOString())

logErrorNow('Something went wrong')
// [ERROR] 2024-01-01T12:00:00.000Z: Something went wrong
```

**2. Работа с массивами:**
```javascript
const map = curry((fn, array) => array.map(fn))
const filter = curry((predicate, array) => array.filter(predicate))

const double = map(x => x * 2)
const getEvens = filter(x => x % 2 === 0)

const numbers = [1, 2, 3, 4, 5]
console.log(double(numbers)) // [2, 4, 6, 8, 10]
console.log(getEvens(numbers)) // [2, 4]
```

**3. Композиция функций:**
```javascript
const pipe = (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value)

const add = curry((a, b) => a + b)
const multiply = curry((a, b) => a * b)

const add5 = add(5)
const multiplyBy2 = multiply(2)

const transform = pipe(add5, multiplyBy2)
console.log(transform(10)) // (10 + 5) * 2 = 30
```

**4. Работа с событиями:**
```javascript
const handleEvent = curry((eventType, handler, event) => {
  if (event.type === eventType) {
    handler(event)
  }
})

const handleClick = handleEvent('click')
const handleClickWithLog = handleClick(console.log)

// Использование
element.addEventListener('click', handleClickWithLog)
```

**TypeScript версия:**

```typescript
function curry<T extends (...args: any[]) => any>(
  fn: T
): T extends (...args: infer P) => infer R
  ? P extends [infer First, ...infer Rest]
    ? Rest extends []
      ? T
      : (arg: First) => ReturnType<typeof curry<(...args: Rest) => R>>
    : T
  : never {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn.apply(this, args)
    } else {
      return (...nextArgs: any[]) => curried.apply(this, args.concat(nextArgs))
    }
  } as any
}

// Использование
const add = (a: number, b: number, c: number) => a + b + c
const curriedAdd = curry(add)

const add5 = curriedAdd(5) // (b: number) => (c: number) => number
const add5And10 = add5(10) // (c: number) => number
const result = add5And10(3) // number (18)
```

**Когда использовать каррирование:**

✅ **Используйте когда:**
- Нужно создавать специализированные функции из общих
- Работаете с функциональным программированием
- Нужна композиция функций
- Хотите улучшить переиспользование кода

❌ **Не используйте когда:**
- Функция принимает только один аргумент
- Нужна максимальная производительность (небольшой overhead)
- Код должен быть максимально простым и понятным для команды

**Сравнение с частичным применением:**

```javascript
// Каррирование - всегда по одному аргументу
const curried = (a) => (b) => (c) => a + b + c

// Частичное применение - может принимать несколько аргументов
const partial = (a, b) => (c) => a + b + c

// bind для частичного применения
const add = (a, b, c) => a + b + c
const add5And10 = add.bind(null, 5, 10)
console.log(add5And10(3)) // 18
```

**Итого:**
- Каррирование — мощная техника функционального программирования
- Позволяет создавать специализированные функции
- Улучшает композицию и переиспользование кода
- Использует замыкания для сохранения аргументов
- Может быть реализовано универсальной функцией `curry`

---
