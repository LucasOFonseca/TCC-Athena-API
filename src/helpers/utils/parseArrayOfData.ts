import { excludeFields } from '.';

export function parseArrayOfData<T>(
  array: T[],
  keys: Array<keyof T>
): Array<Omit<T, keyof T>> {
  return array.map((item) => excludeFields(item, keys));
}
