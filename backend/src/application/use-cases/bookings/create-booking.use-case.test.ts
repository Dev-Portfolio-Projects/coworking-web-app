import { describe, it, expect, vi } from 'vitest';
import { CreateBookingUseCase } from './create-booking.use-case.js';
import type { BookingRepository } from '../../../domain/repositories/booking.repository.js';
import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { SpaceAvailabilityRepository } from '../../../domain/repositories/space-availability.repository.js';
import { BookingService } from '../../../domain/services/booking.service.js';
import type { CreateBookingDto } from '../../dto/bookings/create-booking.dto.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/index.js';

const dto: CreateBookingDto = {
  userId: undefined,
  spaceId: 1,
  date: '2026-08-06',
  startTime: '09:00',
  endTime: '11:00',
  billingName: 'Ana Pérez',
  billingDocument: '12345678',
  billingEmail: 'ana@mail.com',
  billingPhone: '555-0100',
  billingAddress: 'Av. Principal 123',
};

const availableSlot = {
  spaceId: 1,
  availableDate: '2026-08-06',
  startTime: '09:00',
  endTime: '11:00',
  price: '10.00',
};

function buildUseCase() {
  const bookingRepository = {
    findById: vi.fn(),
    findActiveBySpace: vi.fn(),
    findConflicting: vi.fn(),
    findByUser: vi.fn(),
    findAll: vi.fn(),
    createIfAvailable: vi.fn(),
    createPreReservation: vi.fn(),
    completeIfAvailable: vi.fn(),
    updateStatus: vi.fn(),
  } satisfies Partial<BookingRepository>;

  const spaceRepository = {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } satisfies Partial<SpaceRepository>;

  const spaceAvailabilityRepository = {
    findBySpace: vi.fn(),
    setForSpace: vi.fn(),
  } satisfies Partial<SpaceAvailabilityRepository>;

  const useCase = new CreateBookingUseCase(
    bookingRepository as BookingRepository,
    spaceRepository as SpaceRepository,
    spaceAvailabilityRepository as SpaceAvailabilityRepository,
    new BookingService(),
  );

  return {
    useCase,
    bookingRepository,
    spaceRepository,
    spaceAvailabilityRepository,
  };
}

describe('CreateBookingUseCase', () => {
  it('lanza NotFoundError si el espacio no existe', async () => {
    const { useCase, spaceRepository } = buildUseCase();
    spaceRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(1, dto)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lanza ConflictError si el espacio no está disponible', async () => {
    const { useCase, spaceRepository } = buildUseCase();
    spaceRepository.findById.mockResolvedValue({ id: 1, status: 'UNAVAILABLE' });

    await expect(useCase.execute(1, dto)).rejects.toBeInstanceOf(ConflictError);
  });

  it('lanza ConflictError si el horario no está en la disponibilidad', async () => {
    const { useCase, spaceRepository, spaceAvailabilityRepository } = buildUseCase();
    spaceRepository.findById.mockResolvedValue({ id: 1, status: 'AVAILABLE' });
    spaceAvailabilityRepository.findBySpace.mockResolvedValue([]);

    await expect(useCase.execute(1, dto)).rejects.toBeInstanceOf(ConflictError);
  });

  it('lanza ConflictError si el espacio ya está reservado en ese horario', async () => {
    const { useCase, spaceRepository, spaceAvailabilityRepository, bookingRepository } = buildUseCase();
    spaceRepository.findById.mockResolvedValue({ id: 1, status: 'AVAILABLE', priceHour: '10.00' });
    spaceAvailabilityRepository.findBySpace.mockResolvedValue([availableSlot]);
    bookingRepository.createIfAvailable.mockResolvedValue(null);

    await expect(useCase.execute(1, dto)).rejects.toBeInstanceOf(ConflictError);
  });

  it('crea la reserva con el precio calculado', async () => {
    const { useCase, spaceRepository, spaceAvailabilityRepository, bookingRepository } = buildUseCase();
    spaceRepository.findById.mockResolvedValue({ id: 1, status: 'AVAILABLE', priceHour: '10.00' });
    spaceAvailabilityRepository.findBySpace.mockResolvedValue([availableSlot]);
    bookingRepository.createIfAvailable.mockResolvedValue({ id: 10 });

    const result = await useCase.execute(1, dto);

    expect(result).toEqual({ id: 10 });
    expect(bookingRepository.createIfAvailable).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, spaceId: 1, status: 'PENDING', totalPrice: '20.00' }),
    );
  });

  it('usa dto.userId cuando viene explícito', async () => {
    const { useCase, spaceRepository, spaceAvailabilityRepository, bookingRepository } = buildUseCase();
    spaceRepository.findById.mockResolvedValue({ id: 1, status: 'AVAILABLE', priceHour: '10.00' });
    spaceAvailabilityRepository.findBySpace.mockResolvedValue([availableSlot]);
    bookingRepository.createIfAvailable.mockResolvedValue({ id: 10 });

    await useCase.execute(1, { ...dto, userId: 99 });

    expect(bookingRepository.createIfAvailable).toHaveBeenCalledWith(expect.objectContaining({ userId: 99 }));
  });
});
