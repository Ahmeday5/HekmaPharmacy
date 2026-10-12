import { Injectable, Signal, signal } from '@angular/core';

/** نفس breakpoints بتاعة Bootstrap */
const QUERIES = {
  mobile: '(max-width: 575.98px)',
  compact: '(max-width: 991.98px)',
} as const;

/** Signals للـ breakpoints — المصدر الوحيد لأي منطق responsive في الـ TypeScript */
@Injectable({ providedIn: 'root' })
export class BreakpointService {
  /** موبايل */
  readonly isMobile = watchMedia(QUERIES.mobile);
  /** تابلت وأصغر — السايدبار بيتحول لـ drawer */
  readonly isCompact = watchMedia(QUERIES.compact);
}

function watchMedia(query: string): Signal<boolean> {
  const media = window.matchMedia(query);
  const matches = signal(media.matches);
  // الـ service عايشة طول عمر التطبيق فمش محتاجين نشيل الـ listener
  media.addEventListener('change', (event) => matches.set(event.matches));
  return matches.asReadonly();
}
