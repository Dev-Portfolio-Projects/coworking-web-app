import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { UpdateProfileDto } from '../../dto/users/update-profile.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario');
    }

    return {
      id: user.id,
      email: dto.email ?? user.email,
      name: dto.name ?? user.name,
      roleId: user.roleId,
    };
  }
}
