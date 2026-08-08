import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class GetProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
    };
  }
}
