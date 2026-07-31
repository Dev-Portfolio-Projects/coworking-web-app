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

  const adminRouter = Router();
  adminRouter.use(auth.authenticate, RoleGuard.allow('ADMIN'));
  adminRouter.get('/', controller.list);
  adminRouter.post('/', controller.create);
  adminRouter.patch('/:id', controller.update);
  adminRouter.delete('/:id', controller.delete);

  router.use('/', adminRouter);

  return router;
}
