/**
 * Middleware de Administrador
 * Verifica que el usuario tenga permisos de administrador
 */
import { Request, Response, NextFunction } from 'express';
import db from '../models';

// ✅ Extender la interfaz Request para incluir userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * Middleware para verificar permisos de administrador
 * Se usa en rutas que requieren autenticación + permisos admin
 * 
 * Ejemplo de uso en rutas:
 * router.delete('/:id', [verifyToken, isAdmin], controller.delete);
 */
export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(`👑 Verificando permisos de admin`);

    // ✅ Ahora TypeScript reconoce userId en req
    const userId = req.userId;

    if (!userId) {
      console.warn('⚠️ No hay userId en la request');
      res.status(401).json({
        message: 'No autenticado'
      });
      return;
    }

    console.log(`   Verificando usuario ID: ${userId}`);

    // Buscar el usuario
    const user = await db.User.findByPk(userId);

    if (!user) {
      console.warn(`⚠️ Usuario no encontrado: ${userId}`);
      res.status(404).json({
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar si es admin
    const role = user.get('role');
    console.log(`   Rol del usuario: ${role}`);

    if (role !== 'admin') {
      console.warn(`⚠️ Usuario no es admin: ${user.get('username')}`);
      res.status(403).json({
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
      return;
    }

    console.log(`✅ Usuario es admin: ${user.get('username')}`);

    // Continuar con la siguiente función
    next();
  } catch (error) {
    console.error('❌ Error en middleware de admin:', error);
    res.status(500).json({
      message: 'Error verificando permisos',
      error: (error as Error).message
    });
  }
};

export default { isAdmin };