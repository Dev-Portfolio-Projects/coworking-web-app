import type { AmenityRepository } from '../../../domain/repositories/amenity.repository.js';
import type { AmenityEntity } from '../../../domain/entities/amenity.entity.js';

export class ListCatalogAmenitiesUseCase {
  constructor(private readonly amenityRepository: AmenityRepository) {}

  async execute(): Promise<AmenityEntity[]> {
    const { items } = await this.amenityRepository.findAll({ page: 1, limit: 0 });
    return items;
  }
}
