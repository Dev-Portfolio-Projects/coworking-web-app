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

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;

    const updated = await this.userRepository.update(userId, data);

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      roleId: updated.roleId,
    };
  }
}
