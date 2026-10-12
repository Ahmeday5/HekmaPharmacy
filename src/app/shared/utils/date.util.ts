/** yyyy-MM-dd بالتوقيت المحلي (نفس صيغة input[type=date] وفلتر الـ API) */
export function toIsoDate(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** نفس اليوم مع إزاحة بالأيام: shiftDays(-1) = إمبارح */
export function shiftDays(days: number, from: Date = new Date()): Date {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date;
}
