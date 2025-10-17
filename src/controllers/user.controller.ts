/* Controlador de Usuarios - VERSIÓN CORREGIDA
* Maneja la lógica de autenticación y gestión de usuarios
*/

import { Request, Response } from 'express';
import db from '../models';
import bcryptjs from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

// ✅ Interfaz para el payload del JWT
interface JwtPayload {
  userId: number;
}

class UserController {
  /**
  * Registro de nuevo usuario
  * POST /api/users/register
  */
  async register(req: Request, res: Response): Promise<any> {
    try {
      const { username, password, nombre, email, direccion, ciudad, cp } = req.body;
      console.log('🔍 Registrando nuevo usuario:', username);

      // Validar datos requeridos
      if (!username || !password || !email) {
        return res.status(400).json({ message: 'Faltan campos requeridos: username, password, email' });
      }

      // Verificar que el usuario no exista
      const existingUser = await db.User.findOne({ where: { username } });
      if (existingUser) {
        console.warn('⚠️ Usuario ya existe:', username);
        return res.status(400).json({ message: 'El usuario ya existe' });
      }

      // Hashear contraseña
      const hashedPassword = await bcryptjs.hash(password, 10);
      console.log('🔐 Contraseña hasheada');

      // Crear usuario
      const user = await db.User.create({
        username,
        password: hashedPassword,
        nombre: nombre || '',
        email,
        direccion: direccion || '',
        ciudad: ciudad || '',
        cp: cp || '',
        role: 'user'
      });

      // Generar token JWT
      const token = this.generateToken(user.get('id'));
      console.log('✅ Usuario registrado exitosamente:', username);

      return res.status(201).json({
        message: 'Usuario registrado correctamente',
        user: {
          id: user.get('id'),
          username: user.get('username'),
          nombre: user.get('nombre'),
          email: user.get('email'),
          direccion: user.get('direccion'),
          ciudad: user.get('ciudad'),
          cp: user.get('cp'),
          token
        }
      });
    } catch (error) {
      console.error('❌ Error en registro:', error);
      return res.status(500).json({ message: 'Error al registrar usuario', error: (error as Error).message });
    }
  }

  /**
  * ✅ LOGIN CORREGIDO - Acepta username O email
  * POST /api/users/login
  */
  async login(req: Request, res: Response): Promise<any> {
    try {
      const { username, password } = req.body;
      console.log('🔍 Intento de login para usuario/email:', username);

      // Validar datos
      if (!username || !password) {
        return res.status(400).json({ message: 'Username/email y password son requeridos' });
      }

      // ✅ CLAVE: Buscar usuario por username O email
      const user = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { username: username },
            { email: username }
          ]
        }
      });

      if (!user) {
        console.warn('⚠️ Usuario/email no encontrado:', username);
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
      }

      // Verificar contraseña
      const passwordValid = await bcryptjs.compare(password, user.get('password'));
      if (!passwordValid) {
        console.warn('⚠️ Contraseña incorrecta para usuario:', username);
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
      }

      // Generar token JWT
      const token = this.generateToken(user.get('id'));
      console.log('✅ Login exitoso para usuario:', user.get('username'));
      console.log('   Token generado:', token.substring(0, 20) + '...');

      return res.status(200).json({
        message: 'Login exitoso',
        user: {
          id: user.get('id'),
          username: user.get('username'),
          nombre: user.get('nombre'),
          email: user.get('email'),
          direccion: user.get('direccion'),
          ciudad: user.get('ciudad'),
          cp: user.get('cp'),
          role: user.get('role'),
          token
        }
      });
    } catch (error) {
      console.error('❌ Error en login:', error);
      return res.status(500).json({ message: 'Error al iniciar sesión', error: (error as Error).message });
    }
  }

  /**
  * Obtener perfil del usuario autenticado
  * GET /api/users/profile
  */
  async profile(req: Request, res: Response): Promise<any> {
    try {
      // El userId viene del middleware de autenticación
      const userId = (req as any).userId;
      console.log(`👤 Obteniendo perfil del usuario ID: ${userId}`);

      const user = await db.User.findByPk(userId, {
        attributes: { exclude: ['password'] } // No incluir contraseña
      });

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      console.log('✅ Perfil obtenido para usuario:', user.get('username'));
      return res.status(200).json(user);
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      return res.status(500).json({ message: 'Error al obtener perfil', error: (error as Error).message });
    }
  }

  /**
  * Actualizar datos del usuario
  * PUT /api/users/:id
  */
  async update(req: Request, res: Response): Promise<any> {
    try {
      const userId = parseInt(req.params.id);
      const { username, nombre, email, direccion, ciudad, cp, password } = req.body;

      console.log(`✏️ Actualizando usuario ID: ${userId}`);
      console.log('   Datos a actualizar:', { username, nombre, email });

      // Verificar que el usuario existe
      const user = await db.User.findByPk(userId);
      if (!user) {
        console.warn('⚠️ Usuario no encontrado:', userId);
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Preparar datos a actualizar
      const updateData: any = {};
      if (username) updateData.username = username;
      if (nombre) updateData.nombre = nombre;
      if (email) updateData.email = email;
      if (direccion !== undefined) updateData.direccion = direccion;
      if (ciudad) updateData.ciudad = ciudad;
      if (cp) updateData.cp = cp;
      // Si se proporciona contraseña, hashearla
      if (password && password.trim() !== '') {
        console.log('🔐 Actualizando contraseña');
        updateData.password = await bcryptjs.hash(password, 10);
      }

      // Actualizar usuario
      await user.update(updateData);
      console.log(`✅ Usuario ${userId} actualizado exitosamente`);

      // Generar nuevo token
      const token = this.generateToken(user.get('id'));

      return res.status(200).json({
        message: 'Usuario actualizado correctamente',
        user: {
          id: user.get('id'),
          username: user.get('username'),
          nombre: user.get('nombre'),
          email: user.get('email'),
          direccion: user.get('direccion'),
          ciudad: user.get('ciudad'),
          cp: user.get('cp'),
          role: user.get('role'),
          token
        }
      });
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
      return res.status(500).json({ message: 'Error al actualizar usuario', error: (error as Error).message });
    }
  }

  /**
  * ✅ Generar token JWT
  */
  private generateToken(userId: number): string {
    const secret = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';
    const expiresInValue = process.env.JWT_EXPIRES_IN || '24h';

    const payload: JwtPayload = {
      userId
    };

    const options: SignOptions = {
      expiresIn: expiresInValue as unknown as number
    };

    const token = jwt.sign(payload, secret, options);

    console.log(`🔐 Token generado para usuario ID ${userId}`);
    return token;
  }
}

export default new UserController();