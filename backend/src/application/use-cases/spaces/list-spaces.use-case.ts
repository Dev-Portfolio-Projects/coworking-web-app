import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { SpaceStatus } from '../../../shared/types/index.js';

export class ListSpacesUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async execute(status?: SpaceStatus) {
    return this.spaceRepository.findAll(status);
  }
}
