import { z } from 'zod';

export const updateAmenitySchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }).optional(),
  description: z.string().optional(),
});

export type UpdateAmenityDto = z.infer<typeof updateAmenitySchema>;
