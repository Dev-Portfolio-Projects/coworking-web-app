import { Router } from 'express';
import type { BookingController } from '../controllers/booking.controller.js';
import type { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { RoleGuard } from '../middlewares/role.guard.js';

export function createBookingRouter(
  controller: BookingController,
  auth: AuthMiddleware,
): Router {
  const router = Router();

  router.use(auth.authenticate);

  router.get('/', RoleGuard.allow('ADMIN', 'STAFF'), controller.listAll);
  router.get('/availability/check', controller.checkAvailability);
  router.get('/my', controller.listMy);
  router.get('/:id', controller.getById);
  router.post('/pre', controller.preReserve);
  router.post('/', controller.create);
  router.patch('/:id/complete', controller.complete);
  router.patch('/:id/cancel', controller.cancel);

  return router;
}
