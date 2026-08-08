import { z } from 'zod';

export const updateUserSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico no válido' }).optional(),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).optional(),
  name: z.string().min(1, { message: 'El nombre es requerido' }).optional(),
  roleId: z.number().int().positive({ message: 'El rol es requerido' }).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
