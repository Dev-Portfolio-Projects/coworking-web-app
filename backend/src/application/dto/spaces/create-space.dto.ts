import { z } from 'zod';

export const createSpaceSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  description: z.string().min(1, { message: 'La descripción es requerida' }),
  capacity: z.number().int().positive({ message: 'La capacidad debe ser un número positivo' }),
  priceHour: z.number().positive({ message: 'El precio debe ser un número positivo' }),
  images: z.array(z.string()).optional(),
  status: z.enum(['AVAILABLE', 'UNAVAILABLE']).optional(),
  amenityIds: z.array(z.number().int().positive()).optional(),
});

export type CreateSpaceDto = z.infer<typeof createSpaceSchema>;
