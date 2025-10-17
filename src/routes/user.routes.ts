/* Rutas de Usuario - VERSIÓN CORREGIDA
 * Define endpoints para gestión de usuarios y autenticación */
import { Router } from 'express';
import userController from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Rutas públicas (no requieren autenticación)
/* POST /api/users/register
 * Registra un nuevo usuario */
router.post('/register', (req, res) => userController.register(req, res));

/* POST /api/users/login
 * Inicia sesión para un usuario existente */
router.post('/login', (req, res) => userController.login(req, res));

// Rutas protegidas (requieren autenticación)
/* GET /api/users/profile
 * Obtiene el perfil del usuario autenticado */
router.get('/profile', verifyToken, (req, res) => userController.profile(req, res));

/* PUT /api/users/:id
 * Actualiza los datos de un usuario específico */
router.put('/:id', verifyToken, (req, res) => userController.update(req, res));

export default router;