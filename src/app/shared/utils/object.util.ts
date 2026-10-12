/** يشيل المسافات من أول وآخر كل القيم النصية في object */
export function trimStrings<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) => [key, typeof v === 'string' ? v.trim() : v]),
  ) as T;
}
