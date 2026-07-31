import { Router } from 'express';
import type { AmenityController } from '../controllers/amenity.controller.js';
import type { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { RoleGuard } from '../middlewares/role.guard.js';

export function createAmenityRouter(
  controller: AmenityController,
  auth: AuthMiddleware,
): Router {
  const router = Router();

  router.use(auth.authenticate, RoleGuard.allow('ADMIN'));

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
