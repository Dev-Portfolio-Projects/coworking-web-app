import { z } from 'zod';

export const amenityQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(0).default(12),
});

export type AmenityQueryDto = z.infer<typeof amenityQuerySchema>;
