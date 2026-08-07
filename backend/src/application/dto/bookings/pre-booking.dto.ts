import { z } from 'zod';

export const preBookingSchema = z.object({
  spaceId: z.number().int().positive({ message: 'El espacio es requerido' }),
});

export type PreBookingDto = z.infer<typeof preBookingSchema>;
