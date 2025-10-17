/**
 * Rutas de Categoría
 * Define endpoints para gestión de categorías
 */

import { Router } from 'express';
import categoryController from '../controllers/category.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';

// Crear un router para las rutas de categoría
const router = Router();

// ============================================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// ============================================================

/**
 * GET /api/categorias
 * Obtiene todas las categorías
 */
router.get('/', categoryController.findAll);

/**
 * GET /api/categorias/:id
 * Obtiene una categoría específica por ID
 */
router.get('/:id', categoryController.findOne);

// ============================================================
// RUTAS ADMINISTRATIVAS (REQUIEREN AUTENTICACIÓN + PERMISOS)
// ============================================================

/**
 * POST /api/categorias
 * Crea una nueva categoría
 * Requiere: Token JWT + Permisos de admin
 */
router.post('/', [verifyToken, isAdmin], categoryController.create);

/**
 * PUT /api/categorias/:id
 * Actualiza una categoría existente
 * Requiere: Token JWT + Permisos de admin
 */
router.put('/:id', [verifyToken, isAdmin], categoryController.update);

/**
 * DELETE /api/categorias/:id
 * Elimina una categoría
 * Requiere: Token JWT + Permisos de admin
 */
router.delete('/:id', [verifyToken, isAdmin], categoryController.delete);

export default router;