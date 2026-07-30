import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { HashService } from '../../../domain/services/hash.service.js';
import type { AuthService } from '../../../domain/services/auth.service.js';
import type { RegisterDto } from '../../dto/auth/register.dto.js';
import { ConflictError } from '../../../shared/errors/index.js';

export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly authService: AuthService,
  ) {}

  async execute(dto: RegisterDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('El correo ya está registrado');
    }

    const hashedPassword = await this.hashService.hash(dto.password);
    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      roleId: 3, // CLIENT
    });

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
