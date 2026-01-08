import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Мокируем window.speechSynthesis для тестов
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    configurable: true,
    value: {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => []),
      onvoiceschanged: null,
    },
  });

  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((text: string) => ({
      text,
      lang: '',
      voice: null,
      rate: 1,
      pitch: 1,
      volume: 1,
      onstart: null,
      onend: null,
      onerror: null,
    })),
  });

  // Мокируем navigator.clipboard
  if (typeof navigator !== 'undefined') {
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
    });
  }

  // Мокируем localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: localStorageMock,
  });
}
