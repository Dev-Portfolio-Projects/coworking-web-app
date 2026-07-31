import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { UpdateSpaceDto } from '../../dto/spaces/update-space.dto.js';
import { NotFoundError } from '../../../shared/errors/index.js';

export class UpdateSpaceUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async execute(id: number, dto: UpdateSpaceDto) {
    const existing = await this.spaceRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Espacio');
    }

    return this.spaceRepository.update(id, {
      ...dto,
      priceHour: dto.priceHour?.toString(),
    });
  }
}
