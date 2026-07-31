import type { AmenityEntity } from '../entities/amenity.entity.js';

export interface AmenityRepository {
  findAll(): Promise<AmenityEntity[]>;
  findById(id: number): Promise<AmenityEntity | null>;
  isUsedInSpaces(id: number): Promise<boolean>;
  create(data: { name: string; description?: string }): Promise<AmenityEntity>;
  update(id: number, data: { name?: string; description?: string }): Promise<AmenityEntity>;
  delete(id: number): Promise<void>;
}
