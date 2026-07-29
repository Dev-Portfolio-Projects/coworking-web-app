import { Router } from 'express';
import { DrizzleUserRepository } from '../../infrastructure/repositories/user.repository.impl.js';
import { BcryptHashService } from '../../infrastructure/services/hash.service.impl.js';
import { JwtService } from '../../infrastructure/config/jwt.js';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case.js';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import { GetProfileUseCase } from '../../application/use-cases/users/get-profile.use-case.js';
import { UpdateProfileUseCase } from '../../application/use-cases/users/update-profile.use-case.js';
import { AuthController } from '../controllers/auth.controller.js';
import { UserController } from '../controllers/user.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { createAuthRouter } from './auth.routes.js';
import { createUserRouter } from './user.routes.js';

const userRepository = new DrizzleUserRepository();
const hashService = new BcryptHashService();
const authService = new JwtService();

const registerUseCase = new RegisterUseCase(userRepository, hashService, authService);
const loginUseCase = new LoginUseCase(userRepository, hashService, authService);
const getProfileUseCase = new GetProfileUseCase(userRepository);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

const authController = new AuthController(registerUseCase, loginUseCase);
const userController = new UserController(getProfileUseCase, updateProfileUseCase);
const authMiddleware = new AuthMiddleware(authService);

const router = Router();

router.use('/auth', createAuthRouter(authController));
router.use('/users', createUserRouter(userController, authMiddleware));

export default router;
