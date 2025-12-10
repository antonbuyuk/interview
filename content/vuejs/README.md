## Vue.js

### 1. Разница между Options API и Composition API?
**Ответ:**
- **Options API**: структура с `data`, `methods`, `computed`, `watch` (более простая для новичков)
- **Composition API**: использование `setup()` или `<script setup>`, более гибкая композиция логики, лучше для больших компонентов

```javascript
// Options API
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() { this.count++ }
  }
}

// Composition API
import { ref } from 'vue'
export default {
  setup() {
    const count = ref(0)
    const increment = () => { count.value++ }
    return { count, increment }
  }
}
```

**Answer EN:**
- **Options API**: structure with `data`, `methods`, `computed`, `watch` (simpler for beginners)
- **Composition API**: uses `setup()` or `<script setup>`, more flexible logic composition, better for large components

**Ответ Senior:**

**Архитектурные различия:**

Options API разделяет логику по типам (data, methods, computed), что усложняет отслеживание связанной логики в больших компонентах. Composition API группирует логику по функциональности, улучшая переиспользование и тестирование.

**Миграция и сосуществование:**
- Оба API можно использовать вместе
- Options API использует Composition API под капотом
- Composition API рекомендуется для новых проектов

**Производительность:** Оба API имеют одинаковую производительность, так как компилируются в один код.

### 2. Что такое реактивность в Vue 3?
**Ответ:** Реактивность — система автоматического отслеживания изменений данных и обновления DOM.

**Answer EN:** Reactivity is a system that automatically tracks data changes and updates the DOM.

**How it works in Vue 3:**

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
```

**Ответ Senior:**

Реактивность в Vue 3 построена на Proxy API, что является фундаментальным отличием от Vue 2. Proxy позволяет перехватывать все операции над объектами, включая доступ к свойствам, их изменение, добавление и удаление. Это обеспечивает более глубокую реактивность и лучшую производительность.
const { x, y } = state; // ❌ не реактивно
const { x, y } = toRefs(state); // ✅ реактивно через toRefs
```

### 3. Разница между `ref` и `reactive`?
**Ответ:** Оба создают реактивные данные, но имеют разные области применения и ограничения.

**Ключевые различия:**

| Характеристика | `ref` | `reactive` |
|----------------|-------|------------|
| Типы данных | Любые (примитивы, объекты) | Только объекты |
| Доступ к значению | Через `.value` | Напрямую |
| Деструктуризация | Сохраняет реактивность | Теряет (нужен `toRefs`) |
| Переназначение | Можно через `.value` | Нельзя (теряется реактивность) |
| Template | Автоматически разворачивается | Работает напрямую |

```javascript
// ref - для примитивов
const count = ref(0)
count.value++ // доступ через .value

// reactive - для объектов
const state = reactive({ name: 'John', age: 30 })
state.name = 'Jane' // прямой доступ
```

**Answer EN:** Both create reactive data, but have different use cases and limitations.

**Key differences:**

| Characteristic | `ref` | `reactive` |
|----------------|-------|------------|
| Data types | Any (primitives, objects) | Objects only |
| Value access | Via `.value` | Direct |
| Destructuring | Preserves reactivity | Loses (needs `toRefs`) |
| Reassignment | Possible via `.value` | Not possible (loses reactivity) |
| Template | Auto-unwraps | Works directly |

```javascript
// ref - for primitives
const count = ref(0)
count.value++ // access via .value

// reactive - for objects
const state = reactive({ name: 'John', age: 30 })
state.name = 'Jane' // direct access
```

**Ответ Senior:**

**Глубокое понимание разницы:**

```javascript
// ref под капотом - это reactive объект с .value
const count = ref(0);
// Эквивалентно:
const count = reactive({ value: 0 });

// Поэтому ref работает везде
// Преимущества ref:
// 1. Единообразие - один API для всего
// 2. Проще для TypeScript
// 3. Можно переназначать

// reactive полезен для:
// 1. Больших форм (много полей)
// 2. Состояний, которые не переназначаются
// 3. Когда нужна вся структура реактивной
```

### 4. Жизненный цикл компонента Vue 3?
**Ответ:** Жизненный цикл компонента Vue 3 включает хуки: `setup()` — создание компонента, `onBeforeMount` — перед монтированием, `onMounted` — после монтирования, `onBeforeUpdate` — перед обновлением, `onUpdated` — после обновления, `onBeforeUnmount` — перед размонтированием, `onUnmounted` — после размонтирования.

```javascript
import { onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    onMounted(() => {
      console.log('Component mounted')
    })

    onUnmounted(() => {
      console.log('Component unmounted')
    })
  }
}
```

**Answer EN:** Vue 3 component lifecycle includes hooks: `setup()` — component creation, `onBeforeMount` — before mounting, `onMounted` — after mounting, `onBeforeUpdate` — before update, `onUpdated` — after update, `onBeforeUnmount` — before unmounting, `onUnmounted` — after unmounting.

```javascript
import { onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    onMounted(() => {
      console.log('Component mounted')
    })

    onUnmounted(() => {
      console.log('Component unmounted')
    })
  }
}
```

**Ответ Senior:**

**Последовательность вызовов:**

1. `setup()` — инициализация компонента
2. `onBeforeMount` — перед созданием DOM
3. `onMounted` — DOM готов, можно обращаться к элементам
4. `onBeforeUpdate` — перед обновлением (вызывается многократно)
5. `onUpdated` — после обновления DOM
6. `onBeforeUnmount` — перед удалением, последний шанс очистить ресурсы
7. `onUnmounted` — компонент удалён

**Практическое использование:**

```javascript
onMounted(() => {
  // Загрузка данных, подписки, таймеры
});

onUnmounted(() => {
  // Очистка: removeEventListener, clearInterval, отписки
});

onUpdated(() => {
  // Реакция на изменения DOM (редко используется)
});
```

### 5. Что такое computed и watch?
**Ответ:**
- **computed**: вычисляемое свойство, кэшируется, пересчитывается только при изменении зависимостей
- **watch**: наблюдает за изменениями и выполняет побочные эффекты

```javascript
// computed - для производных данных
const fullName = computed(() => `${firstName.value} ${lastName.value}`)

// watch - для побочных эффектов
watch(userId, async (newId) => {
  const data = await fetchUser(newId)
})
```

**Answer EN:**
- **computed**: computed property, cached, recalculated only when dependencies change
- **watch**: watches for changes and performs side effects

```javascript
// computed - for derived data
const fullName = computed(() => `${firstName.value} ${lastName.value}`)

// watch - for side effects
watch(userId, async (newId) => {
  const data = await fetchUser(newId)
})
```

**Ответ Senior:**

**computed vs watch:**

```javascript
// computed - для производных данных (как геттеры)
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

// watch - для побочных эффектов (API вызовы, логирование)
watch(userId, async (newId) => {
  const data = await fetchUser(newId);
});

// watchEffect - автоматически отслеживает зависимости
watchEffect(() => {
  console.log(userId.value, userName.value);
});
```

**Когда что использовать:**
- `computed` — для вычислений, которые должны быть синхронными
- `watch` — для асинхронных операций и побочных эффектов
- `watchEffect` — когда нужна автоматическая реакция на изменения

### 6. Как работает v-model?
**Ответ:** v-model — двустороннее связывание данных. Синтаксический сахар для `:value` + `@input`.

```vue
<!-- Это -->
<input v-model="text" />

<!-- Эквивалентно -->
<input :value="text" @input="text = $event.target.value" />
```

**Answer EN:** v-model is two-way data binding. Syntactic sugar for `:value` + `@input`.

```vue
<!-- This -->
<input v-model="text" />

<!-- Equivalent to -->
<input :value="text" @input="text = $event.target.value" />
```

**Ответ Senior:**

**v-model под капотом:**

```vue
<!-- Это -->
<input v-model="text" />

<!-- Эквивалентно -->
<input :value="text" @input="text = $event.target.value" />

<!-- Для кастомных компонентов -->
<CustomInput :modelValue="text" @update:modelValue="text = $event" />
```

**Кастомный v-model:**

```vue
<script setup>
defineProps(['modelValue']);
defineEmits(['update:modelValue']);
</script>

<template>
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>
```

**Множественные v-model:**

```vue
<CustomInput v-model:firstName="first" v-model:lastName="last" />
```

### 7. Что такое slots?
**Ответ:** Slots — механизм для передачи контента в компонент, позволяющий создавать переиспользуемые компоненты с гибкой структурой.

```vue
<!-- Компонент -->
<slot name="header" />
<slot />

<!-- Использование -->
<Component>
  <template #header>Header</template>
  <p>Default content</p>
</Component>
```

**Answer EN:** Slots are a mechanism for passing content into components, allowing creation of reusable components with flexible structure.

```vue
<!-- Component -->
<slot name="header" />
<slot />

<!-- Usage -->
<Component>
  <template #header>Header</template>
  <p>Default content</p>
</Component>
```

**Ответ Senior:**

**Типы slots:**

```vue
<!-- Default slot -->
<slot />

<!-- Named slots -->
<slot name="header" />
<slot name="footer" />

<!-- Scoped slots - передача данных в родитель -->
<slot :item="item" :index="index" />

<!-- Использование -->
<Component>
  <template #header>Header</template>
  <template #default="{ item }">{{ item.name }}</template>
</Component>
```

**Практическое применение:**
- Layout компоненты
- Переиспользуемые UI компоненты
- Render props паттерн

### 8. Что такое Teleport в Vue 3?
**Ответ:** `Teleport` — компонент для рендеринга содержимого в другом месте DOM дерева, вне текущего компонента.

```vue
<Teleport to="body">
  <div class="modal">Modal content</div>
</Teleport>
```

**Answer EN:** `Teleport` is a component for rendering content in a different place in the DOM tree, outside the current component.

```vue
<Teleport to="body">
  <div class="modal">Modal content</div>
</Teleport>
```

**Ответ Senior:**

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

### 9. Что такое Suspense в Vue 3?
**Ответ:** `Suspense` — компонент для обработки асинхронных зависимостей в дереве компонентов.

```vue
<Suspense>
  <template #default>
    <AsyncComponent />
  </template>
  <template #fallback>
    <div>Loading...</div>
  </template>
</Suspense>
```

**Answer EN:** `Suspense` is a component for handling asynchronous dependencies in the component tree.

```vue
<Suspense>
  <template #default>
    <AsyncComponent />
  </template>
  <template #fallback>
    <div>Loading...</div>
  </template>
</Suspense>
```

**Ответ Senior:**

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

### 10. Что такое keep-alive и когда использовать?
**Ответ:** `keep-alive` — встроенный компонент для кэширования неактивных компонентов, сохраняя их состояние.

```vue
<keep-alive>
  <component :is="currentComponent" />
</keep-alive>
```

**Answer EN:** `keep-alive` is a built-in component for caching inactive components, preserving their state.

```vue
<keep-alive>
  <component :is="currentComponent" />
</keep-alive>
```

**Ответ Senior:**

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

### 11. Продвинутое использование Provide/Inject?
**Ответ:** `provide`/`inject` — механизм для передачи данных через несколько уровней компонентов без prop drilling.

```javascript
// Родитель
provide('theme', 'dark')

// Потомок
const theme = inject('theme')
```

**Answer EN:** `provide`/`inject` is a mechanism for passing data through multiple component levels without prop drilling.

```javascript
// Parent
provide('theme', 'dark')

// Child
const theme = inject('theme')
```

**Ответ Senior:**

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

### 12. Оптимизация рендеринга в Vue 3?
**Ответ:** Vue 3 предоставляет несколько директив и API для оптимизации производительности рендеринга: `v-once`, `v-memo`, `shallowRef`, `shallowReactive`.

```vue
<div v-once>{{ expensiveComputation() }}</div>
<div v-memo="[dependency]">{{ expensiveRender() }}</div>
```

**Answer EN:** Vue 3 provides several directives and APIs for optimizing rendering performance: `v-once`, `v-memo`, `shallowRef`, `shallowReactive`.

```vue
<div v-once>{{ expensiveComputation() }}</div>
<div v-memo="[dependency]">{{ expensiveRender() }}</div>
```

**Ответ Senior:**

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

### 13. State Management: Pinia vs Vuex?
**Ответ:** Оба решения для управления состоянием, но Pinia — рекомендуемый подход для Vue 3. Pinia проще, имеет лучшую поддержку TypeScript и не требует модулей.

```javascript
// Pinia
export const useStore = defineStore('main', {
  state: () => ({ count: 0 }),
  actions: { increment() { this.count++ } }
})
```

**Answer EN:** Both are state management solutions, but Pinia is the recommended approach for Vue 3. Pinia is simpler, has better TypeScript support and doesn't require modules.

```javascript
// Pinia
export const useStore = defineStore('main', {
  state: () => ({ count: 0 }),
  actions: { increment() { this.count++ } }
})
```

**Ответ Senior:**

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

### 14. Лучшие практики создания Composables?
**Ответ:** Composables — переиспользуемые функции для композиции логики в Vue 3. Начинайте с `use`, возвращайте объект с реактивными свойствами, используйте TypeScript.

```javascript
export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}
```

**Answer EN:** Composables are reusable functions for composing logic in Vue 3. Start with `use`, return object with reactive properties, use TypeScript.

```javascript
export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}
```

**Ответ Senior:**

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

