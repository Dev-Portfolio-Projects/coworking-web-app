import type { Request, Response, NextFunction } from 'express';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case.js';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import { registerSchema } from '../../application/dto/auth/register.dto.js';
import { loginSchema } from '../../application/dto/auth/login.dto.js';
import { success } from '../../shared/response/index.js';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = registerSchema.parse(req.body);
      const result = await this.registerUseCase.execute(dto);
      res.status(201).json(success(result, 'Usuario registrado exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await this.loginUseCase.execute(dto);
      res.json(success(result, 'Inicio de sesión exitoso'));
    } catch (error) {
      next(error);
    }
  };
}
