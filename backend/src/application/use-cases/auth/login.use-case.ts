import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { HashService } from '../../../domain/services/hash.service.js';
import type { AuthService } from '../../../domain/services/auth.service.js';
import type { LoginDto } from '../../dto/auth/login.dto.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly authService: AuthService,
  ) {}

  async execute(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('El correo no está registrado');
    }

    const valid = await this.hashService.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedError('Contraseña incorrecta');
    }

    const token = this.authService.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
      },
    };
  }
}
