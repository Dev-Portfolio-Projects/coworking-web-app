import type { SpaceEntity } from '../entities/space.entity.js';
import type { AmenityEntity } from '../entities/amenity.entity.js';
import type { SpaceStatus } from '../../shared/types/index.js';

export interface SpaceRepository {
  findAll(status?: SpaceStatus): Promise<SpaceEntity[]>;
  findById(id: number): Promise<SpaceEntity | null>;
  create(data: {
    name: string;
    description: string;
    capacity: number;
    priceHour: string;
    images?: string[];
    status?: SpaceStatus;
    amenityIds?: number[];
  }): Promise<SpaceEntity>;
  update(id: number, data: {
    name?: string;
    description?: string;
    capacity?: number;
    priceHour?: string;
    images?: string[];
    status?: SpaceStatus;
    amenityIds?: number[];
  }): Promise<SpaceEntity>;
  delete(id: number): Promise<void>;
  listAmenities(): Promise<AmenityEntity[]>;
}
