import { describe, it, expect } from 'vitest';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';

describe('getPagination', () => {
  it('defaults to page 1, limit 20', () => {
    expect(getPagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('computes skip from page and limit', () => {
    expect(getPagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps limit to maxLimit and floors page at 1', () => {
    expect(getPagination({ page: '0', limit: '999' }, 50)).toEqual({ page: 1, limit: 50, skip: 0 });
  });

  it('handles non-numeric input gracefully', () => {
    expect(getPagination({ page: 'abc', limit: 'xyz' })).toEqual({ page: 1, limit: 20, skip: 0 });
  });
});

describe('buildPaginationMeta', () => {
  it('reports next/prev correctly in the middle', () => {
    expect(buildPaginationMeta(100, 2, 20)).toEqual({
      page: 2,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('clamps totalPages to at least 1 when empty', () => {
    const meta = buildPaginationMeta(0, 1, 20);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });
});
