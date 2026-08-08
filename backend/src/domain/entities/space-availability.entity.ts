export class SpaceAvailabilityEntity {
  constructor(
    public readonly id: number,
    public readonly spaceId: number,
    public readonly availableDate: string,
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly createdAt?: Date,
  ) {}
}
