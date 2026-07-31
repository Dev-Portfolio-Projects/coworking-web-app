import type { AmenityRepository } from '../../../domain/repositories/amenity.repository.js';
import type { UpdateAmenityDto } from '../../dto/amenities/update-amenity.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class UpdateAmenityUseCase {
  constructor(private readonly amenityRepository: AmenityRepository) {}

  async execute(id: number, dto: UpdateAmenityDto) {
    const existing = await this.amenityRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Recurso');
    }
    return this.amenityRepository.update(id, dto);
  }
}
