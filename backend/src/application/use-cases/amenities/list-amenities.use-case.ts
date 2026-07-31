import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';

export class ListAmenitiesUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async execute() {
    return this.spaceRepository.listAmenities();
  }
}
