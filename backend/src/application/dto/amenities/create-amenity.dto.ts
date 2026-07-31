import { z } from 'zod';

export const createAmenitySchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  description: z.string().optional(),
});

export type CreateAmenityDto = z.infer<typeof createAmenitySchema>;
