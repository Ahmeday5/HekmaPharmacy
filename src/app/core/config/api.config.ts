import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

/** يبني رابط endpoint كامل: apiUrl('Dashboard/getAllClients') */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}/api/${path.replace(/^\/+/, '')}`;
}

/** يحول مسار ملف راجع من الـ API (زي الصور) لرابط كامل */
export function apiAssetUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}
