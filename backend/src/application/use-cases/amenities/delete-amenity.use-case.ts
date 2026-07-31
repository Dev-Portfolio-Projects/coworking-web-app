import type { AmenityRepository } from '../../../domain/repositories/amenity.repository.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/index.js';

const IN_USE_MESSAGE = 'No se puede eliminar el recurso porque está asignado a uno o más espacios.';

export class DeleteAmenityUseCase {
  constructor(private readonly amenityRepository: AmenityRepository) {}

  async execute(id: number) {
    const existing = await this.amenityRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Recurso');
    }
    if (await this.amenityRepository.isUsedInSpaces(id)) {
      throw new ConflictError(IN_USE_MESSAGE);
    }
    try {
      await this.amenityRepository.delete(id);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        throw new ConflictError(IN_USE_MESSAGE);
      }
      throw error;
    }
  }
}
