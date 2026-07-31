import { Router } from 'express';
import { DrizzleUserRepository } from '../../infrastructure/repositories/user.repository.impl.js';
import { DrizzleSpaceRepository } from '../../infrastructure/repositories/space.repository.impl.js';
import { DrizzleAmenityRepository } from '../../infrastructure/repositories/amenity.repository.impl.js';
import { BcryptHashService } from '../../infrastructure/services/hash.service.impl.js';
import { JwtService } from '../../infrastructure/config/jwt.js';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case.js';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import { GetProfileUseCase } from '../../application/use-cases/users/get-profile.use-case.js';
import { UpdateProfileUseCase } from '../../application/use-cases/users/update-profile.use-case.js';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case.js';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case.js';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case.js';
import { DeleteUserUseCase } from '../../application/use-cases/users/delete-user.use-case.js';
import { ListSpacesUseCase } from '../../application/use-cases/spaces/list-spaces.use-case.js';
import { GetSpaceUseCase } from '../../application/use-cases/spaces/get-space.use-case.js';
import { CreateSpaceUseCase } from '../../application/use-cases/spaces/create-space.use-case.js';
import { UpdateSpaceUseCase } from '../../application/use-cases/spaces/update-space.use-case.js';
import { DeleteSpaceUseCase } from '../../application/use-cases/spaces/delete-space.use-case.js';
import { ListAmenitiesUseCase } from '../../application/use-cases/amenities/list-amenities.use-case.js';
import { GetAmenityUseCase } from '../../application/use-cases/amenities/get-amenity.use-case.js';
import { CreateAmenityUseCase } from '../../application/use-cases/amenities/create-amenity.use-case.js';
import { UpdateAmenityUseCase } from '../../application/use-cases/amenities/update-amenity.use-case.js';
import { DeleteAmenityUseCase } from '../../application/use-cases/amenities/delete-amenity.use-case.js';
import { AuthController } from '../controllers/auth.controller.js';
import { UserController } from '../controllers/user.controller.js';
import { CatalogController } from '../controllers/catalog.controller.js';
import { SpaceController } from '../controllers/space.controller.js';
import { AmenityController } from '../controllers/amenity.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { createAuthRouter } from './auth.routes.js';
import { createUserRouter } from './user.routes.js';
import { createCatalogRouter } from './catalog.routes.js';
import { createSpaceRouter } from './space.routes.js';
import { createAmenityRouter } from './amenity.routes.js';

const userRepository = new DrizzleUserRepository();
const spaceRepository = new DrizzleSpaceRepository();
const amenityRepository = new DrizzleAmenityRepository();
const hashService = new BcryptHashService();
const authService = new JwtService();

const registerUseCase = new RegisterUseCase(userRepository, hashService, authService);
const loginUseCase = new LoginUseCase(userRepository, hashService, authService);
const getProfileUseCase = new GetProfileUseCase(userRepository);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
const listUsersUseCase = new ListUsersUseCase(userRepository);
const createUserUseCase = new CreateUserUseCase(userRepository, hashService);
const updateUserUseCase = new UpdateUserUseCase(userRepository, hashService);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const listSpacesUseCase = new ListSpacesUseCase(spaceRepository);
const getSpaceUseCase = new GetSpaceUseCase(spaceRepository);
const createSpaceUseCase = new CreateSpaceUseCase(spaceRepository);
const updateSpaceUseCase = new UpdateSpaceUseCase(spaceRepository);
const deleteSpaceUseCase = new DeleteSpaceUseCase(spaceRepository);
const listAmenitiesUseCase = new ListAmenitiesUseCase(spaceRepository);
const getAmenityUseCase = new GetAmenityUseCase(amenityRepository);
const createAmenityUseCase = new CreateAmenityUseCase(amenityRepository);
const updateAmenityUseCase = new UpdateAmenityUseCase(amenityRepository);
const deleteAmenityUseCase = new DeleteAmenityUseCase(amenityRepository);

const authController = new AuthController(registerUseCase, loginUseCase);
const userController = new UserController(
  getProfileUseCase, updateProfileUseCase,
  listUsersUseCase, createUserUseCase, updateUserUseCase, deleteUserUseCase,
);
const catalogController = new CatalogController(listSpacesUseCase, getSpaceUseCase, listAmenitiesUseCase);
const spaceAdminController = new SpaceController(createSpaceUseCase, updateSpaceUseCase, deleteSpaceUseCase);
const amenityAdminController = new AmenityController(
  listAmenitiesUseCase, getAmenityUseCase, createAmenityUseCase, updateAmenityUseCase, deleteAmenityUseCase,
);
const authMiddleware = new AuthMiddleware(authService);

const router = Router();

router.use('/auth', createAuthRouter(authController));
router.use('/users', createUserRouter(userController, authMiddleware));
router.use('/catalog', createCatalogRouter(catalogController));
router.use('/spaces', createSpaceRouter(spaceAdminController, authMiddleware));
router.use('/amenities', createAmenityRouter(amenityAdminController, authMiddleware));

export default router;
