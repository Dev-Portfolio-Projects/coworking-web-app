import type { BookingRepository } from '../../../domain/repositories/booking.repository.js';
import type { BookingQueryDto } from '../../dto/bookings/booking-query.dto.js';
import type { Paginated } from '../../../shared/types/index.js';
import type { BookingEntity } from '../../../domain/entities/booking.entity.js';
import { paginate } from '../../../shared/pagination.js';

export class ListMyBookingsUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(userId: number, dto: BookingQueryDto): Promise<Paginated<BookingEntity>> {
    const { page, limit, status, search } = dto;
    const { items, total } = await this.bookingRepository.findByUser(userId, { search, status, page, limit });

    return paginate(items, total, page, limit);
  }
}
