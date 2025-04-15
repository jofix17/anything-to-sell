// src/utils/caseTransform.ts

/**
 * Transforms a camelCase string to snake_case
 * @param str - The camelCase string to transform
 * @returns The snake_case string
 */
export const camelToSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Transforms a snake_case string to camelCase
 * @param str - The snake_case string to transform
 * @returns The camelCase string
 */
export const snakeToCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Deep transforms all keys in an object from camelCase to snake_case
 * Works recursively on nested objects and arrays
 * @param obj - The object with camelCase keys
 * @returns A new object with snake_case keys
 */
export const objectToCamelCase = (obj: unknown): unknown => {
  if (
    obj === null ||
    obj === undefined ||
    typeof obj !== "object" ||
    Array.isArray(obj)
  ) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return (obj as unknown[]).map((item) => objectToCamelCase(item));
  }

  return Object.keys(obj).reduce(
    (accumulator: Record<string, unknown>, key: string) => {
      const camelKey = snakeToCamelCase(key);
      accumulator[camelKey] = objectToCamelCase(
        (obj as Record<string, unknown>)[key]
      );
      return accumulator;
    },
    {}
  );
};

/**
 * Deep transforms all keys in an object from snake_case to camelCase
 * Works recursively on nested objects and arrays
 * @param obj - The object with snake_case keys
 * @returns A new object with camelCase keys
 */
export const objectToSnakeCase = (obj: unknown): unknown => {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => objectToSnakeCase(item));
  }

  return Object.keys(obj as Record<string, unknown>).reduce(
    (accumulator: Record<string, unknown>, key: string) => {
      const snakeKey = camelToSnakeCase(key);
      accumulator[snakeKey] = objectToSnakeCase(
        (obj as Record<string, unknown>)[key]
      );
      return accumulator;
    },
    {}
  );
};
