import { Router } from 'express';
import type { SpaceController } from '../controllers/space.controller.js';
import type { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { RoleGuard } from '../middlewares/role.guard.js';

export function createSpaceRouter(
  controller: SpaceController,
  auth: AuthMiddleware,
): Router {
  const router = Router();

  router.use(auth.authenticate, RoleGuard.allow('ADMIN', 'STAFF'));

  router.post('/', controller.create);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
