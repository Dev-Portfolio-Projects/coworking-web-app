import type { Request, Response, NextFunction } from 'express';
import { ListSpacesUseCase } from '../../application/use-cases/spaces/list-spaces.use-case.js';
import { GetSpaceUseCase } from '../../application/use-cases/spaces/get-space.use-case.js';
import { ListAmenitiesUseCase } from '../../application/use-cases/amenities/list-amenities.use-case.js';
import { success } from '../../shared/response/index.js';

export class CatalogController {
  constructor(
    private readonly listSpacesUseCase: ListSpacesUseCase,
    private readonly getSpaceUseCase: GetSpaceUseCase,
    private readonly listAmenitiesUseCase: ListAmenitiesUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string | undefined;
      const spaces = await this.listSpacesUseCase.execute(
        status as 'AVAILABLE' | 'UNAVAILABLE' | undefined,
      );
      res.json(success(spaces, 'Espacios obtenidos exitosamente'));
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
      const amenitiesList = await this.listAmenitiesUseCase.execute();
      res.json(success(amenitiesList, 'Recursos obtenidos exitosamente'));
    } catch (error) {
      next(error);
    }
  };
}
