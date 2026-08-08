import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico no válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  roleId: z.number().int().positive({ message: 'El rol es requerido' }),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
