import type { AmenityEntity } from '../entities/amenity.entity.js';

export interface AmenityListFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AmenityRepository {
  findAll(filters?: AmenityListFilters): Promise<{ items: AmenityEntity[]; total: number }>;
  findById(id: number): Promise<AmenityEntity | null>;
  isUsedInSpaces(id: number): Promise<boolean>;
  create(data: { name: string; description?: string }): Promise<AmenityEntity>;
  update(id: number, data: { name?: string; description?: string }): Promise<AmenityEntity>;
  delete(id: number): Promise<void>;
}
