import { vi } from 'vitest';

// Проверяем, что мы в браузерном окружении (jsdom уже должен быть установлен)
if (typeof window !== 'undefined') {
  // Mock для navigator.clipboard
  if (typeof navigator !== 'undefined') {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
    });
  }

  // Mock для window.matchMedia (используется в некоторых компонентах)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
