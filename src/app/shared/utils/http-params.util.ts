import { HttpParams } from '@angular/common/http';

type ParamValue = string | number | boolean | null | undefined;

/** يبني HttpParams ويتجاهل القيم الفاضية عشان الـ API ما يستقبلش فلاتر فاضية */
export function toHttpParams(values: Record<string, ParamValue>): HttpParams {
  let params = new HttpParams();
  for (const [key, raw] of Object.entries(values)) {
    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
