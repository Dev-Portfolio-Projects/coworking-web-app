import type { AmenityRepository } from '../../../domain/repositories/amenity.repository.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class GetAmenityUseCase {
  constructor(private readonly amenityRepository: AmenityRepository) {}

  async execute(id: number) {
    const amenity = await this.amenityRepository.findById(id);
    if (!amenity) {
      throw new NotFoundError('Recurso');
    }
    return amenity;
  }
}
