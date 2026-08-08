import type { SpaceRepository } from '../../../domain/repositories/space.repository.js';
import type { SpaceAvailabilityRepository } from '../../../domain/repositories/space-availability.repository.js';
import type { SetAvailabilityDto } from '../../dto/spaces/set-availability.dto.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/index.js';

export class SetSpaceAvailabilityUseCase {
  constructor(
    private readonly spaceRepository: SpaceRepository,
    private readonly spaceAvailabilityRepository: SpaceAvailabilityRepository,
  ) {}

  async execute(spaceId: number, dto: SetAvailabilityDto) {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError('Espacio');
    }

    const byDate = new Map<string, { startTime: string; endTime: string }[]>();
    for (const slot of dto.slots) {
      const existingForDate = byDate.get(slot.availableDate) ?? [];
      for (const existing of existingForDate) {
        if (slot.startTime < existing.endTime && existing.startTime < slot.endTime) {
          throw new ConflictError(
            `Los horarios ${existing.startTime}-${existing.endTime} y ${slot.startTime}-${slot.endTime} del día ${slot.availableDate} se cruzan entre sí`,
          );
        }
      }
      existingForDate.push({ startTime: slot.startTime, endTime: slot.endTime });
      byDate.set(slot.availableDate, existingForDate);
    }

    await this.spaceAvailabilityRepository.setForSpace(spaceId, dto.slots);

    const slots = await this.spaceAvailabilityRepository.findBySpace(spaceId);
    return { spaceId, slots };
  }
}
