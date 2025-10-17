/**
 * Middleware de Autenticación JWT
 * Verifica que el token sea válido y extrae el userId
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    console.log(`🔐 Verificando token para: ${req.method} ${req.path}`);

    // Obtener el header Authorization
    const authHeader = req.headers.authorization;
    
    console.log(`   Authorization header: ${authHeader ? 'Presente' : 'NO PRESENTE'}`);

    // Validar que exista el header
    if (!authHeader) {
      console.warn('⚠️ No hay header Authorization');
      res.status(401).json({
        message: 'Token no proporcionado'
      });
      return;
    }

    // Extraer el token del header (formato: "Bearer token")
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
      console.warn('⚠️ Formato de Authorization inválido');
      res.status(401).json({
        message: 'Formato de Authorization inválido'
      });
      return;
    }

    const [scheme, token] = parts;

    if (scheme !== 'Bearer') {
      console.warn('⚠️ Scheme no es Bearer');
      res.status(401).json({
        message: 'Scheme debe ser Bearer'
      });
      return;
    }

    // Verificar el token
    const secret = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

    try {
      const decoded = jwt.verify(token, secret) as { userId: number };
      
      console.log(`✅ Token válido para usuario ID: ${decoded.userId}`);
      console.log(`   Token: ${token.substring(0, 20)}...`);

      // Guardar el userId en la request para usarlo después
      (req as any).userId = decoded.userId;

      // Continuar con la siguiente función/middleware
      next();
    } catch (jwtError) {
      console.error('❌ Error verificando token:', (jwtError as Error).message);
      
      if ((jwtError as any).name === 'TokenExpiredError') {
        res.status(401).json({
          message: 'Token expirado'
        });
      } else {
        res.status(401).json({
          message: 'Token inválido'
        });
      }
    }
  } catch (error) {
    console.error('💥 Error en middleware de autenticación:', error);
    res.status(500).json({
      message: 'Error en autenticación',
      error: (error as Error).message
    });
  }
};

/**
 * Middleware alternativo que no lanza error si no hay token
 * Útil para rutas públicas que opcionalmente tienen autenticación
 */
export const verifyTokenOptional = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');
      
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const secret = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

        try {
          const decoded = jwt.verify(token, secret) as { userId: number };
          (req as any).userId = decoded.userId;
          console.log(`✅ Token verificado para usuario ID: ${decoded.userId}`);
        } catch (jwtError) {
          console.warn('⚠️ Token no válido pero es opcional, continuando sin autenticación');
        }
      }
    }

    // Continuar siempre (con o sin token)
    next();
  } catch (error) {
    console.error('💥 Error en middleware opcional de autenticación:', error);
    // Continuar incluso con error en token opcional
    next();
  }
};