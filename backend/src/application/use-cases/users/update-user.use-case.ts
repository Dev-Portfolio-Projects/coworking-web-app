import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { HashService } from '../../../domain/services/hash.service.js';
import type { UpdateUserDto } from '../../dto/users/update-user.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
  ) {}

  async execute(id: number, dto: UpdateUserDto) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario');
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.roleId !== undefined) data.roleId = dto.roleId;
    if (dto.password !== undefined) {
      data.password = await this.hashService.hash(dto.password);
    }

    return this.userRepository.update(id, data);
  }
}
