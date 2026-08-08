import type { BookingRepository } from '../../../domain/repositories/booking.repository.js';
import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import { BookingService } from '../../../domain/services/booking.service.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class CheckAvailabilityUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly spaceRepository: SpaceRepository,
    private readonly bookingService: BookingService,
  ) {}

  async execute(spaceId: number, date: string, startTime: string, endTime: string) {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError('Espacio');
    }

    this.bookingService.assertValidRange(startTime, endTime);

    if (space.status !== 'AVAILABLE') {
      return { available: false, reason: 'El espacio no está disponible para reserva' };
    }

    const conflicts = await this.bookingRepository.findConflicting(
      spaceId,
      date,
      startTime,
      endTime,
    );

    return {
      available: conflicts.length === 0,
      conflicts: conflicts.length,
    };
  }
}
