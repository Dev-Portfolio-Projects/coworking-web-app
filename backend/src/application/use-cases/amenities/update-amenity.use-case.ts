import type { AmenityRepository } from '../../../domain/repositories/amenity.repository.js';
import type { UpdateAmenityDto } from '../../dto/amenities/update-amenity.dto.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/index.js';

export class UpdateAmenityUseCase {
  constructor(private readonly amenityRepository: AmenityRepository) {}

  async execute(id: number, dto: UpdateAmenityDto) {
    const existing = await this.amenityRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Recurso');
    }
    if (dto.name !== undefined && dto.name !== existing.name) {
      const nameTaken = await this.amenityRepository.findByName(dto.name);
      if (nameTaken) {
        throw new ConflictError('Ya existe un recurso con ese nombre');
      }
    }
    return this.amenityRepository.update(id, dto);
  }
}
