import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: number) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Usuario');
    }
    await this.userRepository.delete(id);
  }
}
