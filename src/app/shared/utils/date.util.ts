/** yyyy-MM-dd بالتوقيت المحلي (نفس صيغة input[type=date] وفلتر الـ API) */
export function toIsoDate(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
