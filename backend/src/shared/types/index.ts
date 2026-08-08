export type Role = 'ADMIN' | 'STAFF' | 'CLIENT';

export type SpaceStatus = 'AVAILABLE' | 'UNAVAILABLE';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
