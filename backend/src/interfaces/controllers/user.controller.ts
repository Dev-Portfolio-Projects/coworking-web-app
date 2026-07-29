import type { Request, Response, NextFunction } from 'express';
import { GetProfileUseCase } from '../../application/use-cases/users/get-profile.use-case.js';
import { UpdateProfileUseCase } from '../../application/use-cases/users/update-profile.use-case.js';
import { updateProfileSchema } from '../../application/dto/users/update-profile.dto.js';

export class UserController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
  ) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user;
      const result = await this.getProfileUseCase.execute(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user;
      const dto = updateProfileSchema.parse(req.body);
      const result = await this.updateProfileUseCase.execute(userId, dto);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
