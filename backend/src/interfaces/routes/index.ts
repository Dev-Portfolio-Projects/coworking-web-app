import { Router } from 'express';
import { DrizzleUserRepository } from '../../infrastructure/repositories/user.repository.impl.js';
import { DrizzleSpaceRepository } from '../../infrastructure/repositories/space.repository.impl.js';
import { DrizzleAmenityRepository } from '../../infrastructure/repositories/amenity.repository.impl.js';
import { DrizzleBookingRepository } from '../../infrastructure/repositories/booking.repository.impl.js';
import { DrizzleSpaceAvailabilityRepository } from '../../infrastructure/repositories/space-availability.repository.impl.js';
import { BcryptHashService } from '../../infrastructure/services/hash.service.impl.js';
import { JwtService } from '../../infrastructure/config/jwt.js';
import { BookingService } from '../../domain/services/booking.service.js';
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
import { ListSpaceAvailabilityUseCase } from '../../application/use-cases/spaces/list-space-availability.use-case.js';
import { SetSpaceAvailabilityUseCase } from '../../application/use-cases/spaces/set-space-availability.use-case.js';
import { ListAmenitiesUseCase } from '../../application/use-cases/amenities/list-amenities.use-case.js';
import { ListCatalogAmenitiesUseCase } from '../../application/use-cases/amenities/list-catalog-amenities.use-case.js';
import { GetAmenityUseCase } from '../../application/use-cases/amenities/get-amenity.use-case.js';
import { CreateAmenityUseCase } from '../../application/use-cases/amenities/create-amenity.use-case.js';
import { UpdateAmenityUseCase } from '../../application/use-cases/amenities/update-amenity.use-case.js';
import { DeleteAmenityUseCase } from '../../application/use-cases/amenities/delete-amenity.use-case.js';
import { CreateBookingUseCase } from '../../application/use-cases/bookings/create-booking.use-case.js';
import { CancelBookingUseCase } from '../../application/use-cases/bookings/cancel-booking.use-case.js';
import { PreReserveBookingUseCase } from '../../application/use-cases/bookings/pre-reserve-booking.use-case.js';
import { CompleteBookingUseCase } from '../../application/use-cases/bookings/complete-booking.use-case.js';
import { ListMyBookingsUseCase } from '../../application/use-cases/bookings/list-my-bookings.use-case.js';
import { ListBookingsUseCase } from '../../application/use-cases/bookings/list-bookings.use-case.js';
import { GetBookingUseCase } from '../../application/use-cases/bookings/get-booking.use-case.js';
import { CheckAvailabilityUseCase } from '../../application/use-cases/availability/check-availability.use-case.js';
import { GetSpaceAvailabilityUseCase } from '../../application/use-cases/availability/get-space-availability.use-case.js';
import { AuthController } from '../controllers/auth.controller.js';
import { UserController } from '../controllers/user.controller.js';
import { CatalogController } from '../controllers/catalog.controller.js';
import { SpaceController } from '../controllers/space.controller.js';
import { AmenityController } from '../controllers/amenity.controller.js';
import { BookingController } from '../controllers/booking.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { createAuthRouter } from './auth.routes.js';
import { createUserRouter } from './user.routes.js';
import { createCatalogRouter } from './catalog.routes.js';
import { createSpaceRouter } from './space.routes.js';
import { createAmenityRouter } from './amenity.routes.js';
import { createBookingRouter } from './booking.routes.js';

const userRepository = new DrizzleUserRepository();
const spaceRepository = new DrizzleSpaceRepository();
const amenityRepository = new DrizzleAmenityRepository();
const bookingRepository = new DrizzleBookingRepository();
const spaceAvailabilityRepository = new DrizzleSpaceAvailabilityRepository();
const hashService = new BcryptHashService();
const authService = new JwtService();
const bookingService = new BookingService();

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
const listSpaceAvailabilityUseCase = new ListSpaceAvailabilityUseCase(spaceRepository, spaceAvailabilityRepository);
const setSpaceAvailabilityUseCase = new SetSpaceAvailabilityUseCase(spaceRepository, spaceAvailabilityRepository);
const listAmenitiesUseCase = new ListAmenitiesUseCase(amenityRepository);
const listCatalogAmenitiesUseCase = new ListCatalogAmenitiesUseCase(amenityRepository);
const getAmenityUseCase = new GetAmenityUseCase(amenityRepository);
const createAmenityUseCase = new CreateAmenityUseCase(amenityRepository);
const updateAmenityUseCase = new UpdateAmenityUseCase(amenityRepository);
const deleteAmenityUseCase = new DeleteAmenityUseCase(amenityRepository);
const createBookingUseCase = new CreateBookingUseCase(bookingRepository, spaceRepository, spaceAvailabilityRepository, bookingService);
const cancelBookingUseCase = new CancelBookingUseCase(bookingRepository);
const preReserveBookingUseCase = new PreReserveBookingUseCase(bookingRepository, spaceRepository);
const completeBookingUseCase = new CompleteBookingUseCase(bookingRepository, spaceRepository, spaceAvailabilityRepository, bookingService);
const listMyBookingsUseCase = new ListMyBookingsUseCase(bookingRepository);
const listBookingsUseCase = new ListBookingsUseCase(bookingRepository);
const getBookingUseCase = new GetBookingUseCase(bookingRepository);
const checkAvailabilityUseCase = new CheckAvailabilityUseCase(bookingRepository, spaceRepository, bookingService);
const getSpaceAvailabilityUseCase = new GetSpaceAvailabilityUseCase(spaceRepository, spaceAvailabilityRepository, bookingRepository, bookingService);

const authController = new AuthController(registerUseCase, loginUseCase);
const userController = new UserController(
  getProfileUseCase, updateProfileUseCase,
  listUsersUseCase, createUserUseCase, updateUserUseCase, deleteUserUseCase,
);
const catalogController = new CatalogController(listSpacesUseCase, getSpaceUseCase, listCatalogAmenitiesUseCase, getSpaceAvailabilityUseCase);
const spaceAdminController = new SpaceController(createSpaceUseCase, updateSpaceUseCase, deleteSpaceUseCase, listSpaceAvailabilityUseCase, setSpaceAvailabilityUseCase);
const amenityAdminController = new AmenityController(
  listAmenitiesUseCase, getAmenityUseCase, createAmenityUseCase, updateAmenityUseCase, deleteAmenityUseCase,
);
const bookingController = new BookingController(
  createBookingUseCase, cancelBookingUseCase, listMyBookingsUseCase, listBookingsUseCase, getBookingUseCase, checkAvailabilityUseCase, preReserveBookingUseCase, completeBookingUseCase,
);
const authMiddleware = new AuthMiddleware(authService, userRepository);

const router = Router();

router.use('/auth', createAuthRouter(authController));
router.use('/users', createUserRouter(userController, authMiddleware));
router.use('/catalog', createCatalogRouter(catalogController));
router.use('/spaces', createSpaceRouter(spaceAdminController, authMiddleware));
router.use('/amenities', createAmenityRouter(amenityAdminController, authMiddleware));
router.use('/bookings', createBookingRouter(bookingController, authMiddleware));

export default router;
