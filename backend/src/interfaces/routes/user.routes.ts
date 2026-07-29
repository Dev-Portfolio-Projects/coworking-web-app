import { Router } from 'express';
import type { UserController } from '../controllers/user.controller.js';
import type { AuthMiddleware } from '../middlewares/auth.middleware.js';

export function createUserRouter(
  controller: UserController,
  auth: AuthMiddleware,
): Router {
  const router = Router();

  router.get('/profile', auth.authenticate, controller.getProfile);
  router.patch('/profile', auth.authenticate, controller.updateProfile);

  return router;
}
