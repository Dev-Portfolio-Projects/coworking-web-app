import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { SpaceAvailabilityRepository } from '../../../domain/repositories/space-availability.repository.js';
import type { BookingRepository } from '../../../domain/repositories/booking.repository.js';
import { BookingService } from '../../../domain/services/booking.service.js';
import { NotFoundError } from '../../../shared/errors/index.js';

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export class GetSpaceAvailabilityUseCase {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly spaceAvailabilityRepository: SpaceAvailabilityRepository,
    private readonly bookingRepository: BookingRepository,
    private readonly bookingService: BookingService,
  ) {}

  async execute(spaceId: number) {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError('Espacio');
    }

    const slots = await this.spaceAvailabilityRepository.findBySpace(spaceId);
    const bookings = await this.bookingRepository.findActiveBySpace(spaceId);
    const today = todayString();

    const availableSlots = slots
      .filter((slot) => slot.availableDate >= today)
      .map((slot) => ({
        id: slot.id,
        availableDate: slot.availableDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        booked: bookings.some(
          (b) =>
            b.date === slot.availableDate &&
            b.startTime !== null &&
            b.endTime !== null &&
            this.bookingService.isTimeOverlap(slot.startTime, slot.endTime, b.startTime, b.endTime),
        ),
      }));

    return { spaceId, slots: availableSlots };
  }
}
