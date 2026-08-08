import type { AmenityRepository } from '../../../domain/repositories/amenity.repository.js';
import type { CreateAmenityDto } from '../../dto/amenities/create-amenity.dto.js';
import { ConflictError } from '../../../shared/errors/index.js';

export class CreateAmenityUseCase {
  constructor(private readonly amenityRepository: AmenityRepository) {}

  async execute(dto: CreateAmenityDto) {
    const existing = await this.amenityRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictError('Ya existe un recurso con ese nombre');
    }
    return this.amenityRepository.create(dto);
  }
}
