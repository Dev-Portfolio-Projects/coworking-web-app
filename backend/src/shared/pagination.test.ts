import { describe, it, expect } from 'vitest';
import { paginate } from './pagination.js';

describe('paginate', () => {
  it('calcula totalPages redondeando hacia arriba', () => {
    const result = paginate([1, 2], 5, 1, 2);
    expect(result.items).toEqual([1, 2]);
    expect(result.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });
  });

  it('devuelve 0 totalPages cuando no hay total', () => {
    const result = paginate([], 0, 1, 12);
    expect(result.meta.totalPages).toBe(0);
  });

  it('con limit 0 (sin paginar) usa una sola página', () => {
    const result = paginate([1, 2, 3], 3, 1, 0);
    expect(result.meta.totalPages).toBe(1);
  });

  it('una página exacta no se redondea hacia arriba', () => {
    const result = paginate([1, 2], 2, 1, 2);
    expect(result.meta.totalPages).toBe(1);
  });
});
