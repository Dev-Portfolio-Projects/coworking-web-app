import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const completeBookingSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha no es válida' }),
    startTime: z.string().regex(timeRegex, { message: 'La hora de inicio no es válida' }),
    endTime: z.string().regex(timeRegex, { message: 'La hora de fin no es válida' }),
    billingName: z.string().trim().min(2, { message: 'El nombre es requerido' }).max(255),
    billingDocument: z.string().trim().min(6, { message: 'El documento es requerido' }).max(20),
    billingEmail: z.string().trim().email({ message: 'El correo no es válido' }).max(255),
    billingPhone: z.string().trim().min(6, { message: 'El teléfono es requerido' }).max(30),
    billingAddress: z.string().trim().min(4, { message: 'La dirección es requerida' }).max(500),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['endTime'],
  });

export type CompleteBookingDto = z.infer<typeof completeBookingSchema>;
