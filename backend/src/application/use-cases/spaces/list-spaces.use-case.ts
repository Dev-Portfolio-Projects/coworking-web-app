import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { SpaceListDto } from '../../dto/catalog/space-list.dto.js';
import type { Paginated } from '../../../shared/types/index.js';
import type { SpaceEntity } from '../../../domain/entities/space.entity.js';
import { paginate } from '../../../shared/pagination.js';

export class ListSpacesUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async execute(dto: SpaceListDto): Promise<Paginated<SpaceEntity>> {
    const { page, limit, status, search, capacityMin, capacityMax, priceMin, priceMax, amenityId } = dto;
    const { items, total } = await this.spaceRepository.findAll(
      { status, search, capacityMin, capacityMax, priceMin, priceMax, amenityId },
      { page, limit },
    );

    return paginate(items, total, page, limit);
  }
}
