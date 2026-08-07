import type { BookingRepository } from '../../../domain/repositories/booking.repository.js';
import type { Role } from '../../../shared/types/index.js';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/index.js';

export class GetBookingUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(userId: number, userRole: Role, bookingId: number) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Reserva');
    }

    if (booking.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('No puedes ver esta reserva');
    }

    return booking;
  }
}
