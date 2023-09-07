export function excludeFields<T>(
  value: T,
  keys: Array<keyof T>
): Omit<T, keyof T> {
  return Object.keys(value)
    .filter((key) => !keys.includes(key as keyof T) && value[key] !== null)
    .reduce((obj, key) => {
      const modifiedObj = obj;

      modifiedObj[key] = value[key];

      return modifiedObj;
    }, {} as T);
}
