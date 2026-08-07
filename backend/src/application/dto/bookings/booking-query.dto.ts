import { z } from 'zod';

export const bookingQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  search: z.string().trim().max(100).optional(),
  userId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(0).default(12),
});

export type BookingQueryDto = z.infer<typeof bookingQuerySchema>;
