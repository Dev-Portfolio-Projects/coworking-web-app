import type { BookingStatus } from '../../shared/types/index.js';

export interface BookingBilling {
  billingName: string;
  billingDocument: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
}

export class BookingEntity {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly spaceId: number,
    public readonly date: string | null,
    public readonly startTime: string | null,
    public readonly endTime: string | null,
    public readonly totalPrice: string | null,
    public readonly status: BookingStatus,
    public readonly billing?: BookingBilling,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly space?: { id: number; name: string; description: string; capacity: number; priceHour: string } | null,
    public readonly user?: { id: number; name: string; email: string } | null,
  ) {}
}
