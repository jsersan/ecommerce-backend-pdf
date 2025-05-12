// src/routes/index.ts - versión simplificada
import { Router } from 'express';
import userRoutes from './user.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
// import orderRoutes from './order.routes'; // Comentamos esta línea por ahora

// Crear un router para todas las rutas
const router = Router();

// Registrar las rutas por dominio
router.use('/users', userRoutes);
router.use('/categorias', categoryRoutes);
router.use('/productos', productRoutes);
// router.use('/pedido', orderRoutes); // Comentamos esta línea por ahora

export default router;