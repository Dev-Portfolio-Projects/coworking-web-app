import type { Request, Response, NextFunction } from 'express';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case.js';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import { registerSchema } from '../../application/dto/auth/register.dto.js';
import { loginSchema } from '../../application/dto/auth/login.dto.js';
import { success } from '../../shared/response/index.js';
import { env } from '../../infrastructure/config/env.js';

const TOKEN_COOKIE = 'token';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function tokenCookieOptions() {
  return {
    httpOnly: true,
    // En producción frontend (Vercel) y backend (Render) son sitios distintos:
    // SameSite=None + Secure es obligatorio para enviar la cookie en fetch/XHR cross-site.
    sameSite: (env.IS_PRODUCTION ? 'none' : 'lax') as 'lax' | 'none',
    secure: env.IS_PRODUCTION,
    maxAge: TOKEN_TTL_MS,
  };
}

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = registerSchema.parse(req.body);
      const result = await this.registerUseCase.execute(dto);
      res.cookie(TOKEN_COOKIE, result.token, tokenCookieOptions());
      res.status(201).json(success({ user: result.user }, 'Usuario registrado exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await this.loginUseCase.execute(dto);
      res.cookie(TOKEN_COOKIE, result.token, tokenCookieOptions());
      res.json(success({ user: result.user }, 'Inicio de sesión exitoso'));
    } catch (error) {
      next(error);
    }
  };

  logout = (_req: Request, res: Response) => {
    res.clearCookie(TOKEN_COOKIE, tokenCookieOptions());
    res.json(success(null, 'Sesión cerrada'));
  };
}
