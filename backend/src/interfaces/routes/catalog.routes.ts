import { Router } from 'express';
import type { CatalogController } from '../controllers/catalog.controller.js';

export function createCatalogRouter(controller: CatalogController): Router {
  const router = Router();

  router.get('/spaces', controller.list);
  router.get('/spaces/:id', controller.getById);
  router.get('/spaces/:id/availability', controller.availability);
  router.get('/amenities', controller.listAmenities);

  return router;
}
