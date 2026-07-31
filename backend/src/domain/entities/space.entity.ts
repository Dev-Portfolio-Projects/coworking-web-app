import type { SpaceStatus } from '../../shared/types/index.js';
import type { AmenityEntity } from './amenity.entity.js';

export class SpaceEntity {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string,
    public readonly capacity: number,
    public readonly priceHour: string,
    public readonly images: string[] | null,
    public readonly status: SpaceStatus,
    public readonly amenities?: AmenityEntity[],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
