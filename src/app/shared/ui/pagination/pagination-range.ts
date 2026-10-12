export type PaginationItem =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; key: 'start' | 'end' };

/**
 * يحسب الأرقام اللي تظهر في الـ pagination.
 * مثال (100 صفحة، الحالية 50، sibling=1، boundary=1):
 *   1 … 49 50 51 … 100
 * عدد العناصر ثابت دايمًا (boundary*2 + sibling*2 + 3) فالشريط ما بيتحركش وانت بتتنقل.
 */
export function buildPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationItem[] {
  const range = (start: number, end: number): number[] =>
    end < start ? [] : Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const startPages = range(1, Math.min(boundaryCount, totalPages));
  const endPages = range(Math.max(totalPages - boundaryCount + 1, boundaryCount + 1), totalPages);

  const siblingsStart = Math.max(
    Math.min(currentPage - siblingCount, totalPages - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(currentPage + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : totalPages - 1,
  );

  const items: PaginationItem[] = startPages.map((page) => ({ type: 'page', page }));

  if (siblingsStart > boundaryCount + 2) {
    items.push({ type: 'ellipsis', key: 'start' });
  } else if (boundaryCount + 1 < totalPages - boundaryCount) {
    items.push({ type: 'page', page: boundaryCount + 1 });
  }

  items.push(...range(siblingsStart, siblingsEnd).map((page): PaginationItem => ({ type: 'page', page })));

  if (siblingsEnd < totalPages - boundaryCount - 1) {
    items.push({ type: 'ellipsis', key: 'end' });
  } else if (totalPages - boundaryCount > boundaryCount) {
    items.push({ type: 'page', page: totalPages - boundaryCount });
  }

  items.push(...endPages.map((page): PaginationItem => ({ type: 'page', page })));
  return items;
}
