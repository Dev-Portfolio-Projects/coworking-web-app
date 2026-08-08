import { Router } from 'express';
import type { ChatController } from '../controllers/chat.controller.js';
import type { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { RoleGuard } from '../middlewares/role.guard.js';

export function createChatRouter(controller: ChatController, auth: AuthMiddleware): Router {
  const router = Router();

  router.post('/', auth.authenticate, RoleGuard.allow('CLIENT'), controller.send);

  return router;
}
