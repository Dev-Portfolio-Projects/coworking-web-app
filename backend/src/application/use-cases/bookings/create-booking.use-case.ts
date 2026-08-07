import type { BookingRepository } from '../../../domain/repositories/booking.repository.js';
import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { SpaceAvailabilityRepository } from '../../../domain/repositories/space-availability.repository.js';
import { BookingService } from '../../../domain/services/booking.service.js';
import type { CreateBookingDto } from '../../dto/bookings/create-booking.dto.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/index.js';

export class CreateBookingUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly spaceRepository: SpaceRepository,
    private readonly spaceAvailabilityRepository: SpaceAvailabilityRepository,
    private readonly bookingService: BookingService,
  ) {}

  async execute(userId: number, dto: CreateBookingDto) {
    const targetUserId = dto.userId ?? userId;
    const space = await this.spaceRepository.findById(dto.spaceId);
    if (!space) {
      throw new NotFoundError('Espacio');
    }

    if (space.status !== 'AVAILABLE') {
      throw new ConflictError('El espacio no está disponible para reserva');
    }

    this.bookingService.assertValidRange(dto.startTime, dto.endTime);

    const availability = await this.spaceAvailabilityRepository.findBySpace(dto.spaceId);
    const slot = availability.find(
      (s) => s.availableDate === dto.date && s.startTime === dto.startTime && s.endTime === dto.endTime,
    );

    if (!slot) {
      throw new ConflictError('El horario seleccionado no está disponible para este espacio');
    }

    const hours = this.bookingService.hoursBetween(dto.startTime, dto.endTime);
    const totalPrice = this.bookingService.calculatePrice(space.priceHour, hours);

    const booking = await this.bookingRepository.createIfAvailable({
      userId: targetUserId,
      spaceId: dto.spaceId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      totalPrice,
      status: 'PENDING',
      billingName: dto.billingName,
      billingDocument: dto.billingDocument,
      billingEmail: dto.billingEmail,
      billingPhone: dto.billingPhone,
      billingAddress: dto.billingAddress,
    });

    if (!booking) {
      throw new ConflictError('El espacio ya está reservado en ese horario');
    }

    return booking;
  }
}
