# Шпаргалка: Вопросы для собеседования Frontend Developer

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

### 2. Разница между `let`, `const` и `var`?
- **var**: функциональная область видимости, поднимается (hoisting), можно переопределять
- **let**: блочная область видимости, можно переназначать, не поднимается
- **const**: блочная область видимости, нельзя переназначать, но можно изменять содержимое объектов/массивов

### 3. Что такое Promise и async/await?
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

### 4. Разница между `==` и `===`?
- `==` — нестрогое сравнение (с приведением типов)
- `===` — строгое сравнение (без приведения типов)

### 5. Что такое булевы операторы?
**Ответ:** Булевы операторы используются для выполнения логических операций и сравнений.

**Логические операторы:**
- `&&` (И) — возвращает первое falsy значение или последнее значение, если все truthy
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

### 6. Что такое деструктуризация?
Извлечение значений из массивов или объектов в отдельные переменные.

```javascript
const { name, age } = user;
const [first, second] = array;
```

### 7. Разница между `map`, `filter`, `reduce`?
- **map**: преобразует каждый элемент массива
- **filter**: возвращает новый массив с элементами, прошедшими проверку
- **reduce**: сводит массив к одному значению

### 8. Что такое hoisting?
Поднятие объявлений переменных и функций в начало области видимости перед выполнением кода.

### 9. Типы данных в JavaScript?
Примитивы: `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`
Объекты: `object`, `array`, `function`, `date`, и т.д.

### 10. Что такое Event Loop?
**Ответ:** Event Loop — механизм, который управляет выполнением асинхронного кода в JavaScript. JavaScript однопоточный, но Event Loop позволяет выполнять неблокирующие операции.

**Как работает:**
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

### 11. Как работает `this` в JavaScript?
**Ответ:** `this` — контекст выполнения функции, который определяется способом вызова функции.

**Правила определения `this`:**
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

### 12. Что такое прототипы и прототипное наследование?
**Ответ:** Прототипное наследование — механизм, при котором объекты могут наследовать свойства и методы от других объектов через цепочку прототипов.

**Ключевые концепции:**
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

### 13. Что такое constructor, class и prototype? Как они связаны?
**Ответ:** `constructor`, `class` и `prototype` — ключевые концепции JavaScript для создания объектов и наследования.

**Constructor (конструктор):**

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

### 14. Разница между `WeakMap`/`WeakSet` и `Map`/`Set`?
**Ответ:** `WeakMap` и `WeakSet` — коллекции с "слабыми" ссылками, которые не препятствуют сборке мусора.

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
      throw new TypeError('Age must be a number');
    }
    target[property] = value;
    return true;
  }
};

const person = new Proxy({}, validator);
person.age = 30; // OK
person.age = 'thirty'; // TypeError

// Reflect для метапрограммирования
const obj = { name: 'John' };
Reflect.has(obj, 'name'); // true
Reflect.get(obj, 'name'); // 'John'
Reflect.set(obj, 'age', 30); // true
```

### 16. Что такое итераторы и генераторы?
**Ответ:** Итераторы — объекты с методом `next()`, возвращающим `{value, done}`. Генераторы — функции, возвращающие итераторы через `yield`.

**Итераторы:**
```javascript
const iterable = {
  [Symbol.iterator]() {
    let count = 0;
    return {
      next() {
        if (count < 3) {
          return { value: count++, done: false };
        }
        return { done: true };
      }
    };
  }
};

for (const value of iterable) {
  console.log(value); // 0, 1, 2
}
```

**Генераторы:**
```javascript
function* numberGenerator() {
  yield 1;
  yield 2;
  yield 3;
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
const timerId = setInterval(() => {}, 1000);
clearInterval(timerId); // обязательно очистить

// 2. Удаление event listeners
const handler = () => {};
element.addEventListener('click', handler);
element.removeEventListener('click', handler);

// 3. Очистка в Vue компонентах
onUnmounted(() => {
  clearInterval(timerId);
  element.removeEventListener('click', handler);
});

// 4. Избегание глобальных переменных
(function() {
  const localVar = 'isolated';
})(); // переменная не доступна снаружи

// 5. WeakMap для временных данных
const cache = new WeakMap(); // автоматически очищается при удалении ключа
```

### 18. Продвинутые типы TypeScript: Conditional Types и Mapped Types?
**Ответ:** Продвинутые типы для создания гибких и переиспользуемых типовых определений.

**Conditional Types:**
```typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type ApiResponse<T> = T extends string
  ? { message: T }
  : T extends number
  ? { code: T }
  : { data: T };

// Infer в conditional types
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
```

**Mapped Types:**
```typescript
// Создание типа с опциональными полями
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Создание типа с readonly полями
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Кастомный mapped type
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Person = { name: string; age: number };
type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }
```

---

## Vue.js

### 19. Разница между Options API и Composition API?
- **Options API**: структура с `data`, `methods`, `computed`, `watch` (более простая для новичков)
- **Composition API**: использование `setup()` или `<script setup>`, более гибкая композиция логики, лучше для больших компонентов

### 20. Что такое реактивность в Vue 3?
**Ответ:** Реактивность — система автоматического отслеживания изменений данных и обновления DOM.

**Как работает в Vue 3:**
- Использует **Proxy API** (в отличие от Vue 2, где использовался Object.defineProperty)
- Proxy позволяет перехватывать операции чтения/записи свойств объектов
- При изменении данных автоматически обновляются все зависимые компоненты и вычисляемые свойства

**Преимущества Proxy над Object.defineProperty:**
- Работает с массивами (индексы, методы push/pop и т.д.)
- Работает с динамически добавляемыми свойствами
- Поддерживает вложенные объекты без рекурсивного обхода
- Более производительный

**Пример работы:**
```javascript
import { reactive, ref } from 'vue';

// reactive создает Proxy для объекта
const state = reactive({ count: 0 });
state.count++; // автоматически отслеживается

// ref оборачивает значение в объект с .value
const count = ref(0);
count.value++; // автоматически отслеживается
```

**Система отслеживания зависимостей:**
- При чтении реактивного свойства регистрируется зависимость
- При изменении свойства все зарегистрированные зависимости обновляются
- Используется паттерн Observer для связи данных и представления

**Детальное сравнение `reactive` и `ref`:**

**`reactive`:**
- Работает **только с объектами** (объекты, массивы, Map, Set)
- Возвращает **Proxy напрямую** — можно обращаться к свойствам без `.value`
- **Деструктуризация теряет реактивность** — нужно использовать `toRefs()`
- **Нельзя переназначить** весь объект (теряется реактивность)
- Подходит для **сложных объектов** с множеством свойств

```javascript
const state = reactive({
  name: 'John',
  age: 30,
  address: {
    city: 'Moscow',
    street: 'Main St'
  }
});

// Прямой доступ к свойствам
state.name = 'Jane'; // ✅ реактивно
state.address.city = 'SPB'; // ✅ реактивно

// Деструктуризация теряет реактивность
const { name, age } = state; // ❌ не реактивно!
name = 'Bob'; // не обновит state.name

// Правильная деструктуризация
import { toRefs } from 'vue';
const { name, age } = toRefs(state); // ✅ реактивно
name.value = 'Bob'; // обновит state.name

// Нельзя переназначить
state = { name: 'New' }; // ❌ потеря реактивности
```

**`ref`:**
- Работает с **любыми типами** (примитивы, объекты, массивы)
- Возвращает объект с свойством `.value` — нужно использовать `.value` для доступа
- **Сохраняет реактивность** при деструктуризации (если использовать `.value`)
- Можно **переназначить** через `.value`
- Подходит для **примитивов** и **простых случаев**

```javascript
// Примитивы
const count = ref(0);
count.value++; // ✅ реактивно

// Объекты
const user = ref({ name: 'John', age: 30 });
user.value.name = 'Jane'; // ✅ реактивно
user.value = { name: 'Bob', age: 25 }; // ✅ можно переназначить

// Массивы
const items = ref([1, 2, 3]);
items.value.push(4); // ✅ реактивно

// В template автоматически разворачивается
// <div>{{ count }}</div> - не нужно .value
```

**Когда использовать что:**

**Используйте `ref` когда:**
- Работаете с примитивами (string, number, boolean)
- Нужно переназначить значение целиком
- Работаете с простыми объектами
- Нужна совместимость с TypeScript (лучше типизация)

**Используйте `reactive` когда:**
- Работаете со сложными объектами с множеством свойств
- Не планируете переназначать объект целиком
- Хотите прямой доступ к свойствам без `.value`
- Работаете с Map, Set, массивами как основными структурами

**Практические примеры:**

```javascript
// ✅ ref для примитивов
const isLoading = ref(false);
const count = ref(0);

// ✅ reactive для сложных объектов состояния
const formState = reactive({
  name: '',
  email: '',
  errors: {}
});

// ✅ ref для объектов, которые могут быть переназначены
const currentUser = ref(null);
currentUser.value = await fetchUser(); // можно переназначить

// ✅ reactive для конфигурации (не меняется целиком)
const config = reactive({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
});
```

**Важные ограничения:**

```javascript
// reactive не работает с примитивами
const count = reactive(0); // ❌ ошибка!

// ref требует .value в JavaScript (но не в template)
const count = ref(0);
console.log(count.value); // ✅ в JS
// <div>{{ count }}</div> - ✅ в template автоматически

// Деструктуризация reactive теряет реактивность
const state = reactive({ x: 0, y: 0 });
const { x, y } = state; // ❌ не реактивно
const { x, y } = toRefs(state); // ✅ реактивно через toRefs
```

### 21. Разница между `ref` и `reactive`?
**Ответ:** Оба создают реактивные данные, но имеют разные области применения и ограничения.

**Ключевые различия:**

| Характеристика | `ref` | `reactive` |
|----------------|-------|------------|
| Типы данных | Любые (примитивы, объекты) | Только объекты |
| Доступ к значению | Через `.value` | Напрямую |
| Деструктуризация | Сохраняет реактивность | Теряет (нужен `toRefs`) |
| Переназначение | Можно через `.value` | Нельзя (теряется реактивность) |
| Template | Автоматически разворачивается | Работает напрямую |

**Рекомендации:**
- **`ref`** — для примитивов и случаев, когда нужно переназначить значение
- **`reactive`** — для сложных объектов, которые не будут переназначаться целиком

### 22. Жизненный цикл компонента Vue 3?
- `setup()` — создание компонента
- `onBeforeMount` — перед монтированием
- `onMounted` — после монтирования
- `onBeforeUpdate` — перед обновлением
- `onUpdated` — после обновления
- `onBeforeUnmount` — перед размонтированием
- `onUnmounted` — после размонтирования

### 23. Что такое computed и watch?
- **computed**: вычисляемое свойство, кэшируется, пересчитывается только при изменении зависимостей
- **watch**: наблюдает за изменениями и выполняет побочные эффекты

### 24. Как работает v-model?
Двустороннее связывание данных. Синтаксический сахар для `:value` + `@input`.

### 25. Что такое slots?
Механизм для передачи контента в компонент, позволяющий создавать переиспользуемые компоненты с гибкой структурой.

### 70. Что такое Teleport в Vue 3?
**Ответ:** `Teleport` — компонент для рендеринга содержимого в другом месте DOM дерева, вне текущего компонента.

**Зачем использовать:**
- Модальные окна (рендер вне основного контейнера)
- Тулы и подсказки
- Уведомления
- Избежание проблем с z-index и overflow

```vue
<template>
  <div>
    <button @click="showModal = true">Открыть модалку</button>

    <Teleport to="body">
      <div v-if="showModal" class="modal">
        <div class="modal-content">
          <h2>Модальное окно</h2>
          <button @click="showModal = false">Закрыть</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
```

### 71. Что такое Suspense в Vue 3?
**Ответ:** `Suspense` — компонент для обработки асинхронных зависимостей в дереве компонентов.

**Когда использовать Suspense:**

1. **Асинхронные компоненты** — компоненты, загружаемые динамически
2. **Асинхронные setup функции** — компоненты с async setup()
3. **Lazy loading компонентов** — отложенная загрузка тяжелых компонентов
4. **Асинхронные данные** — компоненты, которые загружают данные перед рендерингом
5. **Code splitting** — разделение кода на чанки

**Зачем использовать:**

- **Улучшение UX** — показывать состояние загрузки вместо пустого экрана
- **Упрощение кода** — не нужно вручную управлять состояниями loading/error
- **Централизованная обработка** — один fallback для всех асинхронных операций
- **Лучшая производительность** — компоненты загружаются по требованию

**Базовое использование:**

```vue
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <div>Загрузка...</div>
    </template>
  </Suspense>
</template>

<script setup>
import { defineAsyncComponent } from 'vue';

const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);
</script>
```

**Асинхронные setup функции:**

```vue
<!-- AsyncComponent.vue -->
<template>
  <div>
    <h1>{{ user.name }}</h1>
    <p>{{ user.email }}</p>
  </div>
</template>

<script setup>
// setup функция может быть async
const response = await fetch('/api/user');
const user = await response.json();
</script>

<!-- Родительский компонент -->
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <div class="loading">
        <Spinner />
        <p>Загрузка пользователя...</p>
      </div>
    </template>
  </Suspense>
</template>
```

**Обработка ошибок:**

```vue
<template>
  <Suspense @resolve="onResolve" @reject="onReject">
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>

  <ErrorBoundary v-if="hasError" :error="error" />
</template>

<script setup>
import { ref } from 'vue';
import ErrorBoundary from './ErrorBoundary.vue';

const hasError = ref(false);
const error = ref(null);

const onResolve = () => {
  hasError.value = false;
  error.value = null;
};

const onReject = (err) => {
  hasError.value = true;
  error.value = err;
};
</script>
```

**Вложенные Suspense:**

```vue
<template>
  <Suspense>
    <template #default>
      <Dashboard>
        <!-- Внутренний Suspense для отдельных секций -->
        <Suspense>
          <template #default>
            <UserProfile />
          </template>
          <template #fallback>
            <ProfileSkeleton />
          </template>
        </Suspense>

        <Suspense>
          <template #default>
            <RecentActivity />
          </template>
          <template #fallback>
            <ActivitySkeleton />
          </template>
        </Suspense>
      </Dashboard>
    </template>
    <template #fallback>
      <DashboardSkeleton />
    </template>
  </Suspense>
</template>
```

**Практические примеры использования:**

**Пример 1: Lazy loading маршрутов (Nuxt/Vue Router):**
```vue
<template>
  <RouterView v-slot="{ Component, route }">
    <Suspense>
      <template #default>
        <component :is="Component" :key="route.path" />
      </template>
      <template #fallback>
        <PageLoader />
      </template>
    </Suspense>
  </RouterView>
</template>
```

**Пример 2: Загрузка данных перед рендерингом:**
```vue
<!-- UserProfile.vue -->
<template>
  <div class="profile">
    <img :src="user.avatar" :alt="user.name" />
    <h2>{{ user.name }}</h2>
    <p>{{ user.bio }}</p>
    <UserStats :stats="stats" />
  </div>
</template>

<script setup>
import { useFetch } from '@/composables/useFetch';

// Данные загружаются до рендеринга
const { data: user } = await useFetch('/api/user');
const { data: stats } = await useFetch('/api/user/stats');
</script>

<!-- Родительский компонент -->
<template>
  <Suspense>
    <template #default>
      <UserProfile />
    </template>
    <template #fallback>
      <ProfileSkeleton />
    </template>
  </Suspense>
</template>
```

**Пример 3: Условная загрузка компонентов:**
```vue
<template>
  <Suspense>
    <template #default>
      <component :is="currentComponent" />
    </template>
    <template #fallback>
      <div>Загрузка компонента...</div>
    </template>
  </Suspense>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue';

const currentComponent = ref(null);

const loadComponent = async (name) => {
  currentComponent.value = defineAsyncComponent(() =>
    import(`./components/${name}.vue`)
  );
};

// Загружаем компонент по требованию
loadComponent('HeavyChart');
</script>
```

**Пример 4: Комбинация с composables:**
```vue
<!-- DataComponent.vue -->
<template>
  <div>
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useAsyncData } from '@/composables/useAsyncData';

// Composable возвращает Promise
const { title, items } = await useAsyncData();
</script>
```

**Преимущества Suspense:**

1. **Автоматическое управление состоянием** — не нужно вручную отслеживать loading
2. **Лучший UX** — пользователь видит fallback вместо пустого экрана
3. **Простота кода** — меньше boilerplate кода для обработки асинхронности
4. **Централизованная обработка** — один fallback для всех асинхронных операций
5. **Поддержка вложенности** — можно создавать сложные иерархии загрузки

**Ограничения и когда НЕ использовать:**

**Не используйте Suspense когда:**

1. **Простая условная загрузка** — используйте `v-if` с флагом loading
```vue
<!-- Простой случай - Suspense избыточен -->
<template>
  <div v-if="loading">Загрузка...</div>
  <Component v-else />
</template>
```

2. **Небольшие компоненты** — для легких компонентов overhead не оправдан
3. **Синхронные операции** — Suspense только для асинхронных операций
4. **Когда нужен полный контроль** — если нужна детальная обработка ошибок на каждом шаге

**Альтернативы Suspense:**

```vue
<!-- Ручное управление состоянием -->
<template>
  <div v-if="loading">Загрузка...</div>
  <div v-else-if="error">Ошибка: {{ error }}</div>
  <Component v-else :data="data" />
</template>

<script setup>
import { ref, onMounted } from 'vue';

const loading = ref(true);
const error = ref(null);
const data = ref(null);

onMounted(async () => {
  try {
    const response = await fetch('/api/data');
    data.value = await response.json();
  } catch (e) {
    error.value = e;
  } finally {
    loading.value = false;
  }
});
</script>
```

**Лучшие практики:**

1. **Используйте осмысленные fallback** — показывайте скелетоны или спиннеры
2. **Обрабатывайте ошибки** — используйте `@reject` или ErrorBoundary
3. **Оптимизируйте загрузку** — используйте prefetch для критичных компонентов
4. **Избегайте глубокой вложенности** — максимум 2-3 уровня Suspense
5. **Используйте с code splitting** — комбинируйте с динамическими импортами

**Пример с оптимизацией:**

```vue
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <!-- Скелетон, похожий на финальный контент -->
      <div class="skeleton">
        <div class="skeleton-header"></div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    </template>
  </Suspense>
</template>

<script setup>
import { defineAsyncComponent } from 'vue';

// Prefetch для критичных компонентов
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: SkeletonLoader,
  errorComponent: ErrorComponent,
  delay: 200, // Задержка перед показом loading
  timeout: 3000 // Таймаут для ошибки
});
</script>
```

**Итоговые рекомендации:**

✅ **Используйте Suspense для:**
- Тяжелых компонентов с lazy loading
- Компонентов с async setup
- Страниц/секций с асинхронными данными
- Code splitting стратегий

❌ **Не используйте Suspense для:**
- Простых условных рендерингов
- Легких синхронных компонентов
- Когда нужен полный контроль над состоянием
- Когда fallback не улучшает UX

### 72. Что такое keep-alive и когда использовать?
**Ответ:** `keep-alive` — встроенный компонент для кэширования неактивных компонентов, сохраняя их состояние.

**Когда использовать:**
- Табы с переключением между компонентами
- Списки с детальной информацией
- Формы, которые нужно сохранить при навигации

```vue
<template>
  <KeepAlive :include="['TabA', 'TabB']" :max="10">
    <component :is="currentTab" />
  </KeepAlive>
</template>

<script setup>
import { ref } from 'vue';
import TabA from './TabA.vue';
import TabB from './TabB.vue';

const currentTab = ref('TabA');
</script>
```

**Хуки жизненного цикла:**
- `onActivated` — вызывается при активации
- `onDeactivated` — вызывается при деактивации

### 83. Продвинутое использование Provide/Inject?
**Ответ:** `provide`/`inject` — механизм для передачи данных через несколько уровней компонентов без prop drilling.

**Продвинутые паттерны:**
```vue
<!-- Родительский компонент -->
<script setup>
import { provide, ref, readonly } from 'vue';

const theme = ref('dark');
const updateTheme = (newTheme) => {
  theme.value = newTheme;
};

// Предоставление реактивных данных и методов
provide('theme', readonly(theme)); // readonly для безопасности
provide('updateTheme', updateTheme);

// Symbol для избежания конфликтов
const ThemeKey = Symbol('theme');
provide(ThemeKey, theme);
</script>

<!-- Дочерний компонент (любой уровень вложенности) -->
<script setup>
import { inject } from 'vue';

const theme = inject('theme', 'light'); // 'light' - значение по умолчанию
const updateTheme = inject('updateTheme');

// С Symbol
const ThemeKey = Symbol('theme');
const theme = inject(ThemeKey);
</script>
```

### 80. Оптимизация рендеринга в Vue 3?
**Ответ:** Vue 3 предоставляет несколько директив и API для оптимизации производительности рендеринга.

**Директивы оптимизации:**
```vue
<template>
  <!-- v-once - рендерится один раз -->
  <div v-once>{{ expensiveComputation() }}</div>

  <!-- v-memo - кэширование поддерева -->
  <div v-memo="[user.id, user.name]">
    <ExpensiveComponent :user="user" />
  </div>
</template>

<script setup>
import { shallowRef, shallowReactive } from 'vue';

// shallowRef - реактивность только для .value
const state = shallowRef({ nested: { data: 'value' } });
state.value.nested.data = 'new'; // НЕ реактивно!

// shallowReactive - реактивность только на первом уровне
const obj = shallowReactive({ nested: { data: 'value' } });
obj.nested.data = 'new'; // НЕ реактивно!
</script>
```

### 81. State Management: Pinia vs Vuex?
**Ответ:** Оба решения для управления состоянием, но Pinia — рекомендуемый подход для Vue 3.

**Pinia преимущества:**
- TypeScript поддержка из коробки
- Более простая API
- Модульность без модулей
- DevTools поддержка
- Нет мутаций, только actions

```typescript
// Pinia store
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: ''
  }),

  getters: {
    fullInfo: (state) => `${state.name} (${state.email})`
  },

  actions: {
    async fetchUser() {
      const user = await api.getUser();
      this.name = user.name;
      this.email = user.email;
    }
  }
});

// Использование
const userStore = useUserStore();
userStore.fetchUser();
```

### 82. Лучшие практики создания Composables?
**Ответ:** Composables — переиспользуемые функции для композиции логики в Vue 3.

**Лучшие практики:**

1. **Именование с префиксом `use`**
```typescript
// ✅ Правильно
export function useCounter() { }
export function useAuth() { }

// ❌ Неправильно
export function counter() { }
export function auth() { }
```

2. **Возврат объекта с реактивными значениями**
```typescript
import { ref, computed } from 'vue';

export function useCounter(initial = 0) {
  const count = ref(initial);
  const double = computed(() => count.value * 2);

  const increment = () => count.value++;
  const decrement = () => count.value--;

  return {
    count,
    double,
    increment,
    decrement
  };
}
```

3. **Очистка ресурсов в onUnmounted**
```typescript
import { onUnmounted } from 'vue';

export function useEventListener(target, event, handler) {
  target.addEventListener(event, handler);

  onUnmounted(() => {
    target.removeEventListener(event, handler);
  });
}
```

4. **Использование TypeScript**
```typescript
export function useFetch<T>(url: string) {
  const data = ref<T | null>(null);
  const error = ref<Error | null>(null);
  const loading = ref(false);

  // ...

  return { data, error, loading };
}
```

---

## Nuxt.js

### 26. Что такое Nuxt.js и его основные возможности?
**Ответ:** Nuxt.js — фреймворк на основе Vue.js для создания универсальных веб-приложений с SSR, SSG и SPA режимами.

**Основные возможности:**
- ✅ Server-Side Rendering (SSR)
- ✅ Static Site Generation (SSG)
- ✅ Single Page Application (SPA)
- ✅ Автоматический code splitting
- ✅ Auto-imports компонентов и composables
- ✅ File-based routing
- ✅ Server routes (API routes)
- ✅ Middleware для аутентификации и логики
- ✅ Плагины для расширения функциональности
- ✅ SEO оптимизация из коробки

**Режимы работы:**
```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,  // SSR режим (по умолчанию)
  // ssr: false, // SPA режим
  // nitro: { prerender: { routes: ['/'] } } // SSG режим
});
```

### 27. Что такое SSR и SSG? Разница и когда использовать?
**Ответ:** SSR и SSG — разные стратегии рендеринга приложений.

**SSR (Server-Side Rendering):**
- Рендеринг HTML на сервере при каждом запросе
- Контент всегда актуальный
- Требует Node.js сервер
- Медленнее для статического контента

**SSG (Static Site Generation):**
- Предварительный рендеринг на этапе сборки
- Генерирует статические HTML файлы
- Быстрая загрузка (CDN)
- Контент фиксирован на момент сборки

**ISR (Incremental Static Regeneration) — гибридный подход:**
```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true, // Автоматически находит все ссылки
      interval: 3600 // Регенерация каждые 3600 секунд
    }
  }
});
```

**Когда использовать SSR:**
- Контент часто меняется
- Нужна персонализация для каждого пользователя
- Динамические данные из БД
- SEO важно, но контент персональный

**Когда использовать SSG:**
- Статический контент (блог, документация)
- Максимальная производительность
- Хостинг на CDN
- Контент редко меняется

**Примеры:**
```vue
<!-- SSR: данные загружаются на сервере при каждом запросе -->
<script setup>
const { data } = await useFetch('/api/posts');
</script>

<!-- SSG: данные загружаются на этапе сборки -->
<script setup>
const { data } = await useFetch('/api/posts', {
  server: false // Только на клиенте
});
</script>
```

### 28. Разница между `useFetch` и `useAsyncData`?
**Ответ:** Оба composables для загрузки данных, но `useFetch` — упрощенная версия для API запросов.

**useFetch — для API запросов:**
```vue
<script setup>
// Автоматически парсит JSON, обрабатывает ошибки
const { data, pending, error, refresh } = await useFetch('/api/users');

// С опциями
const { data: posts } = await useFetch('/api/posts', {
  method: 'POST',
  body: { userId: 1 },
  headers: { 'Authorization': 'Bearer token' },
  query: { page: 1 },
  lazy: true, // Не блокирует рендеринг
  server: true, // Выполняется на сервере
  default: () => [], // Значение по умолчанию
  transform: (data) => data.items, // Трансформация данных
  watch: [userId], // Перезагрузка при изменении
  immediate: true // Загрузить сразу
});
</script>
```

**useAsyncData — для любых асинхронных операций:**
```vue
<script setup>
// Более гибкий, для любых async операций
const { data, pending, error, refresh } = await useAsyncData(
  'users', // Уникальный ключ для кэширования
  () => $fetch('/api/users'),
  {
    server: true,
    default: () => [],
    transform: (data) => data.items
  }
);

// Можно использовать с любыми Promise
const { data: result } = await useAsyncData(
  'computation',
  async () => {
    // Любая асинхронная операция
    const data = await fetchData();
    const processed = await processData(data);
    return processed;
  }
);

// С внешними библиотеками
const { data: fileContent } = await useAsyncData(
  'file',
  () => fs.promises.readFile('file.txt', 'utf-8')
);
</script>
```

**Ключевые различия:**

| Характеристика | `useFetch` | `useAsyncData` |
|----------------|------------|----------------|
| Назначение | API запросы | Любые async операции |
| URL | Прямо в первом параметре | В функции |
| Ключ кэша | Автоматический (URL) | Указывается вручную |
| Парсинг JSON | Автоматический | Вручную |
| Гибкость | Меньше | Больше |

**Практические примеры:**

**useFetch для простых API запросов:**
```vue
<script setup>
// Простой GET запрос
const { data: users } = await useFetch('/api/users');

// POST запрос
const { data: newUser } = await useFetch('/api/users', {
  method: 'POST',
  body: { name: 'John', email: 'john@example.com' }
});

// С query параметрами
const { data: posts } = await useFetch('/api/posts', {
  query: { page: 1, limit: 10 }
});
</script>
```

**useAsyncData для сложной логики:**
```vue
<script setup>
// Комплексная логика загрузки данных
const { data: dashboard } = await useAsyncData(
  'dashboard',
  async () => {
    const [users, posts, stats] = await Promise.all([
      $fetch('/api/users'),
      $fetch('/api/posts'),
      $fetch('/api/stats')
    ]);

    return {
      users,
      posts,
      stats,
      total: users.length + posts.length
    };
  }
);
</script>
```

### 29. Что такое middleware в Nuxt?
**Ответ:** Middleware — функции, выполняемые перед рендерингом страницы или компонента.

**Типы middleware:**

**1. Route Middleware (для страниц):**
```javascript
// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUser();

  if (!user.value && to.path !== '/login') {
    return navigateTo('/login');
  }
});

// Использование в странице
// pages/dashboard.vue
<script setup>
definePageMeta({
  middleware: 'auth'
});
</script>
```

**2. Global Middleware:**
```javascript
// middleware/global.js (добавляется .global в имя файла)
export default defineNuxtRouteMiddleware((to, from) => {
  // Выполняется на каждой странице
  console.log('Global middleware');
});
```

**3. Inline Middleware:**
```vue
<!-- pages/profile.vue -->
<script setup>
definePageMeta({
  middleware: (to, from) => {
    // Inline middleware
    if (!isAuthenticated()) {
      return navigateTo('/login');
    }
  }
});
</script>
```

**Практические примеры:**

**Аутентификация:**
```javascript
// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
  const { $auth } = useNuxtApp();

  if (!$auth.loggedIn) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  }
});
```

**Проверка ролей:**
```javascript
// middleware/admin.js
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUser();

  if (user.value?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Access denied'
    });
  }
});
```

**Логирование:**
```javascript
// middleware/analytics.global.js
export default defineNuxtRouteMiddleware((to, from) => {
  // Отправка аналитики
  if (process.client) {
    $fetch('/api/analytics', {
      method: 'POST',
      body: {
        path: to.path,
        timestamp: Date.now()
      }
    });
  }
});
```

**Порядок выполнения:**
1. Global middleware
2. Layout middleware
3. Page middleware

### 30. Auto-imports в Nuxt?
**Ответ:** Nuxt автоматически импортирует компоненты, composables и утилиты без явного `import`.

**Что импортируется автоматически:**

**1. Компоненты:**
```vue
<!-- Компоненты из components/ автоматически доступны -->
<template>
  <!-- Не нужно импортировать -->
  <UserCard :user="user" />
  <Button @click="handleClick">Click</button>
</template>

<!-- Nuxt ищет компоненты в:
- components/
- node_modules/@nuxt/ui/src/runtime/components/
-->
```

**2. Composables:**
```vue
<script setup>
// Все composables из composables/ доступны автоматически
const user = useUser();
const { data } = useFetch('/api/data');

// Nuxt composables тоже доступны
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
</script>
```

**3. Утилиты:**
```javascript
// Утилиты из utils/ доступны автоматически
const formattedDate = formatDate(new Date());
const debouncedFn = debounce(() => {}, 300);
```

**Настройка auto-imports:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  components: [
    {
      path: '~/components',
      pathPrefix: false, // Не требовать префиксы
    }
  ],

  imports: {
    dirs: [
      'composables',
      'composables/**',
      'utils'
    ]
  }
});
```

**Именование компонентов:**
```bash
components/
  UserCard.vue          # <UserCard />
  user/
    Profile.vue        # <UserProfile />
    Settings.vue       # <UserSettings />
  admin/
    Dashboard.vue      # <AdminDashboard />
```

**Отключение auto-import:**
```vue
<script setup>
// Если нужно явно импортировать
import { UserCard } from '@/components/UserCard.vue';
</script>
```

### 31. Что такое plugins в Nuxt?
**Ответ:** Plugins — функции, выполняемые при инициализации приложения для расширения функциональности.

**Типы plugins:**

**1. Client-side plugins:**
```javascript
// plugins/analytics.client.js
export default defineNuxtPlugin((nuxtApp) => {
  // Выполняется только на клиенте
  nuxtApp.provide('analytics', {
    track(event, data) {
      console.log('Track:', event, data);
    }
  });
});

// Использование
const { $analytics } = useNuxtApp();
$analytics.track('page_view');
```

**2. Server-side plugins:**
```javascript
// plugins/database.server.ts
import { createConnection } from './db';

export default defineNuxtPlugin(async (nuxtApp) => {
  // Выполняется только на сервере
  const db = await createConnection();

  nuxtApp.provide('db', db);
});
```

**3. Universal plugins:**
```javascript
// plugins/i18n.js (без .client или .server)
export default defineNuxtPlugin((nuxtApp) => {
  // Выполняется и на сервере, и на клиенте
  const i18n = createI18n();

  nuxtApp.vueApp.use(i18n);
});
```

**Порядок выполнения:**
```javascript
// plugins/1.first.js - выполнится первым
// plugins/2.second.js - выполнится вторым
// plugins/third.js - выполнится последним
```

**Практические примеры:**

**Инициализация библиотек:**
```javascript
// plugins/vue-toastification.client.js
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, {
    position: 'top-right',
    timeout: 3000
  });
});
```

**Глобальные свойства:**
```javascript
// plugins/currency.js
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('formatCurrency', (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  });
});

// Использование
const { $formatCurrency } = useNuxtApp();
const price = $formatCurrency(1000); // 1 000 ₽
```

### 32. Что такое layouts в Nuxt?
**Ответ:** Layouts — обертки для страниц, позволяющие переиспользовать общую структуру.

**Использование layouts:**
```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <Header />
    <main>
      <slot /> <!-- Контент страницы -->
    </main>
    <Footer />
  </div>
</template>

<!-- layouts/admin.vue -->
<template>
  <div class="admin-layout">
    <AdminSidebar />
    <div class="admin-content">
      <slot />
    </div>
  </div>
</template>
```

**Применение layout на странице:**
```vue
<!-- pages/dashboard.vue -->
<script setup>
definePageMeta({
  layout: 'admin'
});
</script>

<template>
  <div>Dashboard content</div>
</template>
```

**Динамический layout:**
```vue
<script setup>
const route = useRoute();
const layout = computed(() => route.meta.layout || 'default');
</script>

<template>
  <NuxtLayout :name="layout">
    <NuxtPage />
  </NuxtLayout>
</template>
```

### 33. Что такое server routes (API routes) в Nuxt?
**Ответ:** Server routes — API endpoints, выполняющиеся на сервере Nuxt.

**Создание API routes:**
```typescript
// server/api/users/index.get.ts
export default defineEventHandler(async (event) => {
  const users = await getUsersFromDB();
  return users;
});

// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await getUserFromDB(id);
  return user;
});

// server/api/users/index.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const newUser = await createUser(body);
  return newUser;
});
```

**Использование в компонентах:**
```vue
<script setup>
// Автоматически доступен на /api/users
const { data: users } = await useFetch('/api/users');
</script>
```

**Обработка ошибок:**
```typescript
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required'
    });
  }

  const user = await getUserFromDB(id);

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    });
  }

  return user;
});
```

### 34. Что такое composables в Nuxt?
**Ответ:** Composables — переиспользуемые функции с состоянием, автоматически импортируемые.

**Создание composable:**
```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const user = useState('user', () => null);
  const isAuthenticated = computed(() => !!user.value);

  const login = async (email: string, password: string) => {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    user.value = response.user;
  };

  const logout = () => {
    user.value = null;
    navigateTo('/login');
  };

  return {
    user: readonly(user),
    isAuthenticated,
    login,
    logout
  };
};
```

**Использование:**
```vue
<script setup>
// Автоматически импортируется
const { user, isAuthenticated, login, logout } = useAuth();
</script>
```

### 35. Что такое useState и useCookie?
**Ответ:** Reactivity утилиты для управления состоянием в Nuxt.

**useState — реактивное состояние:**
```vue
<script setup>
// Состояние, сохраняемое между сервером и клиентом
const count = useState('counter', () => 0);

// С начальным значением
const user = useState('user', () => ({ name: 'Guest' }));

// Использование
count.value++;
</script>
```

**useCookie — работа с cookies:**
```vue
<script setup>
const token = useCookie('auth-token', {
  maxAge: 60 * 60 * 24 * 7, // 7 дней
  secure: true,
  sameSite: 'strict'
});

// Установка
token.value = 'abc123';

// Чтение
console.log(token.value);
</script>
```

### 36. Что такое error handling в Nuxt?
**Ответ:** Обработка ошибок через специальные страницы и composables.

**Error pages:**
```vue
<!-- error.vue -->
<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    <button @click="handleError">Go Home</button>
  </div>
</template>

<script setup>
const props = defineProps({
  error: Object
});

const handleError = () => clearError({ redirect: '/' });
</script>
```

**Обработка ошибок в composables:**
```vue
<script setup>
try {
  const { data } = await useFetch('/api/data');
} catch (error) {
  throw createError({
    statusCode: 500,
    message: 'Failed to load data'
  });
}
</script>
```

### 37. Что такое hydration в Nuxt?
**Ответ:** Hydration — процесс "оживления" статического HTML на клиенте.

**Как работает:**
1. Сервер рендерит HTML
2. HTML отправляется клиенту
3. Vue "оживляет" статический HTML
4. Добавляется реактивность и интерактивность

**Проблемы hydration:**
```vue
<!-- ❌ Плохо: разный контент на сервере и клиенте -->
<template>
  <div>{{ new Date().toString() }}</div>
</template>

<!-- ✅ Хорошо: используйте ClientOnly -->
<template>
  <ClientOnly>
    <div>{{ new Date().toString() }}</div>
  </ClientOnly>
</template>
```

### 38. Оптимизация производительности в Nuxt?
**Ответ:** Стратегии для улучшения производительности приложения.

**1. Code Splitting:**
```javascript
// Автоматический code splitting по маршрутам
// Каждая страница — отдельный chunk
```

**2. Lazy Loading компонентов:**
```vue
<script setup>
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);
</script>
```

**3. Prefetching:**
```vue
<template>
  <NuxtLink to="/about" prefetch>About</NuxtLink>
</template>
```

**4. Image optimization:**
```vue
<template>
  <NuxtImg src="/image.jpg" loading="lazy" />
</template>
```

**5. Кэширование:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { isr: 3600 }
  }
});
```

---

## TypeScript

### 39. Что такое TypeScript?
**Ответ:** TypeScript — надмножество JavaScript, добавляющее статическую типизацию. Компилируется в JavaScript и помогает выявлять ошибки на этапе разработки.

**Преимущества:**
- Статическая типизация для раннего обнаружения ошибок
- Улучшенная поддержка IDE (автодополнение, рефакторинг)
- Лучшая документация кода через типы
- Поддержка современных возможностей ES6+

### 40. Разница между `type` и `interface`?
**Ответ:** Оба используются для определения типов объектов, но есть различия:

**interface:**
- Может быть расширена (`extends`)
- Может быть объявлена повторно (объединение)
- Работает только с объектными типами
- Поддерживает declaration merging

**type:**
- Более гибкий (может описывать примитивы, union, intersection)
- Не поддерживает declaration merging
- Может использовать mapped types и условные типы

```typescript
// interface
interface User {
  name: string;
}
interface User {
  age: number; // объединяется с предыдущим
}

// type
type User = {
  name: string;
  age: number;
}

// type может создавать union types
type Status = 'active' | 'inactive' | 'pending';
```

### 41. Что такое generics (обобщенные типы)?
**Ответ:** Generics позволяют создавать переиспользуемые компоненты, работающие с разными типами данных.

```typescript
function identity<T>(arg: T): T {
  return arg;
}

const num = identity<number>(42);
const str = identity<string>('hello');

// Можно использовать с интерфейсами и классами
interface Container<T> {
  value: T;
}

const container: Container<number> = { value: 42 };
```

### 42. Что такое union и intersection types?
**Union types (`|`)** — значение может быть одного из нескольких типов:
```typescript
type StringOrNumber = string | number;
const value: StringOrNumber = 'hello'; // или 42
```

**Intersection types (`&`)** — значение должно соответствовать всем типам одновременно:
```typescript
type Person = { name: string };
type Employee = { id: number };
type PersonEmployee = Person & Employee; // { name: string, id: number }
```

### 43. Что такое utility types?
Встроенные типы для преобразования существующих типов:

- `Partial<T>` — делает все свойства опциональными
- `Required<T>` — делает все свойства обязательными
- `Readonly<T>` — делает все свойства только для чтения
- `Pick<T, K>` — выбирает определенные свойства
- `Omit<T, K>` — исключает определенные свойства
- `Record<K, T>` — создает объект с ключами типа K и значениями типа T

```typescript
type User = {
  id: number;
  name: string;
  email: string;
}

type PartialUser = Partial<User>; // все свойства опциональны
type UserPreview = Pick<User, 'id' | 'name'>; // только id и name
type UserWithoutEmail = Omit<User, 'email'>; // без email
```

### 44. Что такое type guards?
Функции, которые проверяют тип во время выполнения и сужают тип в TypeScript:

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(value: string | number) {
  if (isString(value)) {
    // TypeScript знает, что value - string
    console.log(value.toUpperCase());
  } else {
    // TypeScript знает, что value - number
    console.log(value.toFixed(2));
  }
}
```

### 45. Что такое декораторы (decorators)?
Специальный синтаксис для метапрограммирования, позволяющий добавлять метаданные к классам, методам, свойствам:

```typescript
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with`, args);
    return original.apply(this, args);
  };
}

class Calculator {
  @Log
  add(a: number, b: number) {
    return a + b;
  }
}
```

### 46. Что такое enum и когда использовать?
**enum** — способ определения набора именованных констант:

```typescript
enum Status {
  Pending = 'pending',
  Active = 'active',
  Inactive = 'inactive'
}

// Числовые enum
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}
```

**Когда использовать:**
- Когда нужен набор фиксированных значений
- Когда значения могут использоваться в разных местах кода
- Альтернатива: использовать const objects или union types

### 47. Что такое namespace и module?
**namespace** — способ организации кода в глобальной области видимости:
```typescript
namespace Utils {
  export function formatDate(date: Date): string {
    return date.toISOString();
  }
}
```

**module** — стандартный способ организации кода через ES modules:
```typescript
// file.ts
export function formatDate(date: Date): string {
  return date.toISOString();
}

// Использование
import { formatDate } from './file';
```

**Рекомендация:** Использовать ES modules вместо namespace.

### 48. Что такое type assertion и когда использовать?
Приведение типа, когда разработчик знает больше о типе, чем TypeScript:

```typescript
const value: unknown = 'hello';
const str = value as string; // type assertion
const str2 = <string>value; // альтернативный синтаксис

// Более безопасный способ - type guard
if (typeof value === 'string') {
  const str = value; // автоматическое сужение типа
}
```

**Когда использовать:**
- При работе с DOM API
- При работе с библиотеками без типов
- Когда точно знаете тип, но TypeScript не может его вывести

---

## Микрофронтенды

### 49. Что такое микрофронтенды?
**Ответ:** Архитектурный подход, при котором фронтенд-приложение разбивается на независимые, автономные приложения (микрофронтенды), которые могут разрабатываться, тестироваться и развертываться отдельно.

**Ключевые принципы:**
- Независимость команд и технологий
- Автономность развертывания
- Изоляция кода и стилей
- Единый пользовательский интерфейс

### 50. Преимущества и недостатки микрофронтендов?
**Преимущества:**
- Независимая разработка и развертывание
- Масштабируемость команд
- Технологическая гибкость (разные фреймворки)
- Изоляция ошибок (падение одного микрофронтенда не ломает все приложение)
- Переиспользование кода между командами

**Недостатки:**
- Увеличенная сложность архитектуры
- Дублирование зависимостей
- Проблемы с версионированием общих библиотек
- Сложность отладки и мониторинга
- Увеличенный размер бандла
- Проблемы с SEO (для некоторых подходов)

### 51. Основные подходы к реализации микрофронтендов?
**1. Module Federation (Webpack 5)**
- Обмен модулями между приложениями во время выполнения
- Динамическая загрузка удаленных модулей
- Поддержка разных версий зависимостей

**2. Single-SPA**
- Мета-фреймворк для объединения нескольких SPA
- Роутинг на уровне приложения
- Поддержка разных фреймворков

**3. qiankun (Alibaba)**
- Решение на основе Single-SPA
- Изоляция стилей через Shadow DOM
- Простота интеграции

**4. iframe**
- Простая изоляция через iframe
- Проблемы с производительностью и UX
- Сложности с коммуникацией

**5. Web Components**
- Нативные веб-стандарты
- Полная изоляция стилей и логики
- Хорошая поддержка браузерами

### 52. Что такое Module Federation?
**Ответ:** Функция Webpack 5, позволяющая приложению загружать код из другого приложения во время выполнения.

**Концепции:**
- **Host** — основное приложение, которое загружает удаленные модули
- **Remote** — приложение, которое предоставляет модули
- **Shared** — общие зависимости между приложениями

```javascript
// webpack.config.js (Host)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        remoteApp: 'remote@http://localhost:3001/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};

// Использование в коде
const RemoteComponent = React.lazy(() => import('remoteApp/Component'));
```

### 53. Как организовать коммуникацию между микрофронтендами?
**1. Custom Events**
```javascript
// Отправка события
window.dispatchEvent(new CustomEvent('user-updated', {
  detail: { userId: 123 }
}));

// Подписка на событие
window.addEventListener('user-updated', (event) => {
  console.log(event.detail);
});
```

**2. Shared State (Redux, Zustand)**
- Общее хранилище состояния
- Паттерн Event Bus

**3. URL/Query Parameters**
- Передача данных через URL
- Простой способ для передачи простых данных

**4. PostMessage API (для iframe)**
```javascript
// Отправка сообщения
window.parent.postMessage({ type: 'UPDATE', data: {} }, '*');

// Получение сообщения
window.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE') {
    // обработка
  }
});
```

**5. Props через Module Federation**
- Передача данных через пропсы компонентов

### 54. Проблемы с микрофронтендами и их решения?
**1. Изоляция стилей**
- **Проблема:** Конфликты CSS между микрофронтендами
- **Решения:** CSS Modules, Shadow DOM, BEM, префиксы классов

**2. Версионирование зависимостей**
- **Проблема:** Разные версии одной библиотеки
- **Решения:** Shared dependencies в Module Federation, семантическое версионирование

**3. Производительность**
- **Проблема:** Увеличенный размер бандла, дублирование кода
- **Решения:** Code splitting, lazy loading, shared dependencies

**4. Роутинг**
- **Проблема:** Координация маршрутов между приложениями
- **Решения:** Единый роутер, hash-based routing, history API

**5. Тестирование**
- **Проблема:** Сложность интеграционного тестирования
- **Решения:** Contract testing, E2E тесты, изолированное тестирование

**6. Мониторинг и отладка**
- **Проблема:** Отслеживание ошибок в разных приложениях
- **Решения:** Единая система логирования, distributed tracing, error boundaries

---

## CSS / Styling

### 55. Что такое CSS Grid и Flexbox?
- **Flexbox**: одномерная раскладка (строка или колонка)
- **Grid**: двумерная раскладка (строки и колонки одновременно)

### 56. Что такое BEM?
Блок-Элемент-Модификатор — методология именования CSS классов:
```css
.block__element--modifier
```

### 55. Разница между `margin` и `padding`?
- **margin**: внешний отступ (вне элемента)
- **padding**: внутренний отступ (внутри элемента)

### 57. Что такое CSS переменные?
Пользовательские свойства для хранения значений, которые можно переиспользовать:
```css
:root {
  --primary-color: #007bff;
}
.element {
  color: var(--primary-color);
}
```

---

## Web Performance

### 58. Что такое Web Vitals?
Метрики производительности:
- **LCP (Largest Contentful Paint)**: время загрузки основного контента
- **FID (First Input Delay)**: задержка первого взаимодействия
- **CLS (Cumulative Layout Shift)**: стабильность визуального контента

### 59. Как оптимизировать загрузку изображений?
- Использовать современные форматы (WebP, AVIF)
- Lazy loading
- Responsive images (`srcset`, `sizes`)
- Оптимизация размера файлов

### 60. Что такое code splitting?
Разделение кода на более мелкие части, загружаемые по требованию для уменьшения начального размера бандла.

---

## HTTP / API

### 61. Разница между GET и POST?
- **GET**: получение данных, параметры в URL, кэшируется
- **POST**: отправка данных, данные в теле запроса, не кэшируется

### 62. Что такое CORS?
Cross-Origin Resource Sharing — механизм для разрешения запросов между разными доменами.

### 63. Разница между REST и GraphQL?
- **REST**: архитектурный стиль с фиксированными endpoints
- **GraphQL**: язык запросов, один endpoint, клиент запрашивает нужные поля

---

## Общие вопросы

### 64. Что такое SPA (Single Page Application)?
Веб-приложение, которое загружает одну HTML-страницу и динамически обновляет контент без перезагрузки.

### 65. Что такое Virtual DOM?
Абстракция реального DOM в памяти, позволяет эффективно обновлять только измененные части.

### 66. Разница между `null` и `undefined`?
- **null**: явно установленное пустое значение
- **undefined**: переменная объявлена, но значение не присвоено

### 74. Что такое debounce и throttle?
- **debounce**: выполнение функции после паузы в действиях
- **throttle**: выполнение функции не чаще определенного интервала

### 75. Что такое мемоизация?
Кэширование результатов выполнения функции для избежания повторных вычислений.

### 76. Разница между `forEach` и `map`?
- **forEach**: выполняет функцию для каждого элемента, возвращает `undefined`
- **map**: возвращает новый массив с результатами преобразования

---

## Практические задачи

### 67. Реализовать debounce функцию
```javascript
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
```

### 68. Найти уникальные значения в массиве
```javascript
const unique = [...new Set(array)];
// или
const unique = array.filter((item, index) => array.indexOf(item) === index);
```

### 69. Глубокое копирование объекта
```javascript
const deepCopy = JSON.parse(JSON.stringify(obj));
// или
const deepCopy = structuredClone(obj); // современный способ
```

---

## Архитектура и паттерны

### 91. SOLID принципы во фронтенде?
**Ответ:** SOLID — принципы объектно-ориентированного программирования, применимые и во фронтенде.

**S - Single Responsibility (Единственная ответственность):**
```typescript
// Плохо: компонент делает слишком много
// Хорошо: разделение на компоненты
const UserCard = () => { /* отображение */ };
const UserActions = () => { /* действия */ };
const UserForm = () => { /* форма */ };
```

**O - Open/Closed (Открыт для расширения, закрыт для модификации):**
```typescript
// Расширение через композицию, а не модификацию
interface Validator {
  validate(value: string): boolean;
}

class EmailValidator implements Validator { /* ... */ }
class PhoneValidator implements Validator { /* ... */ }
```

**L - Liskov Substitution (Подстановка Лисков):**
```typescript
// Подклассы должны заменять базовые классы без изменения поведения
class BaseButton { /* ... */ }
class PrimaryButton extends BaseButton { /* ... */ }
```

**I - Interface Segregation (Разделение интерфейсов):**
```typescript
// Много маленьких интерфейсов лучше одного большого
interface Readable { read(): void; }
interface Writable { write(): void; }
```

**D - Dependency Inversion (Инверсия зависимостей):**
```typescript
// Зависимость от абстракций, а не конкретных реализаций
interface ApiClient {
  fetch(url: string): Promise<any>;
}

class Component {
  constructor(private api: ApiClient) {}
}
```

### 92. Design Patterns во фронтенде?
**Ответ:** Паттерны проектирования для решения типичных задач.

**Observer Pattern (используется в Vue реактивности):**
```typescript
class EventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event: string, data?: any) {
    this.events[event]?.forEach(cb => cb(data));
  }
}
```

**Factory Pattern:**
```typescript
interface Button {
  render(): string;
}

class PrimaryButton implements Button {
  render() { return '<button class="primary">...</button>'; }
}

class SecondaryButton implements Button {
  render() { return '<button class="secondary">...</button>'; }
}

function createButton(type: 'primary' | 'secondary'): Button {
  switch (type) {
    case 'primary': return new PrimaryButton();
    case 'secondary': return new SecondaryButton();
  }
}
```

**Strategy Pattern:**
```typescript
interface ValidationStrategy {
  validate(value: string): boolean;
}

class EmailStrategy implements ValidationStrategy {
  validate(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}

class Validator {
  constructor(private strategy: ValidationStrategy) {}

  validate(value: string) {
    return this.strategy.validate(value);
  }
}
```

### 93. Что такое DRY, KISS, YAGNI принципы?
**Ответ:** Три фундаментальных принципа программирования для написания чистого и поддерживаемого кода.

**DRY (Don't Repeat Yourself) — Не повторяйся:**

**Суть принципа:** Каждый фрагмент знания должен иметь единственное, однозначное представление в системе.

**Примеры нарушения DRY:**
```javascript
// ❌ Плохо: дублирование кода
function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUserEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function checkEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

**Примеры применения DRY:**
```javascript
// ✅ Хорошо: единая функция валидации
function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Переиспользование
function validateUserEmail(email) {
  return validateEmail(email);
}

function checkEmail(email) {
  return validateEmail(email);
}

// DRY в компонентах Vue
// ❌ Плохо: дублирование логики
const ComponentA = {
  data() {
    return { count: 0 };
  },
  methods: {
    increment() { this.count++; }
  }
};

const ComponentB = {
  data() {
    return { count: 0 };
  },
  methods: {
    increment() { this.count++; }
  }
};

// ✅ Хорошо: использование composable
function useCounter(initialValue = 0) {
  const count = ref(initialValue);
  const increment = () => count.value++;
  return { count, increment };
}

const ComponentA = {
  setup() {
    return useCounter();
  }
};

const ComponentB = {
  setup() {
    return useCounter();
  }
};
```

**Когда НЕ применять DRY:**
- Когда абстракция усложняет код больше, чем помогает
- Когда дублирование оправдано разными контекстами использования
- Когда преждевременная абстракция может привести к over-engineering

**KISS (Keep It Simple, Stupid) — Делай проще:**

**Суть принципа:** Простые решения лучше сложных. Избегайте ненужной сложности.

**Примеры нарушения KISS:**
```javascript
// ❌ Плохо: излишняя сложность
function getFullName(user) {
  return user?.personalInformation?.name?.firstName &&
         user?.personalInformation?.name?.lastName
    ? `${user.personalInformation.name.firstName} ${user.personalInformation.name.lastName}`
    : user?.personalInformation?.name?.firstName ||
      user?.personalInformation?.name?.lastName ||
      'Unknown';
}

// ✅ Хорошо: простое решение
function getFullName(user) {
  if (!user?.firstName || !user?.lastName) {
    return 'Unknown';
  }
  return `${user.firstName} ${user.lastName}`;
}

// Или еще проще
function getFullName(user) {
  return [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(' ') || 'Unknown';
}
```

**Примеры применения KISS:**
```javascript
// ❌ Плохо: сложная логика
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ✅ Хорошо: использование встроенных методов
function formatDate(date) {
  return new Date(date).toLocaleString('ru-RU');
}

// Или с библиотекой, если нужен контроль
import { format } from 'date-fns';
function formatDate(date) {
  return format(new Date(date), 'yyyy-MM-dd HH:mm');
}
```

**KISS в компонентах:**
```vue
<!-- ❌ Плохо: сложная логика в шаблоне -->
<template>
  <div>
    <div v-if="user && user.profile && user.profile.settings && user.profile.settings.theme === 'dark'">
      Dark theme
    </div>
  </div>
</template>

<!-- ✅ Хорошо: простая computed property -->
<template>
  <div>
    <div v-if="isDarkTheme">
      Dark theme
    </div>
  </div>
</template>

<script setup>
const isDarkTheme = computed(() =>
  user.value?.profile?.settings?.theme === 'dark'
);
</script>
```

**YAGNI (You Aren't Gonna Need It) — Тебе это не понадобится:**

**Суть принципа:** Не добавляйте функциональность, пока она действительно не нужна.

**Примеры нарушения YAGNI:**
```javascript
// ❌ Плохо: добавление функциональности "на будущее"
class UserService {
  constructor() {
    // Добавили кэширование, хотя оно пока не нужно
    this.cache = new Map();
    this.cacheTimeout = 60000;
  }

  async getUser(id) {
    // Сложная логика кэширования
    if (this.cache.has(id)) {
      const cached = this.cache.get(id);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }
    const user = await fetch(`/api/users/${id}`);
    this.cache.set(id, { data: user, timestamp: Date.now() });
    return user;
  }

  // Добавили методы, которые пока не используются
  async getUsersByRole(role) { /* ... */ }
  async getUsersByDepartment(department) { /* ... */ }
  async getUsersByLocation(location) { /* ... */ }
}

// ✅ Хорошо: только то, что нужно сейчас
class UserService {
  async getUser(id) {
    return await fetch(`/api/users/${id}`);
  }
}
```

**Примеры применения YAGNI:**
```typescript
// ❌ Плохо: преждевременная абстракция
interface IUserRepository {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  findByUsername(username: string): Promise<User>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

class UserRepository implements IUserRepository {
  // Реализация всех методов, хотя нужен только findById
}

// ✅ Хорошо: только то, что нужно
class UserRepository {
  async findById(id: string): Promise<User> {
    return await fetch(`/api/users/${id}`);
  }
}

// Добавляем методы по мере необходимости
```

**YAGNI в компонентах:**
```vue
<!-- ❌ Плохо: добавление фич "на будущее" -->
<template>
  <div>
    <button @click="handleClick">Click</button>
    <!-- Добавили кнопки, которые пока не нужны -->
    <button @click="handleEdit">Edit</button>
    <button @click="handleDelete">Delete</button>
    <button @click="handleShare">Share</button>
    <button @click="handleExport">Export</button>
  </div>
</template>

<!-- ✅ Хорошо: только то, что нужно сейчас -->
<template>
  <div>
    <button @click="handleClick">Click</button>
  </div>
</template>
```

**Как применять принципы вместе:**

```javascript
// Пример хорошего кода, применяющего все три принципа

// ✅ DRY: переиспользуемая функция
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// ✅ KISS: простая реализация
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ YAGNI: только нужная функциональность
function CartService() {
  return {
    addItem(item) {
      // Только базовая логика добавления
      cart.value.push(item);
    },

    removeItem(id) {
      cart.value = cart.value.filter(item => item.id !== id);
    },

    getTotal() {
      return calculateTotal(cart.value);
    }

    // НЕ добавляем getTotalWithTax, applyDiscount и т.д. пока не нужно
  };
}
```

**Баланс между принципами:**

1. **DRY vs KISS:** Иногда лучше небольшое дублирование, чем сложная абстракция
2. **YAGNI vs DRY:** Не создавайте абстракции "на будущее", но избегайте дублирования текущего кода
3. **KISS vs DRY:** Простота важнее, но не оправдывает избыточное дублирование

**Практические рекомендации:**

✅ **Применяйте DRY когда:**
- Код дублируется более 2-3 раз
- Изменения требуют правок в нескольких местах
- Абстракция упрощает код

✅ **Применяйте KISS когда:**
- Есть несколько способов решить задачу — выбирайте простейший
- Код становится сложным — упростите
- Добавляете новую фичу — делайте это просто

✅ **Применяйте YAGNI когда:**
- Хотите добавить функциональность "на будущее" — не делайте этого
- Создаете абстракцию для гипотетических случаев — не создавайте
- Добавляете опции, которые пока не используются — не добавляйте

### 87. Как масштабировать фронтенд приложение?
**Ответ:** Подходы к организации кода для больших приложений.

**Структура проекта:**
```
src/
  ├── components/        # Переиспользуемые компоненты
  │   ├── ui/           # Базовые UI компоненты
  │   └── features/     # Компоненты фич
  ├── composables/      # Переиспользуемая логика
  ├── stores/           # State management
  ├── services/         # API и бизнес-логика
  ├── types/            # TypeScript типы
  ├── utils/            # Утилиты
  └── features/         # Функциональные модули
      └── auth/
          ├── components/
          ├── composables/
          └── services/
```

**Принципы:**
- Feature-based структура для больших фич
- Разделение concerns (UI, логика, данные)
- Переиспользование через composables и компоненты
- Модульность и изоляция

---

## Производительность

### 88. Bundle optimization стратегии?
**Ответ:** Оптимизация размера и загрузки бандла.

**Tree Shaking:**
```javascript
// Использование named imports вместо default
import { debounce } from 'lodash-es'; // ✅ только нужная функция
import _ from 'lodash'; // ❌ весь пакет

// Side-effect free модули
// package.json
{
  "sideEffects": false // или массив файлов с side effects
}
```

**Code Splitting:**
```javascript
// Динамические импорты
const HeavyComponent = () => import('./HeavyComponent.vue');

// Route-based splitting
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.vue')
  }
];

// Component-based splitting
const LazyComponent = defineAsyncComponent(() =>
  import('./LazyComponent.vue')
);
```

**Chunking стратегии:**
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
};
```

### 89. Resource Hints: preload, prefetch, dns-prefetch?
**Ответ:** Подсказки браузеру для оптимизации загрузки ресурсов.

**preload — критически важные ресурсы:**
```html
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/critical.css" as="style">
<link rel="preload" href="/api/data.json" as="fetch" crossorigin>
```

**prefetch — ресурсы для следующей навигации:**
```html
<link rel="prefetch" href="/next-page.html">
<link rel="prefetch" href="/api/user-data.json">
```

**dns-prefetch — предварительное разрешение DNS:**
```html
<link rel="dns-prefetch" href="https://api.example.com">
<link rel="dns-prefetch" href="https://cdn.example.com">
```

**preconnect — установка соединения заранее:**
```html
<link rel="preconnect" href="https://api.example.com" crossorigin>
```

### 90. Service Workers и PWA?
**Ответ:** Service Worker — скрипт, работающий в фоне для кэширования и offline функциональности. PWA (Progressive Web App) — веб-приложение, которое работает как нативное мобильное приложение.

**Что такое PWA:**
PWA — это веб-приложение, использующее современные веб-технологии для предоставления опыта, похожего на нативное приложение.

**Основные характеристики PWA:**
- ✅ Работает офлайн (благодаря Service Worker)
- ✅ Устанавливается на устройство (добавление на домашний экран)
- ✅ Быстрая загрузка (кэширование ресурсов)
- ✅ Адаптивный дизайн (работает на всех устройствах)
- ✅ Push-уведомления (на поддерживаемых платформах)

**Основные компоненты PWA:**

**1. Service Worker:**
```javascript
// service-worker.js
const CACHE_NAME = 'app-v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Регистрация
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
```

**2. Web App Manifest:**
```json
// manifest.json
{
  "name": "My PWA App",
  "short_name": "PWA App",
  "description": "Описание приложения",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-wide.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ]
}
```

**3. Подключение в HTML:**
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#000000">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <link rel="apple-touch-icon" href="/icon-192.png">
</head>
<body>
  <!-- Контент приложения -->

  <script>
    // Регистрация Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => {
            console.log('SW registered:', reg);
          })
          .catch(err => {
            console.log('SW registration failed:', err);
          });
      });
    }

    // Обработка установки PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // Показать кнопку "Установить"
    });

    // Установка PWA
    async function installPWA() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
      }
    }
  </script>
</body>
</html>
```

**Стратегии кэширования Service Worker:**

**1. Cache First (для статических ресурсов):**
```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          const cache = caches.open(CACHE_NAME);
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      })
  );
});
```

**2. Network First (для API запросов):**
```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const cache = caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
```

**3. Stale While Revalidate (для часто обновляемого контента):**
```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
```

**Преимущества PWA:**

1. **Не нужно публиковать в App Store/Google Play** — развертывание через веб
2. **Автоматические обновления** — без установки новой версии
3. **Меньше места на устройстве** — по сравнению с нативными приложениями
4. **Работает офлайн** — благодаря Service Worker
5. **Быстрая загрузка** — кэширование ресурсов
6. **Push-уведомления** — на поддерживаемых платформах
7. **Кроссплатформенность** — один код для всех платформ

**Когда использовать PWA:**

✅ **Используйте PWA когда:**
- Нужен опыт, похожий на нативное приложение
- Важна работа офлайн
- Нужно быстрое развертывание без магазинов приложений
- Для внутренних корпоративных приложений
- Для приложений с частым обновлением контента
- Когда нужна кроссплатформенность

❌ **Не используйте PWA когда:**
- Нужен полный доступ к системным API (камера, GPS с высокой точностью)
- Требуется сложная обработка файлов
- Нужны специфичные функции платформы (NFC, Bluetooth)
- Приложение требует публикации в магазинах для доверия пользователей

**Ограничения PWA:**

1. **Ограниченный доступ к системным API** — по сравнению с нативными приложениями
2. **Не все функции доступны на iOS** — Safari имеет ограничения
3. **Push-уведомления** — работают не везде одинаково
4. **Ограничения по размеру кэша** — браузеры ограничивают размер кэша
5. **Требуется HTTPS** — обязательно для работы Service Worker

**Практические примеры:**

**Пример 1: Простое PWA с офлайн режимом:**
```javascript
// service-worker.js
const CACHE_NAME = 'my-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем из кэша или загружаем из сети
        return response || fetch(event.request);
      })
  );
});

// Обновление кэша при новой версии
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

**Пример 2: PWA с фоновой синхронизацией:**
```javascript
// service-worker.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Синхронизация данных с сервером
  const requests = await getPendingRequests();
  for (const request of requests) {
    try {
      await fetch(request.url, request.options);
      await removePendingRequest(request.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

**Проверка PWA:**
- Chrome DevTools → Application → Manifest
- Chrome DevTools → Application → Service Workers
- Lighthouse — проверка PWA критериев
- Web App Manifest Validator

**Требования для PWA:**
1. ✅ HTTPS (обязательно)
2. ✅ Web App Manifest
3. ✅ Service Worker
4. ✅ Responsive design
5. ✅ Иконки (минимум 192x192 и 512x512)
6. ✅ Быстрая загрузка (< 3 секунды)
7. ✅ Работает офлайн

### 91. Web Workers для тяжелых вычислений?
**Ответ:** Web Workers — это механизм браузера для выполнения JavaScript кода в отдельном потоке, параллельно основному потоку выполнения.

**Основные концепции:**

**1. Отдельный поток выполнения:**
- Основной поток (UI thread) отвечает за рендеринг и взаимодействие с пользователем
- Web Worker работает в фоновом потоке и не блокирует UI
- Позволяет выполнять тяжелые вычисления без "замораживания" интерфейса

**2. Изоляция:**
- Worker не имеет доступа к DOM, `window`, `document`
- Общение происходит через `postMessage()` и `onmessage`
- Данные передаются копированием (structured cloning) или через Transferable Objects

**3. Типы Web Workers:**
- **Dedicated Worker** — связан с одним скриптом, создается через `new Worker()`
- **Shared Worker** — может использоваться несколькими скриптами/окнами
- **Service Worker** — для фоновых задач и кэширования (PWA)

**Базовое использование:**
```javascript
// worker.js - файл воркера
self.onmessage = function(e) {
  const { data } = e;

  // Тяжелые вычисления, которые не блокируют UI
  const result = heavyComputation(data);

  // Отправляем результат обратно
  self.postMessage(result);
};

// main.js - основной поток
const worker = new Worker('/worker.js');

// Отправляем данные воркеру
worker.postMessage({ numbers: [1, 2, 3, 4, 5] });

// Получаем результат
worker.onmessage = function(e) {
  console.log('Result:', e.data);
  worker.terminate(); // Завершаем воркер
};

worker.onerror = function(error) {
  console.error('Worker error:', error);
};
```

**Продвинутое использование с Transferable Objects:**
```javascript
// Передача больших данных без копирования (для ArrayBuffer, ImageBitmap)
const buffer = new ArrayBuffer(1024 * 1024 * 10); // 10MB

worker.postMessage(buffer, [buffer]); // buffer передается, а не копируется
// После передачи buffer в основном потоке становится пустым

// В worker.js
self.onmessage = function(e) {
  const buffer = e.data; // Получаем ArrayBuffer напрямую
  // Обработка данных
  self.postMessage({ processed: true }, [buffer]); // Возвращаем обратно
};
```

**Inline Workers (без отдельного файла):**
```javascript
// Создание воркера из строки кода
const workerCode = `
  self.onmessage = function(e) {
    const result = e.data.numbers.reduce((sum, num) => sum + num, 0);
    self.postMessage({ sum: result });
  };
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));

worker.postMessage({ numbers: [1, 2, 3, 4, 5] });
worker.onmessage = (e) => console.log(e.data.sum); // 15
```

**Использование в Vue/Nuxt:**
```typescript
// composables/useWorker.ts
import { ref, onUnmounted } from 'vue';

export function useWorker<T, R>(workerPath: string) {
  const result = ref<R | null>(null);
  const error = ref<Error | null>(null);
  const loading = ref(false);

  const worker = new Worker(workerPath);

  worker.onmessage = (e) => {
    result.value = e.data;
    loading.value = false;
  };

  worker.onerror = (e) => {
    error.value = e.error;
    loading.value = false;
  };

  const postMessage = (data: T) => {
    loading.value = true;
    worker.postMessage(data);
  };

  onUnmounted(() => {
    worker.terminate();
  });

  return {
    result,
    error,
    loading,
    postMessage
  };
}

// Использование в компоненте
const { result, loading, postMessage } = useWorker('/workers/calculator.js');
postMessage({ numbers: [1, 2, 3, 4, 5] });
```

**Когда использовать:**
- ✅ Обработка больших массивов данных
- ✅ Изображения/видео обработка (фильтры, ресайз)
- ✅ Криптографические операции
- ✅ Парсинг больших JSON файлов
- ✅ Сложные математические вычисления
- ✅ Анализ данных в реальном времени

**Ограничения:**
- ❌ Нет доступа к DOM (`document`, `window`)
- ❌ Ограниченный доступ к API браузера
- ❌ Не могут использовать некоторые глобальные объекты
- ❌ Данные передаются через сообщения (нельзя напрямую делиться памятью)
- ❌ Не могут использовать `localStorage` напрямую (только через `postMessage`)
- ❌ Ограничения с CORS (воркер должен быть на том же домене или с правильными CORS заголовками)

**Альтернативы для простых случаев:**
```javascript
// Для легких операций можно использовать requestIdleCallback
requestIdleCallback(() => {
  // Код выполнится в свободное время браузера
  processData();
});

// Или разбить на части через setTimeout
function processChunk(data, index, chunkSize) {
  const chunk = data.slice(index, index + chunkSize);
  process(chunk);

  if (index + chunkSize < data.length) {
    setTimeout(() => processChunk(data, index + chunkSize, chunkSize), 0);
  }
}
```

---

## Безопасность

### 92. XSS (Cross-Site Scripting) и защита?
**Ответ:** XSS — внедрение вредоносного JavaScript кода в приложение.

**Типы XSS:**
1. **Reflected XSS** — скрипт в URL параметрах
2. **Stored XSS** — скрипт сохраняется на сервере
3. **DOM-based XSS** — манипуляция DOM на клиенте

**Защита:**
```vue
<!-- Vue автоматически экранирует -->
<template>
  <div>{{ userInput }}</div> <!-- Безопасно -->
  <div v-html="userInput"></div> <!-- ОПАСНО! -->
</template>

<!-- Санитизация для v-html -->
<script setup>
import DOMPurify from 'dompurify';

const sanitized = computed(() =>
  DOMPurify.sanitize(userInput.value)
);
</script>
```

**Content Security Policy (CSP):**
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

### 93. CSRF (Cross-Site Request Forgery) защита?
**Ответ:** CSRF — атака, заставляющая пользователя выполнить действия без его ведома.

**Защита:**
```javascript
// CSRF токены
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

fetch('/api/data', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

**SameSite cookies:**
```javascript
// Установка cookie с SameSite
document.cookie = "session=abc123; SameSite=Strict; Secure";
```

### 94. CORS детально: preflight запросы?
**Ответ:** CORS — механизм для запросов между разными доменами.

**Preflight запросы:**
- Отправляются для "сложных" запросов (PUT, DELETE, custom headers)
- Браузер автоматически отправляет OPTIONS запрос перед основным

```javascript
// Простой запрос (без preflight)
fetch('https://api.example.com/data');

// Сложный запрос (с preflight)
fetch('https://api.example.com/data', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value'
  },
  body: JSON.stringify({ data: 'value' })
});
```

**Серверная конфигурация:**
```javascript
// Express пример
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://example.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

---

## Тестирование

### 95. Unit тестирование: Jest/Vitest?
**Ответ:** Unit тесты проверяют отдельные функции и компоненты изолированно.

**Примеры:**
```typescript
// utils.test.ts
import { describe, it, expect } from 'vitest';
import { debounce } from './utils';

describe('debounce', () => {
  it('should delay function execution', async () => {
    let callCount = 0;
    const fn = debounce(() => callCount++, 100);

    fn();
    fn();
    fn();

    expect(callCount).toBe(0);

    await new Promise(resolve => setTimeout(resolve, 150));
    expect(callCount).toBe(1);
  });
});

// Component test
import { mount } from '@vue/test-utils';
import Counter from './Counter.vue';

describe('Counter', () => {
  it('increments count on button click', async () => {
    const wrapper = mount(Counter);
    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toContain('Count: 1');
  });
});
```

### 96. E2E тестирование: Playwright/Cypress?
**Ответ:** End-to-end тесты проверяют полный пользовательский сценарий.

**Playwright пример:**
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('https://example.com/dashboard');
  await expect(page.locator('.user-name')).toContainText('John Doe');
});
```

**Cypress пример:**
```javascript
describe('Login', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('#email').type('user@example.com');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

---

## Accessibility (a11y)

### 97. ARIA атрибуты и семантика?
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

### 98. Keyboard navigation и доступность?
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

---

## Практические задачи (Senior)

### 99. Реализовать throttle функцию?
```javascript
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

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

### 100. Реализовать deepEqual функцию?
```javascript
function deepEqual(a, b) {
  if (a === b) return true;

  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}
```

### 101. Реализовать EventEmitter?
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
}
```

### 102. Реализовать debounce с immediate опцией?
```javascript
function debounce(func, delay, immediate = false) {
  let timeoutId;

  return function(...args) {
    const callNow = immediate && !timeoutId;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        func.apply(this, args);
      }
    }, delay);

    if (callNow) {
      func.apply(this, args);
    }
  };
}
```

---
