import type { AmenityRepository } from '../../../domain/repositories/amenity.repository.js';
import type { AmenityQueryDto } from '../../dto/amenities/amenity-query.dto.js';
import type { Paginated } from '../../../shared/types/index.js';
import type { AmenityEntity } from '../../../domain/entities/amenity.entity.js';
import { paginate } from '../../../shared/pagination.js';

export class ListAmenitiesUseCase {
  constructor(private readonly amenityRepository: AmenityRepository) {}

  async execute(dto: AmenityQueryDto): Promise<Paginated<AmenityEntity>> {
    const { page, limit, search } = dto;
    const { items, total } = await this.amenityRepository.findAll({ search, page, limit });

    return paginate(items, total, page, limit);
  }
}
