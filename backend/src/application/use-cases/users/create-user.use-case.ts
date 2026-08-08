import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { HashService } from '../../../domain/services/hash.service.js';
import type { CreateUserDto } from '../../dto/users/create-user.dto.js';
import { ConflictError } from '../../../shared/errors/index.js';

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
  ) {}

  async execute(dto: CreateUserDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('El correo ya está registrado');
    }

    const hashedPassword = await this.hashService.hash(dto.password);
    return this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      roleId: dto.roleId,
    });
  }
}
