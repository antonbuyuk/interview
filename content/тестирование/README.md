## Тестирование

### 1. Unit тестирование: Jest/Vitest?
**Ответ:** Unit тесты проверяют отдельные функции и компоненты изолированно.

**Примеры:**
```typescript
import { describe, it, expect } from 'vitest'
import { debounce } from './utils'

describe('debounce', () => {
  it('should delay function execution', async () => {
    let callCount = 0
    const fn = debounce(() => callCount++, 100)
    fn()
    await new Promise(resolve => setTimeout(resolve, 150))
    expect(callCount).toBe(1)
  })
})
```

**Answer EN:** Unit tests check individual functions and components in isolation.

**Examples:**
```typescript
import { describe, it, expect } from 'vitest'
import { debounce } from './utils'

describe('debounce', () => {
  it('should delay function execution', async () => {
    let callCount = 0
    const fn = debounce(() => callCount++, 100)
    fn()
    await new Promise(resolve => setTimeout(resolve, 150))
    expect(callCount).toBe(1)
  })
})
```

**Ответ Senior:**
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

### 2. E2E тестирование: Playwright/Cypress?
**Ответ:** End-to-end тесты проверяют полный пользовательский сценарий от начала до конца, имитируя действия реального пользователя.

**Playwright пример:**
```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'user@example.com')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

**Answer EN:** End-to-end tests check full user scenario from start to finish, simulating real user actions.

**Playwright example:**
```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'user@example.com')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

**Ответ Senior:**
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

**Ответ Senior:**

**Выбор инструмента:**
- **Vitest** — быстрый, совместим с Vite, современный API
- **Jest** — зрелый, большая экосистема
- **Playwright** — мультибраузерный, надежный
- **Cypress** — хороший DX, но медленнее

**Best practices:**
- Пирамида тестирования (больше unit, меньше E2E)
- Изоляция тестов
- Тестируйте поведение, не реализацию
- Используйте моки для внешних зависимостей

---

