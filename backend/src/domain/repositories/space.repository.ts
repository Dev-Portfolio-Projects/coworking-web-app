import type { SpaceEntity } from '../entities/space.entity.js';
import type { SpaceStatus } from '../../shared/types/index.js';

export interface SpaceListFilters {
  status?: SpaceStatus;
  search?: string;
  capacityMin?: number;
  capacityMax?: number;
  priceMin?: number;
  priceMax?: number;
  amenityId?: number;
}

export interface SpacePagination {
  page?: number;
  limit?: number;
}

export interface SpaceRepository {
  findAll(filters?: SpaceListFilters, pagination?: SpacePagination): Promise<{ items: SpaceEntity[]; total: number }>;
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
}
