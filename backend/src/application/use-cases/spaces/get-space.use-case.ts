import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class GetSpaceUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async execute(id: number) {
    const space = await this.spaceRepository.findById(id);
    if (!space) {
      throw new NotFoundError('Espacio');
    }
    return space;
  }
}
