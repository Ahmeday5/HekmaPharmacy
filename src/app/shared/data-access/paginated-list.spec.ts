import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { ListQuery, PagedResult } from '../models/pagination.model';
import { notFoundAsEmptyPage, paginateLocally } from '../utils/pagination.util';
import { createPaginatedList, PaginatedListConfig } from './paginated-list';

type Filters = { name: string };
type Loader = PaginatedListConfig<number, Filters>['loader'];

const ITEMS = Array.from({ length: 25 }, (_, i) => i + 1);

function createList(loader: Loader, syncWithUrl = false) {
  return TestBed.runInInjectionContext(() =>
    createPaginatedList<number, Filters>({ loader, initialFilters: { name: '' }, pageSize: 10, syncWithUrl }),
  );
}

/** يحاكي الـ backend: بيرجع 404 لما الصفحة فاضية (زي "No orders found") */
function backendLoader(data: () => number[]): Loader {
  return (query: ListQuery<Filters>): Observable<PagedResult<number>> => {
    const result = paginateLocally(data(), query);
    const response$ = result.items.length
      ? of(result)
      : throwError(() => new HttpErrorResponse({ status: 404, error: 'No orders found' }));
    return response$.pipe(notFoundAsEmptyPage(query));
  };
}

const flushNavigation = () => new Promise((resolve) => setTimeout(resolve));

describe('PaginatedList', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('loads the requested page and exposes the totals', () => {
    const list = createList((q) => of(paginateLocally(ITEMS, q)));
    list.setPage(2);

    expect(list.items()).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(list.totalItems()).toBe(25);
    expect(list.totalPages()).toBe(3);
    expect(list.rowOffset()).toBe(10);
    expect(list.loading()).toBeFalse();
    expect(list.initialized()).toBeTrue();
  });

  it('returns to the first page when filters change', () => {
    const queries: ListQuery<Filters>[] = [];
    const list = createList((q) => {
      queries.push(q);
      return of(paginateLocally(ITEMS, q));
    });
    list.setPage(3);
    list.updateFilters({ name: 'ahmed' });

    expect(queries.at(-1)).toEqual({ page: 1, pageSize: 10, filters: { name: 'ahmed' } });
    expect(list.hasFilters()).toBeTrue();
  });

  it('ignores a slow response that was superseded by a newer request', () => {
    const slow = new Subject<PagedResult<number>>();
    const list = createList((q) => (q.page === 1 ? slow : of(paginateLocally(ITEMS, q))));
    list.load();
    list.setPage(2);
    slow.next(paginateLocally(ITEMS, { page: 1, pageSize: 10 }));

    expect(list.items()[0]).toBe(11);
  });

  describe('deleting the only item on the last page', () => {
    it('goes back to the previous page instead of showing an empty table', () => {
      let data = ITEMS.slice(0, 21); // الصفحة 3 فيها عنصر واحد
      const list = createList(backendLoader(() => data));
      list.setPage(3);
      expect(list.items()).toEqual([21]);

      data = ITEMS.slice(0, 20);
      list.refreshAfterRemoval();

      expect(list.page()).toBe(2);
      expect(list.items()[0]).toBe(11);
      expect(list.error()).toBeNull();
    });

    it('recovers even with a plain refresh when the backend answers 404 for the empty page', () => {
      let data = ITEMS.slice(0, 21);
      const list = createList(backendLoader(() => data));
      list.setPage(3);

      data = ITEMS.slice(0, 20);
      list.refresh();

      expect(list.page()).toBe(2);
      expect(list.items().length).toBe(10);
      expect(list.error()).toBeNull();
    });
  });

  it('treats a 404 for a search with no results as an empty list, not an error', () => {
    const list = createList(backendLoader(() => []));
    list.updateFilters({ name: 'not-found' });

    expect(list.items()).toEqual([]);
    expect(list.error()).toBeNull();
  });

  it('exposes a readable error and clears the rows on real failures', () => {
    const list = createList(() =>
      throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Server exploded' } })),
    );
    list.load();

    expect(list.error()).toBe('Server exploded');
    expect(list.items()).toEqual([]);
    expect(list.loading()).toBeFalse();
  });

  describe('URL sync', () => {
    it('restores page, page size and filters from the URL (survives refresh)', async () => {
      await TestBed.inject(Router).navigateByUrl('/?page=2&pageSize=5&name=ahmed');
      const queries: ListQuery<Filters>[] = [];
      const list = createList((q) => {
        queries.push(q);
        return of(paginateLocally(ITEMS, q));
      }, true);
      list.load();

      expect(queries[0]).toEqual({ page: 2, pageSize: 5, filters: { name: 'ahmed' } });
    });

    it('writes the state to the URL and drops default values', async () => {
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/');
      const list = createList((q) => of(paginateLocally(ITEMS, q)), true);

      list.updateFilters({ name: 'ahmed' });
      await flushNavigation();
      list.setPage(2);
      await flushNavigation();
      expect(router.url).toBe('/?name=ahmed&page=2');

      list.resetFilters();
      await flushNavigation();
      expect(router.url).toBe('/');
    });

    it('ignores invalid values in the URL', async () => {
      await TestBed.inject(Router).navigateByUrl('/?page=-4&pageSize=abc');
      const list = createList((q) => of(paginateLocally(ITEMS, q)), true);

      expect(list.page()).toBe(1);
      expect(list.pageSize()).toBe(10);
    });
  });
});
