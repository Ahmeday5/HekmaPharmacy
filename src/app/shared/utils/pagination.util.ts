import { HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  EMPTY,
  expand,
  map,
  MonoTypeOperatorFunction,
  Observable,
  of,
  OperatorFunction,
  reduce,
  throwError,
} from 'rxjs';
import { PagedResult, PageRequest } from '../models/pagination.model';

export function emptyPage<T>(request: PageRequest): PagedResult<T> {
  return { items: [], page: request.page, pageSize: request.pageSize, totalItems: 0, totalPages: 0 };
}

/**
 * الـ backend بيرجع 404 (زي "No orders found") لما الصفحة أو نتيجة البحث فاضية.
 * ده مش خطأ بالنسبة لنا — بنحوله لصفحة فاضية عشان الواجهة تعرض empty state وتتصرف صح.
 */
export function notFoundAsEmptyPage<T>(request: PageRequest): MonoTypeOperatorFunction<PagedResult<T>> {
  return notFoundAs(() => emptyPage<T>(request));
}

/** نفس الفكرة لأي endpoint بيرجع ليستة */
export function notFoundAs<T, R = T>(fallback: () => R): OperatorFunction<T, T | R> {
  return catchError((error: unknown) =>
    error instanceof HttpErrorResponse && error.status === 404 ? of(fallback()) : throwError(() => error),
  );
}

/** يضمن شكل ثابت للـ response حتى لو الـ API رجع null أو حقول ناقصة */
export function normalizePagedResult<TDto, T>(
  response: Partial<PagedResult<TDto>> | null | undefined,
  request: PageRequest,
  mapItem: (dto: TDto) => T,
): PagedResult<T> {
  const items = (response?.items ?? []).map(mapItem);
  const totalItems = response?.totalItems ?? items.length;
  const pageSize = response?.pageSize || request.pageSize;
  return {
    items,
    page: response?.page || request.page,
    pageSize,
    totalItems,
    totalPages: response?.totalPages ?? Math.ceil(totalItems / pageSize),
  };
}

/** Pagination على الـ client لـ endpoints بترجع الليستة كلها مرة واحدة */
export function paginateLocally<T>(items: readonly T[], request: PageRequest): PagedResult<T> {
  const start = (request.page - 1) * request.pageSize;
  return {
    items: items.slice(start, start + request.pageSize),
    page: request.page,
    pageSize: request.pageSize,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / request.pageSize),
  };
}

/** يجيب كل الصفحات بالتتابع ويرجعهم array واحد (للـ dropdowns والـ lookups) */
export function fetchAllPages<T>(
  loadPage: (request: PageRequest) => Observable<PagedResult<T>>,
  pageSize = 200,
): Observable<T[]> {
  return loadPage({ page: 1, pageSize }).pipe(
    expand((result) =>
      result.page < result.totalPages
        ? loadPage({ page: result.page + 1, pageSize })
        : EMPTY,
    ),
    map((result) => result.items),
    reduce((all, items) => all.concat(items), [] as T[]),
  );
}
