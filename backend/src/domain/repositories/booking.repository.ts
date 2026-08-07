import type { BookingEntity } from '../entities/booking.entity.js';
import type { BookingStatus } from '../../shared/types/index.js';

export interface BookingListFilters {
  status?: BookingStatus;
  search?: string;
  userId?: number;
  page?: number;
  limit?: number;
}

export interface CreateBookingData {
  userId: number;
  spaceId: number;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: string;
  status: BookingStatus;
  billingName: string;
  billingDocument: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
}

export interface CompleteBookingData {
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: string;
  billingName: string;
  billingDocument: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
}

export interface BookingRepository {
  findById(id: number): Promise<BookingEntity | null>;
  findActiveBySpace(spaceId: number): Promise<BookingEntity[]>;
  findConflicting(
    spaceId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: number,
  ): Promise<BookingEntity[]>;
  findByUser(userId: number, filters?: BookingListFilters): Promise<{ items: BookingEntity[]; total: number }>;
  findAll(filters?: BookingListFilters): Promise<{ items: BookingEntity[]; total: number }>;
  createIfAvailable(data: CreateBookingData, excludeId?: number): Promise<BookingEntity | null>;
  createPreReservation(userId: number, spaceId: number): Promise<BookingEntity>;
  completeIfAvailable(id: number, data: CompleteBookingData): Promise<BookingEntity | null>;
  updateStatus(id: number, status: BookingStatus): Promise<BookingEntity>;
}
