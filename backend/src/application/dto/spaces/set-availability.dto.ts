import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availabilitySlotSchema = z
  .object({
    availableDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha no es válida' }),
    startTime: z.string().regex(timeRegex, { message: 'La hora de inicio no es válida' }),
    endTime: z.string().regex(timeRegex, { message: 'La hora de fin no es válida' }),
  })
  .refine((slot) => slot.endTime > slot.startTime, {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['endTime'],
  });

export const setAvailabilitySchema = z.object({
  slots: z
    .array(availabilitySlotSchema)
    .min(1, { message: 'Debes definir al menos un horario disponible' })
    .max(200, { message: 'Demasiados horarios' }),
});

export type SetAvailabilityDto = z.infer<typeof setAvailabilitySchema>;
