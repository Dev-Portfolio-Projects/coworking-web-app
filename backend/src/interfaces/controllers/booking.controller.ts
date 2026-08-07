import type { Request, Response, NextFunction } from 'express';
import { CreateBookingUseCase } from '../../application/use-cases/bookings/create-booking.use-case.js';
import { CancelBookingUseCase } from '../../application/use-cases/bookings/cancel-booking.use-case.js';
import { PreReserveBookingUseCase } from '../../application/use-cases/bookings/pre-reserve-booking.use-case.js';
import { CompleteBookingUseCase } from '../../application/use-cases/bookings/complete-booking.use-case.js';
import { ListMyBookingsUseCase } from '../../application/use-cases/bookings/list-my-bookings.use-case.js';
import { ListBookingsUseCase } from '../../application/use-cases/bookings/list-bookings.use-case.js';
import { GetBookingUseCase } from '../../application/use-cases/bookings/get-booking.use-case.js';
import { CheckAvailabilityUseCase } from '../../application/use-cases/availability/check-availability.use-case.js';
import { createBookingSchema } from '../../application/dto/bookings/create-booking.dto.js';
import { preBookingSchema } from '../../application/dto/bookings/pre-booking.dto.js';
import { completeBookingSchema } from '../../application/dto/bookings/complete-booking.dto.js';
import { bookingQuerySchema } from '../../application/dto/bookings/booking-query.dto.js';
import { success } from '../../shared/response/index.js';
import { ForbiddenError } from '../../shared/errors/index.js';
import type { Role } from '../../shared/types/index.js';

export class BookingController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
    private readonly listMyBookingsUseCase: ListMyBookingsUseCase,
    private readonly listBookingsUseCase: ListBookingsUseCase,
    private readonly getBookingUseCase: GetBookingUseCase,
    private readonly checkAvailabilityUseCase: CheckAvailabilityUseCase,
    private readonly preReserveBookingUseCase: PreReserveBookingUseCase,
    private readonly completeBookingUseCase: CompleteBookingUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = (req as any).user;
      const dto = createBookingSchema.parse(req.body);
      if (dto.userId !== undefined && (role as Role) !== 'ADMIN') {
        throw new ForbiddenError('Solo un administrador puede crear reservas para otros usuarios');
      }
      const booking = await this.createBookingUseCase.execute(userId, dto);
      res.status(201).json(success(booking, 'Reserva creada exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  preReserve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user;
      const dto = preBookingSchema.parse(req.body);
      const booking = await this.preReserveBookingUseCase.execute(userId, dto);
      res.status(201).json(success(booking, 'Pre-reserva creada exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = (req as any).user;
      const id = parseInt(req.params.id as string, 10);
      const dto = completeBookingSchema.parse(req.body);
      const booking = await this.completeBookingUseCase.execute(userId, role as Role, id, dto);
      res.json(success(booking, 'Reserva completada exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = (req as any).user;
      const id = parseInt(req.params.id as string, 10);
      const booking = await this.cancelBookingUseCase.execute(userId, role as Role, id);
      res.json(success(booking, 'Reserva cancelada exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  listMy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user;
      const query = bookingQuerySchema.parse(req.query);
      const bookings = await this.listMyBookingsUseCase.execute(userId, query);
      res.json(success(bookings, 'Reservas obtenidas exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  listAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = bookingQuerySchema.parse(req.query);
      const bookings = await this.listBookingsUseCase.execute(query);
      res.json(success(bookings, 'Reservas obtenidas exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = (req as any).user;
      const id = parseInt(req.params.id as string, 10);
      const booking = await this.getBookingUseCase.execute(userId, role as Role, id);
      res.json(success(booking, 'Reserva obtenida exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  checkAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const spaceId = parseInt(req.query.spaceId as string, 10);
      const date = req.query.date as string;
      const startTime = req.query.startTime as string;
      const endTime = req.query.endTime as string;

      const result = await this.checkAvailabilityUseCase.execute(
        spaceId,
        date,
        startTime,
        endTime,
      );

      res.json(success(result, 'Disponibilidad verificada'));
    } catch (error) {
      next(error);
    }
  };
}
