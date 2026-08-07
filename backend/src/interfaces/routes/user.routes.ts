import { Router } from 'express';
import type { UserController } from '../controllers/user.controller.js';
import type { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { RoleGuard } from '../middlewares/role.guard.js';

export function createUserRouter(
  controller: UserController,
  auth: AuthMiddleware,
): Router {
  const router = Router();

  router.get('/profile', auth.authenticate, controller.getProfile);
  router.patch('/profile', auth.authenticate, controller.updateProfile);

  const staffRouter = Router();
  staffRouter.use(auth.authenticate, RoleGuard.allow('ADMIN', 'STAFF'));
  staffRouter.get('/', controller.list);

  const adminRouter = Router();
  adminRouter.use(auth.authenticate, RoleGuard.allow('ADMIN'));
  adminRouter.post('/', controller.create);
  adminRouter.patch('/:id', controller.update);
  adminRouter.delete('/:id', controller.delete);

  router.use('/', staffRouter);
  router.use('/', adminRouter);

  return router;
}
