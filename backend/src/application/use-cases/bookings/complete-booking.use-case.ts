import type { BookingRepository } from '../../../domain/repositories/booking.repository.js';
import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { SpaceAvailabilityRepository } from '../../../domain/repositories/space-availability.repository.js';
import { BookingService } from '../../../domain/services/booking.service.js';
import type { CompleteBookingDto } from '../../dto/bookings/complete-booking.dto.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../../shared/errors/index.js';
import type { Role } from '../../../shared/types/index.js';

export class CompleteBookingUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly spaceRepository: SpaceRepository,
    private readonly spaceAvailabilityRepository: SpaceAvailabilityRepository,
    private readonly bookingService: BookingService,
  ) {}

  async execute(userId: number, role: Role, id: number, dto: CompleteBookingDto) {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Reserva');
    }

    if (role !== 'ADMIN' && role !== 'STAFF' && booking.userId !== userId) {
      throw new ForbiddenError('No puedes completar esta reserva');
    }

    if (booking.status !== 'PENDING') {
      throw new ConflictError('La reserva ya fue procesada');
    }

    const space = await this.spaceRepository.findById(booking.spaceId);
    if (!space) {
      throw new NotFoundError('Espacio');
    }

    if (space.status !== 'AVAILABLE') {
      throw new ConflictError('El espacio no está disponible para reserva');
    }

    this.bookingService.assertValidRange(dto.startTime, dto.endTime);

    const availability = await this.spaceAvailabilityRepository.findBySpace(booking.spaceId);
    const slot = availability.find(
      (s) => s.availableDate === dto.date && s.startTime === dto.startTime && s.endTime === dto.endTime,
    );

    if (!slot) {
      throw new ConflictError('El horario seleccionado no está disponible para este espacio');
    }

    const hours = this.bookingService.hoursBetween(dto.startTime, dto.endTime);
    const totalPrice = this.bookingService.calculatePrice(space.priceHour, hours);

    const completed = await this.bookingRepository.completeIfAvailable(booking.id, {
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      totalPrice,
      billingName: dto.billingName,
      billingDocument: dto.billingDocument,
      billingEmail: dto.billingEmail,
      billingPhone: dto.billingPhone,
      billingAddress: dto.billingAddress,
    });

    if (!completed) {
      throw new ConflictError('El espacio ya está reservado en ese horario');
    }

    return completed;
  }
}
