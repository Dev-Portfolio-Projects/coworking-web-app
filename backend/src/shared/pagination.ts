import type { Paginated } from './types/index.js';

export function paginate<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
  const totalPages = total > 0 ? (limit > 0 ? Math.ceil(total / limit) : 1) : 0;
  return { items, meta: { page, limit, total, totalPages } };
}
