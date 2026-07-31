import type { Request, Response, NextFunction } from 'express';
import { GetProfileUseCase } from '../../application/use-cases/users/get-profile.use-case.js';
import { UpdateProfileUseCase } from '../../application/use-cases/users/update-profile.use-case.js';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case.js';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case.js';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case.js';
import { DeleteUserUseCase } from '../../application/use-cases/users/delete-user.use-case.js';
import { updateProfileSchema } from '../../application/dto/users/update-profile.dto.js';
import { createUserSchema } from '../../application/dto/users/create-user.dto.js';
import { updateUserSchema } from '../../application/dto/users/update-user.dto.js';
import { success } from '../../shared/response/index.js';

export class UserController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user;
      const result = await this.getProfileUseCase.execute(userId);
      res.json(success(result, 'Perfil obtenido exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user;
      const dto = updateProfileSchema.parse(req.body);
      const result = await this.updateProfileUseCase.execute(userId, dto);
      res.json(success(result, 'Perfil actualizado exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.listUsersUseCase.execute();
      res.json(success(result, 'Usuarios obtenidos exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createUserSchema.parse(req.body);
      const result = await this.createUserUseCase.execute(dto);
      res.status(201).json(success(result, 'Usuario creado exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const dto = updateUserSchema.parse(req.body);
      const result = await this.updateUserUseCase.execute(id, dto);
      res.json(success(result, 'Usuario actualizado exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      await this.deleteUserUseCase.execute(id);
      res.json(success(null, 'Usuario eliminado exitosamente'));
    } catch (error) {
      next(error);
    }
  };
}
