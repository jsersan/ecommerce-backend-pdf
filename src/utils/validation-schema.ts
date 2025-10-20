import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6)
});

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  email: z.string().email(),
  nombre: z.string().min(2),
  direccion: z.string().min(5),
  ciudad: z.string().min(2),
  cp: z.string().regex(/^\d{5}$/)
});

export const updateUserSchema = z.object({
  password: z.string().min(6).optional(),
  email: z.string().email().optional(),
  nombre: z.string().min(2).optional(),
  direccion: z.string().min(5).optional(),
  ciudad: z.string().min(2).optional(),
  cp: z.string().regex(/^\d{5}$/).optional()
});

export const categorySchema = z.object({
  nombre: z.string().min(2).max(100),
  padre: z.union([z.string(), z.number().int()])
});

export const productSchema = z.object({
  nombre: z.string().min(2).max(100),
  descripcion: z.string().min(10),
  precio: z.number().positive(),
  carpetaimg: z.string().min(1),
  imagen: z.string().min(1),
  categoria: z.number().int()
});

export const productColorSchema = z.object({
  color: z.string().min(1).max(50),
  imagen: z.string().min(1)
});

export const orderLineSchema = z.object({
  idprod: z.number().int(),
  color: z.string().min(1),
  cant: z.number().int().positive(),
  nombre: z.string().optional()
});

export const orderSchema = z.object({
  iduser: z.number().int(),
  total: z.number().positive(),
  lineas: z.array(orderLineSchema).min(1)
});

export const validate = (schema: z.ZodSchema) => (req: any, res: any, next: any) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        errors: (error as any).issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    next(error);
  }
};