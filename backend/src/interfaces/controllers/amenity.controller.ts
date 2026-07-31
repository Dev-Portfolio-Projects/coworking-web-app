import type { Request, Response, NextFunction } from 'express';
import { ListAmenitiesUseCase } from '../../application/use-cases/amenities/list-amenities.use-case.js';
import { GetAmenityUseCase } from '../../application/use-cases/amenities/get-amenity.use-case.js';
import { CreateAmenityUseCase } from '../../application/use-cases/amenities/create-amenity.use-case.js';
import { UpdateAmenityUseCase } from '../../application/use-cases/amenities/update-amenity.use-case.js';
import { DeleteAmenityUseCase } from '../../application/use-cases/amenities/delete-amenity.use-case.js';
import { createAmenitySchema } from '../../application/dto/amenities/create-amenity.dto.js';
import { updateAmenitySchema } from '../../application/dto/amenities/update-amenity.dto.js';
import { success } from '../../shared/response/index.js';

export class AmenityController {
  constructor(
    private readonly listAmenitiesUseCase: ListAmenitiesUseCase,
    private readonly getAmenityUseCase: GetAmenityUseCase,
    private readonly createAmenityUseCase: CreateAmenityUseCase,
    private readonly updateAmenityUseCase: UpdateAmenityUseCase,
    private readonly deleteAmenityUseCase: DeleteAmenityUseCase,
  ) {}

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.listAmenitiesUseCase.execute();
      res.json(success(result, 'Recursos obtenidos exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.getAmenityUseCase.execute(id);
      res.json(success(result, 'Recurso obtenido exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createAmenitySchema.parse(req.body);
      const result = await this.createAmenityUseCase.execute(dto);
      res.status(201).json(success(result, 'Recurso creado exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const dto = updateAmenitySchema.parse(req.body);
      const result = await this.updateAmenityUseCase.execute(id, dto);
      res.json(success(result, 'Recurso actualizado exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      await this.deleteAmenityUseCase.execute(id);
      res.json(success(null, 'Recurso eliminado exitosamente'));
    } catch (error) {
      next(error);
    }
  };
}
