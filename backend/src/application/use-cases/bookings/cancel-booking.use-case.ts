import type { BookingRepository } from '../../../domain/repositories/booking.repository.js';
import type { Role } from '../../../shared/types/index.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../shared/errors/index.js';

export class CancelBookingUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(userId: number, userRole: Role, bookingId: number) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Reserva');
    }

    if (booking.userId !== userId && userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new ForbiddenError('No puedes cancelar esta reserva');
    }

    if (booking.status === 'CANCELLED') {
      throw new ConflictError('La reserva ya está cancelada');
    }

    return this.bookingRepository.updateStatus(bookingId, 'CANCELLED');
  }
}
