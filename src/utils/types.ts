/**
 * Utility types для работы с TypeScript
 */

/**
 * DeepPartial - делает все свойства объекта (включая вложенные) опциональными
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * DeepRequired - делает все свойства объекта (включая вложенные) обязательными
 */
export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

/**
 * Nullable - делает тип или null
 */
export type Nullable<T> = T | null;

/**
 * NonNullable - убирает null и undefined из типа
 * (встроенный тип TypeScript, но экспортируем для удобства)
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * KeysOfType - получает ключи объекта, значения которых имеют определенный тип
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * ValuesOfType - получает значения объекта определенного типа
 */
export type ValuesOfType<T, U> = T[KeysOfType<T, U>];

/**
 * OptionalKeys - получает ключи объекта, которые являются опциональными
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * RequiredKeys - получает ключи объекта, которые являются обязательными
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * ReadonlyKeys - получает ключи объекта, которые являются readonly
 */
export type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>;
};

type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

/**
 * Mutable - делает все readonly свойства изменяемыми
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * DeepMutable - делает все readonly свойства (включая вложенные) изменяемыми
 */
export type DeepMutable<T> = T extends object
  ? {
      -readonly [P in keyof T]: DeepMutable<T[P]>;
    }
  : T;

/**
 * ArrayElement - получает тип элемента массива
 */
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * PromiseReturnType - получает тип значения, которое возвращает Promise
 */
export type PromiseReturnType<T extends Promise<unknown>> = T extends Promise<infer R> ? R : never;

/**
 * Awaited - получает тип значения после await (встроенный тип TypeScript 4.5+)
 * Экспортируем для удобства и обратной совместимости
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Branded type helper - создает branded type для дополнительной типобезопасности
 */
export type Brand<T, B> = T & { readonly __brand: B };

/**
 * Nominal type helper - создает nominal type (аналогично branded, но с метаданными)
 */
export type Nominal<T, B> = T & { readonly __nominal: B };

/**
 * ExtractFunction - извлекает тип функции из типа
 */
export type ExtractFunction<T> = T extends (...args: infer Args) => infer Return
  ? (...args: Args) => Return
  : never;

/**
 * FunctionKeys - получает ключи объекта, значения которых являются функциями
 */
export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

/**
 * NonFunctionKeys - получает ключи объекта, значения которых не являются функциями
 */
export type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K;
}[keyof T];
