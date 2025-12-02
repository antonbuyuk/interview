## TypeScript

### 1. Что такое TypeScript?
**Ответ:** TypeScript — надмножество JavaScript, добавляющее статическую типизацию. Компилируется в JavaScript и помогает выявлять ошибки на этапе разработки.

**Преимущества:**
- Статическая типизация для раннего обнаружения ошибок
- Улучшенная поддержка IDE (автодополнение, рефакторинг)
- Лучшая документация кода через типы
- Поддержка современных возможностей ES6+

**Ответ Senior:**

TypeScript компилируется в JavaScript и может использоваться с любой версией JS. Основные концепции: структурная типизация (duck typing), вывод типов, строгая типизация.

**Практические преимущества:**
- Рефакторинг безопаснее
- Документация через типы
- Лучший Developer Experience
- Миграция JavaScript проекта поэтапно

**Настройка компилятора:**
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

### 2. Разница между `type` и `interface`?
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

**Ответ Senior:**

**Когда использовать interface:**
- Для публичных API (расширяемость)
- Когда нужен declaration merging
- Для объектных структур

**Когда использовать type:**
- Для union/intersection типов
- Для примитивов и mapped types
- Для более сложных типовых конструкций

**Рекомендация:** Для объектов предпочитайте `interface`, для всего остального — `type`.

### 3. Что такое generics (обобщенные типы)?
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

**Ответ Senior:**

**Ограничения generics:**
```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Множественные generic параметры
function merge<T, U>(a: T, b: U): T & U {
  return { ...a, ...b };
}
```

**Default type parameters:**
```typescript
interface ApiResponse<T = any> {
  data: T;
  status: number;
}
```

### 4. Что такое union и intersection types?
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

**Ответ Senior:**

**Discriminated unions:**
```typescript
type Success = { status: 'success'; data: string };
type Error = { status: 'error'; message: string };
type Result = Success | Error;

function handle(result: Result) {
  if (result.status === 'success') {
    console.log(result.data); // TypeScript знает тип
  }
}
```

### 5. Что такое utility types?
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

**Ответ Senior:**

**Продвинутые utility types:**
```typescript
// Exclude и Extract
type T1 = Exclude<'a' | 'b' | 'c', 'a'>; // 'b' | 'c'
type T2 = Extract<'a' | 'b', 'a' | 'c'>; // 'a'

// NonNullable
type T3 = NonNullable<string | null | undefined>; // string

// Parameters и ReturnType
type FuncParams = Parameters<(a: number, b: string) => void>;
type FuncReturn = ReturnType<() => string>;
```

### 6. Что такое type guards?
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

**Ответ Senior:**

**Продвинутые type guards:**
```typescript
// Пользовательские type guards
interface Cat { meow(): void }
interface Dog { bark(): void }

function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal;
}

// Класс-based guards
if (obj instanceof MyClass) {
  // TypeScript знает тип
}
```

### 7. Что такое декораторы (decorators)?
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

**Ответ Senior:**

Декораторы — экспериментальная функция. В Vue используются для class components. Лучше использовать функции-обертки для композиции.

### 8. Что такое enum и когда использовать?
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

**Ответ Senior:**

**Проблемы enum:**
- Создают лишний JavaScript код
- Не tree-shakeable
- Могут вызывать неожиданное поведение

**Альтернативы:**
```typescript
// const object (предпочтительно)
const Status = {
  Pending: 'pending',
  Active: 'active'
} as const;

type Status = typeof Status[keyof typeof Status];
```

### 9. Что такое namespace и module?
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

**Ответ Senior:**

Namespace устарели. Используйте ES modules везде. Namespace могут использоваться для declaration merging в библиотеках.

### 10. Что такое type assertion и когда использовать?
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

**Ответ Senior:**

**Опасности type assertion:**
```typescript
// ❌ Опасно - нет проверки
const value = data as string;

// ✅ Безопаснее - проверка
if (typeof data === 'string') {
  const value = data; // type narrowing
}

// Двойное assertion
const value = data as unknown as TargetType;
```

**Предпочитайте type guards** вместо assertions для безопасности типов.

---

