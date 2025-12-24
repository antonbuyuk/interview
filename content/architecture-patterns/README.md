## Архитектура и паттерны

### 1. SOLID принципы во фронтенде?
**Ответ:** SOLID — принципы объектно-ориентированного программирования, применимые и во фронтенде.

**Принципы:**
- **S** - Single Responsibility: один компонент — одна ответственность
- **O** - Open/Closed: открыт для расширения, закрыт для модификации
- **L** - Liskov Substitution: подклассы должны заменять базовые классы
- **I** - Interface Segregation: много специфичных интерфейсов лучше одного общего
- **D** - Dependency Inversion: зависеть от абстракций, а не от конкретных реализаций

```typescript
// Single Responsibility
const UserCard = () => { /* отображение */ }
const UserActions = () => { /* действия */ }
```

**Answer EN:** SOLID are object-oriented programming principles applicable to frontend development.

**Principles:**
- **S** - Single Responsibility: one component — one responsibility
- **O** - Open/Closed: open for extension, closed for modification
- **L** - Liskov Substitution: subclasses should replace base classes
- **I** - Interface Segregation: many specific interfaces better than one general
- **D** - Dependency Inversion: depend on abstractions, not concrete implementations

```typescript
// Single Responsibility
const UserCard = () => { /* display */ }
const UserActions = () => { /* actions */ }
```

**Ответ Senior:**

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

### 2. Design Patterns во фронтенде?
**Ответ:** Design patterns — это проверенные решения типичных проблем в проектировании программного обеспечения, адаптированные для фронтенда. Наиболее полезные паттерны включают Observer (используется в реактивности Vue), Singleton для глобального состояния, Factory для создания компонентов, и Module для организации кода. Понимание паттернов помогает писать более структурированный и поддерживаемый код, а также лучше понимать архитектуру популярных фреймворков.

**Основные паттерны:**
- **Observer** — реактивность (Vue, React)
- **Singleton** — глобальное состояние
- **Factory** — создание компонентов
- **Module** — организация кода

```typescript
// Observer pattern (Vue reactivity)
const state = reactive({ count: 0 })
watch(() => state.count, (newVal) => console.log(newVal))
```

**Answer EN:** Design patterns are proven solutions to common software design problems, adapted for frontend. Most useful patterns include Observer (used in Vue reactivity), Singleton for global state, Factory for component creation, and Module for code organization. Understanding patterns helps write more structured and maintainable code, and better understand popular framework architectures.

**Main patterns:**
- **Observer** — reactivity (Vue, React)
- **Singleton** — global state
- **Factory** — component creation
- **Module** — code organization

```typescript
// Observer pattern (Vue reactivity)
const state = reactive({ count: 0 })
watch(() => state.count, (newVal) => console.log(newVal))
```

**Ответ Senior:**

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

### 3. Что такое DRY, KISS, YAGNI принципы?
**Ответ:** DRY, KISS и YAGNI — это три фундаментальных принципа программирования, которые помогают писать чистый и поддерживаемый код. DRY (Don't Repeat Yourself) призывает избегать дублирования кода, вынося повторяющуюся логику в функции или модули. KISS (Keep It Simple, Stupid) напоминает, что простое решение часто лучше сложного. YAGNI (You Aren't Gonna Need It) предостерегает от добавления функциональности, которая может понадобиться в будущем, но не нужна сейчас.

**Принципы:**
- **DRY** — не повторяйся, выноси общую логику
- **KISS** — делай проще, простое решение лучше
- **YAGNI** — не добавляй то, что не нужно сейчас

```typescript
// DRY - выносим общую логику
const useAuth = () => {
  const user = useState('user')
  return { user }
}
```

**Answer EN:** DRY, KISS and YAGNI are three fundamental programming principles that help write clean and maintainable code. DRY (Don't Repeat Yourself) encourages avoiding code duplication by extracting repeated logic into functions or modules. KISS (Keep It Simple, Stupid) reminds that simple solution is often better than complex. YAGNI (You Aren't Gonna Need It) warns against adding functionality that might be needed in future but isn't needed now.

**Principles:**
- **DRY** — don't repeat yourself, extract common logic
- **KISS** — keep it simple, simple solution is better
- **YAGNI** — don't add what isn't needed now

```typescript
// DRY - extract common logic
const useAuth = () => {
  const user = useState('user')
  return { user }
}
```

**Ответ Senior:**

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

### 4. Как масштабировать фронтенд приложение?
**Ответ:** Масштабирование фронтенд приложения требует правильной организации кода и архитектурных решений. Ключевые подходы включают модульную структуру с четким разделением по фичам, использование паттернов проектирования для переиспользования кода, внедрение системы компонентов и композаблов. Важны также правильное управление состоянием (state management), lazy loading модулей, code splitting и оптимизация бандла для больших приложений.

**Стратегии:**
- Модульная структура по фичам
- Паттерны проектирования
- Компоненты и композаблы
- State management
- Code splitting и lazy loading

```typescript
// Feature-based structure
src/
  features/
    auth/
    dashboard/
    profile/
```

**Answer EN:** Scaling frontend application requires proper code organization and architectural decisions. Key approaches include modular structure with clear feature separation, using design patterns for code reuse, implementing component and composable systems. Also important are proper state management, lazy loading modules, code splitting and bundle optimization for large applications.

**Strategies:**
- Modular feature-based structure
- Design patterns
- Components and composables
- State management
- Code splitting and lazy loading

```typescript
// Feature-based structure
src/
  features/
    auth/
    dashboard/
    profile/
```

**Ответ Senior:**

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

