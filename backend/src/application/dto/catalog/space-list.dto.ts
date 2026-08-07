import { z } from 'zod';

export const spaceListSchema = z.object({
  status: z.enum(['AVAILABLE', 'UNAVAILABLE']).optional(),
  search: z.string().trim().max(100).optional(),
  capacityMin: z.coerce.number().int().min(0).optional(),
  capacityMax: z.coerce.number().int().min(0).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  amenityId: z.coerce.number().int().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(0).default(12),
});

export type SpaceListDto = z.infer<typeof spaceListSchema>;
