import type { Request, Response, NextFunction } from 'express';
import { ListSpacesUseCase } from '../../application/use-cases/spaces/list-spaces.use-case.js';
import { GetSpaceUseCase } from '../../application/use-cases/spaces/get-space.use-case.js';
import { ListAmenitiesUseCase } from '../../application/use-cases/amenities/list-amenities.use-case.js';
import { ListCatalogAmenitiesUseCase } from '../../application/use-cases/amenities/list-catalog-amenities.use-case.js';
import { GetSpaceAvailabilityUseCase } from '../../application/use-cases/availability/get-space-availability.use-case.js';
import { spaceListSchema } from '../../application/dto/catalog/space-list.dto.js';
import { success } from '../../shared/response/index.js';

export class CatalogController {
  constructor(
    private readonly listSpacesUseCase: ListSpacesUseCase,
    private readonly getSpaceUseCase: GetSpaceUseCase,
    private readonly listCatalogAmenitiesUseCase: ListCatalogAmenitiesUseCase,
    private readonly getSpaceAvailabilityUseCase: GetSpaceAvailabilityUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = spaceListSchema.parse(req.query);
      const result = await this.listSpacesUseCase.execute(dto);
      res.json(success(result, 'Espacios obtenidos exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const space = await this.getSpaceUseCase.execute(id);
      res.json(success(space, 'Espacio obtenido exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  listAmenities = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const amenitiesList = await this.listCatalogAmenitiesUseCase.execute();
      res.json(success(amenitiesList, 'Recursos obtenidos exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  availability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const availability = await this.getSpaceAvailabilityUseCase.execute(id);
      res.json(success(availability, 'Disponibilidad obtenida exitosamente'));
    } catch (error) {
      next(error);
    }
  };
}
