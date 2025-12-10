## TypeScript

### 1. Что такое TypeScript?
**Ответ:** TypeScript — надмножество JavaScript, добавляющее статическую типизацию. Компилируется в JavaScript и помогает выявлять ошибки на этапе разработки.

**Answer EN:** TypeScript is a superset of JavaScript that adds static typing. It compiles to JavaScript and helps catch errors during development.

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

**Answer EN:** Both are used to define object types, but there are differences:

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
**Ответ:** Generics позволяют создавать переиспользуемые компоненты, работающие с разными типами данных. Позволяют параметризовать типы, делая код более гибким и типобезопасным.

```typescript
function identity<T>(arg: T): T {
  return arg
}

const num = identity<number>(42)
const str = identity<string>('hello')

// Можно использовать с интерфейсами и классами
interface Container<T> {
  value: T
}

const container: Container<number> = { value: 42 }
```

**Answer EN:** Generics allow creating reusable components that work with different data types. Allow parameterizing types, making code more flexible and type-safe.

```typescript
function identity<T>(arg: T): T {
  return arg
}

const num = identity<number>(42)
const str = identity<string>('hello')

// Can be used with interfaces and classes
interface Container<T> {
  value: T
}

const container: Container<number> = { value: 42 }
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
**Ответ:**
- **Union types (`|`)** — значение может быть одного из нескольких типов
- **Intersection types (`&`)** — значение должно соответствовать всем типам одновременно

```typescript
// Union type
type StringOrNumber = string | number
const value: StringOrNumber = 'hello' // или 42

// Intersection type
type Person = { name: string }
type Employee = { id: number }
type PersonEmployee = Person & Employee // { name: string, id: number }
```

**Answer EN:**
- **Union types (`|`)** — value can be one of several types
- **Intersection types (`&`)** — value must match all types simultaneously

```typescript
// Union type
type StringOrNumber = string | number
const value: StringOrNumber = 'hello' // or 42

// Intersection type
type Person = { name: string }
type Employee = { id: number }
type PersonEmployee = Person & Employee // { name: string, id: number }
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
**Ответ:** Utility types — встроенные типы для преобразования существующих типов. Позволяют создавать новые типы на основе существующих без дублирования кода.

**Основные utility types:**
- `Partial<T>` — делает все свойства опциональными
- `Required<T>` — делает все свойства обязательными
- `Readonly<T>` — делает все свойства только для чтения
- `Pick<T, K>` — выбирает определенные свойства
- `Omit<T, K>` — исключает определенные свойства
- `Record<K, T>` — создает объект с ключами типа K и значениями типа T

```typescript
type User = {
  id: number
  name: string
  email: string
}

type PartialUser = Partial<User> // все свойства опциональны
type UserPreview = Pick<User, 'id' | 'name'> // только id и name
type UserWithoutEmail = Omit<User, 'email'> // без email
```

**Answer EN:** Utility types are built-in types for transforming existing types. Allow creating new types based on existing ones without code duplication.

**Main utility types:**
- `Partial<T>` — makes all properties optional
- `Required<T>` — makes all properties required
- `Readonly<T>` — makes all properties readonly
- `Pick<T, K>` — selects specific properties
- `Omit<T, K>` — excludes specific properties
- `Record<K, T>` — creates object with keys of type K and values of type T

```typescript
type User = {
  id: number
  name: string
  email: string
}

type PartialUser = Partial<User> // all properties optional
type UserPreview = Pick<User, 'id' | 'name'> // only id and name
type UserWithoutEmail = Omit<User, 'email'> // without email
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
**Ответ:** Type guards — функции, которые проверяют тип во время выполнения и сужают тип в TypeScript. Позволяют TypeScript понять тип значения после проверки.

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function process(value: string | number) {
  if (isString(value)) {
    // TypeScript знает, что value - string
    console.log(value.toUpperCase())
  } else {
    // TypeScript знает, что value - number
    console.log(value.toFixed(2))
  }
}
```

**Answer EN:** Type guards are functions that check type at runtime and narrow type in TypeScript. Allow TypeScript to understand value type after check.

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function process(value: string | number) {
  if (isString(value)) {
    // TypeScript knows value is string
    console.log(value.toUpperCase())
  } else {
    // TypeScript knows value is number
    console.log(value.toFixed(2))
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
**Ответ:** Декораторы — специальный синтаксис для метапрограммирования, позволяющий добавлять метаданные к классам, методам, свойствам. Экспериментальная функция TypeScript, используется для расширения функциональности без изменения исходного кода.

```typescript
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with`, args)
    return original.apply(this, args)
  }
}

class Calculator {
  @Log
  add(a: number, b: number) {
    return a + b
  }
}
```

**Answer EN:** Decorators are special syntax for metaprogramming, allowing adding metadata to classes, methods, properties. Experimental TypeScript feature, used for extending functionality without modifying original code.

```typescript
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with`, args)
    return original.apply(this, args)
  }
}

class Calculator {
  @Log
  add(a: number, b: number) {
    return a + b
  }
}
```

**Ответ Senior:**

Декораторы — экспериментальная функция. В Vue используются для class components. Лучше использовать функции-обертки для композиции.

### 8. Что такое enum и когда использовать?
**Ответ:** enum — способ определения набора именованных констант. Позволяет создавать набор связанных значений, которые можно использовать как тип.

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

**Answer EN:** enum is a way to define a set of named constants. Allows creating a set of related values that can be used as a type.

```typescript
enum Status {
  Pending = 'pending',
  Active = 'active',
  Inactive = 'inactive'
}

// Numeric enum
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}
```

**When to use:**
- When need a set of fixed values
- When values can be used in different places
- Alternative: use const objects or union types

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
**Ответ:**
- **namespace** — способ организации кода в глобальной области видимости (устарел)
- **module** — стандартный способ организации кода через ES modules (рекомендуется)

```typescript
// namespace (устарел)
namespace Utils {
  export function formatDate(date: Date): string {
    return date.toISOString()
  }
}

// ES module (рекомендуется)
// file.ts
export function formatDate(date: Date): string {
  return date.toISOString()
}

// Использование
import { formatDate } from './file'
```

**Answer EN:**
- **namespace** — way to organize code in global scope (deprecated)
- **module** — standard way to organize code via ES modules (recommended)

```typescript
// namespace (deprecated)
namespace Utils {
  export function formatDate(date: Date): string {
    return date.toISOString()
  }
}

// ES module (recommended)
// file.ts
export function formatDate(date: Date): string {
  return date.toISOString()
}

// Usage
import { formatDate } from './file'
```

**Ответ Senior:**

Namespace устарели. Используйте ES modules везде. Namespace могут использоваться для declaration merging в библиотеках.

### 10. Что такое type assertion и когда использовать?
**Ответ:** Type assertion — приведение типа, когда разработчик знает больше о типе, чем TypeScript. Позволяет явно указать тип значения, но не выполняет проверку во время выполнения.

```typescript
const value: unknown = 'hello'
const str = value as string // type assertion
const str2 = <string>value // альтернативный синтаксис

// Более безопасный способ - type guard
if (typeof value === 'string') {
  const str = value // автоматическое сужение типа
}
```

**Когда использовать:**
- При работе с DOM API
- При работе с библиотеками без типов
- Когда точно знаете тип, но TypeScript не может его вывести

**Answer EN:** Type assertion is type casting when developer knows more about type than TypeScript. Allows explicitly specifying value type but doesn't perform runtime check.

```typescript
const value: unknown = 'hello'
const str = value as string // type assertion
const str2 = <string>value // alternative syntax

// Safer way - type guard
if (typeof value === 'string') {
  const str = value // automatic type narrowing
}
```

**When to use:**
- When working with DOM API
- When working with libraries without types
- When you know type exactly but TypeScript can't infer it

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


