import { Router } from 'express';
import type { DashboardController } from '../controllers/dashboard.controller.js';
import type { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { RoleGuard } from '../middlewares/role.guard.js';

export function createDashboardRouter(
  controller: DashboardController,
  auth: AuthMiddleware,
): Router {
  const router = Router();

  router.use(auth.authenticate);
  router.use(RoleGuard.allow('ADMIN'));

  router.get('/', controller.getData);

  return router;
}
