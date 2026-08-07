import type { SpaceAvailabilityEntity } from '../entities/space-availability.entity.js';

export interface AvailabilitySlotInput {
  availableDate: string;
  startTime: string;
  endTime: string;
}

export interface SpaceAvailabilityRepository {
  findBySpace(spaceId: number): Promise<SpaceAvailabilityEntity[]>;
  setForSpace(spaceId: number, slots: AvailabilitySlotInput[]): Promise<void>;
}
