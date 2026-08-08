import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { SpaceAvailabilityRepository } from '../../../domain/repositories/space-availability.repository.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class ListSpaceAvailabilityUseCase {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly spaceAvailabilityRepository: SpaceAvailabilityRepository,
  ) {}

  async execute(spaceId: number) {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError('Espacio');
    }

    const slots = await this.spaceAvailabilityRepository.findBySpace(spaceId);
    return { spaceId, slots };
  }
}
