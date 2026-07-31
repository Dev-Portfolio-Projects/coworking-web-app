import type { Request, Response, NextFunction } from 'express';
import { CreateSpaceUseCase } from '../../application/use-cases/spaces/create-space.use-case.js';
import { UpdateSpaceUseCase } from '../../application/use-cases/spaces/update-space.use-case.js';
import { DeleteSpaceUseCase } from '../../application/use-cases/spaces/delete-space.use-case.js';
import { createSpaceSchema } from '../../application/dto/spaces/create-space.dto.js';
import { updateSpaceSchema } from '../../application/dto/spaces/update-space.dto.js';
import { success } from '../../shared/response/index.js';

export class SpaceController {
  constructor(
    private readonly createSpaceUseCase: CreateSpaceUseCase,
    private readonly updateSpaceUseCase: UpdateSpaceUseCase,
    private readonly deleteSpaceUseCase: DeleteSpaceUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createSpaceSchema.parse(req.body);
      const space = await this.createSpaceUseCase.execute(dto);
      res.status(201).json(success(space, 'Espacio creado exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const dto = updateSpaceSchema.parse(req.body);
      const space = await this.updateSpaceUseCase.execute(id, dto);
      res.json(success(space, 'Espacio actualizado exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      await this.deleteSpaceUseCase.execute(id);
      res.json(success(null, 'Espacio eliminado exitosamente'));
    } catch (error) {
      next(error);
    }
  };
}
