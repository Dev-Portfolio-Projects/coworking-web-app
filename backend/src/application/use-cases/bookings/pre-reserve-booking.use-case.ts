import type { BookingRepository } from '../../../domain/repositories/booking.repository.js';
import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { PreBookingDto } from '../../dto/bookings/pre-booking.dto.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/index.js';

export class PreReserveBookingUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly spaceRepository: SpaceRepository,
  ) {}

  async execute(userId: number, dto: PreBookingDto) {
    const space = await this.spaceRepository.findById(dto.spaceId);
    if (!space) {
      throw new NotFoundError('Espacio');
    }

    if (space.status !== 'AVAILABLE') {
      throw new ConflictError('El espacio no está disponible para reserva');
    }

    return this.bookingRepository.createPreReservation(userId, dto.spaceId);
  }
}
