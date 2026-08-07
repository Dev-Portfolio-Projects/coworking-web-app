import { z } from 'zod';

export const userQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  roleId: z.coerce.number().int().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(0).default(12),
});

export type UserQueryDto = z.infer<typeof userQuerySchema>;
