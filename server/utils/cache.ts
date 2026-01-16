/**
 * Простой in-memory cache для API запросов
 * Используется для кеширования часто запрашиваемых данных
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live в миллисекундах
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // По умолчанию TTL = 5 минут
    this.defaultTTL = defaultTTL;
  }

  /**
   * Получить значение из кеша
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Проверяем, не истек ли TTL
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Сохранить значение в кеш
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Удалить значение из кеша
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Удалить все ключи, соответствующие паттерну
   * Поддерживает простые паттерны с * в конце
   */
  deletePattern(pattern: string): void {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.delete(pattern);
    }
  }

  /**
   * Очистить весь кеш
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Удалить все истекшие записи
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Получить размер кеша
   */
  size(): number {
    return this.cache.size;
  }
}

// Создаем глобальный экземпляр кеша
const cache = new MemoryCache();

// Периодическая очистка истекших записей (каждые 10 минут)
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      cache.cleanup();
    },
    10 * 60 * 1000
  );
}

export default cache;
