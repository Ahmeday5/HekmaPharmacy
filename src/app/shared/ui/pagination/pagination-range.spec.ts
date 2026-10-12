import { buildPaginationRange, PaginationItem } from './pagination-range';

const render = (items: PaginationItem[]): string =>
  items.map((item) => (item.type === 'page' ? item.page : '…')).join(' ');

describe('buildPaginationRange', () => {
  it('shows every page when they fit', () => {
    expect(render(buildPaginationRange(1, 1, 1, 1))).toBe('1');
    expect(render(buildPaginationRange(2, 3, 1, 1))).toBe('1 2 3');
    expect(render(buildPaginationRange(4, 7, 1, 1))).toBe('1 2 3 4 5 6 7');
  });

  it('collapses the end when on the first pages', () => {
    expect(render(buildPaginationRange(1, 100, 1, 1))).toBe('1 2 3 4 5 … 100');
  });

  it('collapses both sides when in the middle', () => {
    expect(render(buildPaginationRange(50, 100, 1, 1))).toBe('1 … 49 50 51 … 100');
  });

  it('collapses the start when on the last pages', () => {
    expect(render(buildPaginationRange(100, 100, 1, 1))).toBe('1 … 96 97 98 99 100');
  });

  it('supports a bigger boundary (first/last two pages)', () => {
    expect(render(buildPaginationRange(50, 100, 1, 2))).toBe('1 2 … 49 50 51 … 99 100');
  });

  it('keeps a constant number of items so the bar does not jump', () => {
    const lengths = [1, 3, 5, 50, 96, 100].map((page) => buildPaginationRange(page, 100, 1, 1).length);
    expect(new Set(lengths).size).toBe(1);
  });

  it('shows only the current page between ellipses on mobile (siblings = 0)', () => {
    expect(render(buildPaginationRange(50, 100, 0, 1))).toBe('1 … 50 … 100');
  });
});
