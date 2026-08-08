import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class DeleteSpaceUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async execute(id: number) {
    const existing = await this.spaceRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Espacio');
    }
    await this.spaceRepository.delete(id);
  }
}
