import type { AmenityRepository } from '../../../domain/repositories/amenity.repository.js';
import type { CreateAmenityDto } from '../../dto/amenities/create-amenity.dto.js';

export class CreateAmenityUseCase {
  constructor(private readonly amenityRepository: AmenityRepository) {}

  async execute(dto: CreateAmenityDto) {
    return this.amenityRepository.create(dto);
  }
}
