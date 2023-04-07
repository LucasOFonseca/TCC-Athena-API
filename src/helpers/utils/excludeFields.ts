export function excludeFields<T>(
  value: T,
  keys: Array<keyof T>
): Omit<T, keyof T> {
  return Object.keys(value)
    .filter((key) => !keys.includes(key as keyof T))
    .reduce((obj, key) => {
      obj[key] = value[key];
      return obj;
    }, {} as T);
}
