import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { CreateSpaceDto } from '../../dto/spaces/create-space.dto.js';

export class CreateSpaceUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async execute(dto: CreateSpaceDto) {
    return this.spaceRepository.create({
      ...dto,
      priceHour: dto.priceHour.toString(),
    });
  }
}
