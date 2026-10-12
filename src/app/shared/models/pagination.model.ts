export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PageRequest {
  page: number;
  pageSize: number;
}

/** طلب صفحة + الفلاتر الخاصة بكل شاشة */
export type ListQuery<F> = PageRequest & { filters: F };
