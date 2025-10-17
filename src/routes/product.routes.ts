/**
 * Rutas de Productos
 * Define endpoints para gestión de productos
 * 
 * ⚠️ IMPORTANTE: El orden de las rutas importa
 * Las rutas más específicas deben ir ANTES que las genéricas
 */

import { Router } from 'express';
import productController from '../controllers/product.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';
import { upload } from '../middleware/upload.middleware';

// Crear un router para las rutas de producto
const router = Router();

// ============================================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// ============================================================

/**
 * ✅ RUTA DE BÚSQUEDA - DEBE IR PRIMERO (más específica)
 * GET /api/productos/search?q=término
 * 
 * Busca productos por término en nombre o descripción
 * 
 * Ejemplo: GET /api/productos/search?q=plug
 * Respuesta: Array de productos que contienen "plug"
 */
router.get('/search', productController.search);

/**
 * GET /api/productos
 * Obtiene todos los productos disponibles
 * 
 * Respuesta: Array con todos los productos
 */
router.get('/', productController.index);

/**
 * GET /api/productos/categoria/:categoryId
 * Obtiene productos de una categoría específica
 * 
 * Parámetros:
 * - categoryId: ID numérico de la categoría
 * 
 * Ejemplo: GET /api/productos/categoria/2
 * Respuesta: Array con productos de la categoría 2
 */
router.get('/categoria/:categoryId', productController.getProductsByCategory);

/**
 * GET /api/productos/:id/color
 * Obtiene colores disponibles para un producto específico
 * 
 * Parámetros:
 * - id: ID numérico del producto
 * 
 * Ejemplo: GET /api/productos/5/color
 * Respuesta: Array con colores disponibles
 */
router.get('/:id/color', productController.getColors);

/**
 * GET /api/productos/:id
 * Obtiene un producto específico por su ID
 * 
 * ⚠️ IMPORTANTE: Esta ruta DEBE IR AL FINAL de las GET
 * porque /:id coincide con cualquier parámetro
 * 
 * Parámetros:
 * - id: ID numérico del producto
 * 
 * Ejemplo: GET /api/productos/3
 * Respuesta: Objeto del producto con ID 3
 */
router.get('/:id', productController.show);

// ============================================================
// RUTAS ADMINISTRATIVAS (REQUIEREN AUTENTICACIÓN + PERMISOS)
// ============================================================

/**
 * POST /api/productos
 * Crea un nuevo producto
 * 
 * Requiere: Token JWT + Permisos de administrador
 * 
 * Body esperado:
 * {
 *   "nombre": "Plug simple",
 *   "descripcion": "Descripción del producto",
 *   "precio": 14.99,
 *   "categoria": 4,
 *   "carpetaimg": "plug",
 *   "imagen": "plug-negro.jpg"
 * }
 * 
 * Respuesta: Objeto del producto creado con ID
 */
router.post('/', [verifyToken, isAdmin], productController.store);

/**
 * PUT /api/productos/:id
 * Actualiza un producto existente
 * 
 * Requiere: Token JWT + Permisos de administrador
 * 
 * Parámetros:
 * - id: ID del producto a actualizar
 * 
 * Body esperado (campos opcionales):
 * {
 *   "nombre": "Nuevo nombre",
 *   "descripcion": "Nueva descripción",
 *   "precio": 19.99,
 *   "categoria": 4,
 *   "carpetaimg": "plug",
 *   "imagen": "plug-azul.jpg"
 * }
 * 
 * Respuesta: Objeto del producto actualizado
 */
router.put('/:id', [verifyToken, isAdmin], productController.update);

/**
 * DELETE /api/productos/:id
 * Elimina un producto
 * 
 * Requiere: Token JWT + Permisos de administrador
 * 
 * Parámetros:
 * - id: ID del producto a eliminar
 * 
 * Ejemplo: DELETE /api/productos/5
 * Respuesta: { message: "Producto eliminado correctamente", productId: 5 }
 */
router.delete('/:id', [verifyToken, isAdmin], productController.destroy);

// ============================================================
// RUTAS ADICIONALES (COMENTADAS PARA FUTURO USO)
// ============================================================

/**
 * Descomenta si necesitas estas funcionalidades:
 * 
 * // POST /api/productos/:id/images
 * // Sube imágenes para un producto
 * router.post('/:id/images', [
 *   verifyToken, 
 *   isAdmin, 
 *   upload.array('images', 10) // Permite hasta 10 imágenes
 * ], productController.uploadImages);
 * 
 * // POST /api/productos/:id/colores
 * // Añade colores a un producto
 * router.post('/:id/colores', [verifyToken, isAdmin], productController.addColor);
 * 
 * // GET /api/productos/imagen/:categoria/:imagen
 * // Obtiene una imagen específica de un producto
 * router.get('/imagen/:categoria/:imagen', productController.getImage);
 */

export default router;