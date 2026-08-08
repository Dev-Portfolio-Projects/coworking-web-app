import { z } from 'zod';

export const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, { message: 'El mensaje es requerido' })
    .max(500, { message: 'El mensaje es demasiado largo' }),
});

export type ChatDto = z.infer<typeof chatSchema>;
