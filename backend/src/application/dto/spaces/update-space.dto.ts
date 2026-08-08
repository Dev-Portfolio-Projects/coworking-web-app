import { z } from 'zod';

export const updateSpaceSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }).optional(),
  description: z.string().min(1, { message: 'La descripción es requerida' }).optional(),
  capacity: z.number().int().positive({ message: 'La capacidad debe ser un número positivo' }).optional(),
  priceHour: z.number().positive({ message: 'El precio debe ser un número positivo' }).optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['AVAILABLE', 'UNAVAILABLE']).optional(),
  amenityIds: z.array(z.number().int().positive()).optional(),
});

export type UpdateSpaceDto = z.infer<typeof updateSpaceSchema>;
