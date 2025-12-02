## Архитектура и паттерны

### 1. SOLID принципы во фронтенде?
**Ответ:** SOLID — принципы объектно-ориентированного программирования, применимые и во фронтенде.

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

