/**
 * Controlador de Productos
 * Maneja la lógica de negocio para operaciones relacionadas con productos
 */
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../models';
import { IProduct } from '../interfaces/product.interface';
import { Op } from 'sequelize'; // ✅ Importar operadores de Sequelize

class ProductController {
  /**
   * Obtener todos los productos
   * GET /api/productos
   */
  async index(req: Request, res: Response): Promise<Response> {
    try {
      console.log('📦 Obteniendo todos los productos...');
      
      const products = await db.Product.findAll({
        include: [{
          model: db.Category,
          as: 'categoryInfo'
        }]
      });

      const productsJson = products.map((product: any) => product.toJSON());

      console.log(`✅ Total de productos encontrados: ${productsJson.length}`);
      
      return res.status(200).json(productsJson);
    } catch (error) {
      console.error('❌ Error al obtener productos:', error);
      return res.status(500).json({ 
        message: 'Error al obtener productos', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * ✅ NUEVO: Buscar productos por término
   * GET /api/productos/search?q=término
   * 
   * Busca en los campos: nombre, descripción
   */
  async search(req: Request, res: Response): Promise<Response> {
    try {
      const { q } = req.query;
      
      console.log('🔍 Búsqueda solicitada:', q);
      
      // Validar que se proporcionó un término de búsqueda
      if (!q || typeof q !== 'string' || q.trim() === '') {
        console.warn('⚠️ Búsqueda sin término');
        return res.status(400).json({ 
          message: 'Parámetro de búsqueda "q" requerido',
          example: '/api/productos/search?q=plug',
          receivedParams: { q }
        });
      }

      const searchTerm = q.trim();
      console.log('🔎 Término de búsqueda normalizado:', searchTerm);

      // Buscar productos que coincidan en nombre o descripción
      const products = await db.Product.findAll({
        where: {
          [Op.or]: [
            {
              nombre: {
                [Op.like]: `%${searchTerm}%`
              }
            },
            {
              descripcion: {
                [Op.like]: `%${searchTerm}%`
              }
            }
          ]
        },
        include: [{
          model: db.Category,
          as: 'categoryInfo'
        }],
        order: [['nombre', 'ASC']]
      });

      const productsJson = products.map((product: any) => product.toJSON());
      
      console.log(`✅ Productos encontrados: ${productsJson.length}`);
      if (productsJson.length > 0) {
        console.log('📋 Productos encontrados:');
        productsJson.forEach((p: any) => {
          console.log(`   - ${p.nombre} (ID: ${p.id})`);
        });
      }
      
      return res.status(200).json(productsJson);
      
    } catch (error) {
      console.error('❌ Error al buscar productos:', error);
      return res.status(500).json({ 
        message: 'Error al buscar productos', 
        error: (error as Error).message,
        suggestion: 'Verifica que el servidor de base de datos esté disponible'
      });
    }
  }

  /**
   * Obtener un producto por ID
   * GET /api/productos/:id
   */
  async show(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      console.log(`🔍 Obteniendo producto con ID: ${id}`);
      
      const product = await db.Product.findByPk(id, {
        include: [{
          model: db.Category,
          as: 'categoryInfo'
        }]
      });

      if (!product) {
        console.warn(`⚠️ Producto no encontrado: ID ${id}`);
        return res.status(404).json({ 
          message: 'Producto no encontrado',
          productId: id 
        });
      }

      console.log(`✅ Producto encontrado: ${product.get('nombre')}`);

      return res.status(200).json(product.toJSON());
    } catch (error) {
      console.error('❌ Error al obtener producto:', error);
      return res.status(500).json({ 
        message: 'Error al obtener producto', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtener productos por categoría
   * GET /api/productos/categoria/:categoryId
   */
  async getProductsByCategory(req: Request, res: Response): Promise<Response> {
    try {
      const { categoryId } = req.params;
      
      console.log(`📂 Obteniendo productos para la categoría: ${categoryId}`);
      
      const products = await db.Product.findAll({
        where: { categoria: categoryId },
        include: [{
          model: db.Category,
          as: 'categoryInfo'
        }],
        order: [['nombre', 'ASC']]
      });

      const productsJson = products.map((product: any) => product.toJSON());
      
      console.log(`✅ Productos encontrados para categoría ${categoryId}: ${productsJson.length}`);
      
      return res.status(200).json(productsJson);
    } catch (error) {
      console.error('❌ Error al obtener productos por categoría:', error);
      return res.status(500).json({ 
        message: 'Error al obtener productos por categoría', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Crear producto
   * POST /api/productos
   * Requiere: autenticación y permisos de admin
   */
  async store(req: Request, res: Response): Promise<Response> {
    try {
      const { nombre, descripcion, precio, categoria, carpetaimg, imagen } = req.body;

      console.log('📝 Creando nuevo producto:', nombre);

      // Validar datos requeridos
      if (!nombre || !precio || !categoria) {
        return res.status(400).json({ 
          message: 'Faltan campos requeridos: nombre, precio, categoria' 
        });
      }

      const newProduct = await db.Product.create({
        nombre,
        descripcion: descripcion || '',
        precio,
        categoria,
        carpetaimg: carpetaimg || 'default',
        imagen: imagen || 'default.jpg'
      });

      console.log(`✅ Producto creado exitosamente: ${nombre} (ID: ${newProduct.get('id')})`);

      return res.status(201).json(newProduct.toJSON());
    } catch (error) {
      console.error('❌ Error al crear producto:', error);
      return res.status(500).json({ 
        message: 'Error al crear producto', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Actualizar producto
   * PUT /api/productos/:id
   * Requiere: autenticación y permisos de admin
   */
  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { nombre, descripcion, precio, categoria, carpetaimg, imagen } = req.body;

      console.log(`🔄 Actualizando producto con ID: ${id}`);

      const product = await db.Product.findByPk(id);

      if (!product) {
        console.warn(`⚠️ Producto no encontrado para actualizar: ID ${id}`);
        return res.status(404).json({ 
          message: 'Producto no encontrado',
          productId: id 
        });
      }

      await product.update({
        nombre: nombre || product.get('nombre'),
        descripcion: descripcion !== undefined ? descripcion : product.get('descripcion'),
        precio: precio || product.get('precio'),
        categoria: categoria || product.get('categoria'),
        carpetaimg: carpetaimg || product.get('carpetaimg'),
        imagen: imagen || product.get('imagen')
      });

      console.log(`✅ Producto actualizado exitosamente: ${product.get('nombre')}`);

      return res.status(200).json(product.toJSON());
    } catch (error) {
      console.error('❌ Error al actualizar producto:', error);
      return res.status(500).json({ 
        message: 'Error al actualizar producto', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Eliminar producto
   * DELETE /api/productos/:id
   * Requiere: autenticación y permisos de admin
   */
  async destroy(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      console.log(`🗑️ Eliminando producto con ID: ${id}`);

      const product = await db.Product.findByPk(id);

      if (!product) {
        console.warn(`⚠️ Producto no encontrado para eliminar: ID ${id}`);
        return res.status(404).json({ 
          message: 'Producto no encontrado',
          productId: id 
        });
      }

      const productName = product.get('nombre');
      await product.destroy();

      console.log(`✅ Producto eliminado exitosamente: ${productName}`);

      return res.status(200).json({ 
        message: 'Producto eliminado correctamente',
        productId: id,
        productName: productName
      });
    } catch (error) {
      console.error('❌ Error al eliminar producto:', error);
      return res.status(500).json({ 
        message: 'Error al eliminar producto', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtener colores disponibles del producto
   * GET /api/productos/:id/color
   */
  async getColors(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const productId = parseInt(id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ 
          message: 'ID de producto no válido',
          receivedId: id
        });
      }
      
      console.log(`🎨 Obteniendo colores para producto ID: ${productId}`);
      
      // Primero intentamos obtener colores específicos para este producto
      const colors = await db.sequelize.query(
        'SELECT DISTINCT color FROM lineapedido WHERE idprod = :productId',
        {
          replacements: { productId },
          type: db.sequelize.QueryTypes.SELECT
        }
      );
      
      console.log(`✅ Colores encontrados: ${colors.length}`);
      
      // Si no hay colores específicos para este producto, usamos todos los colores disponibles
      if (!colors || colors.length === 0) {
        console.log('📋 Usando colores genéricos disponibles');
        
        const allColors = await db.sequelize.query(
          'SELECT id, nombre as color, codigo_color FROM product_colors',
          {
            type: db.sequelize.QueryTypes.SELECT
          }
        );
        
        return res.status(200).json(allColors);
      }
      
      return res.status(200).json(colors);
    } catch (error) {
      console.error('❌ Error al obtener colores del producto:', error);
      return res.status(500).json({ 
        message: 'Error al obtener colores', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtener imagen del producto
   * GET /api/productos/imagen/:categoria/:imagen
   */
  getImage(req: Request, res: Response): void {
    try {
      const { categoria, imagen } = req.params;
      const imagePath = path.join(__dirname, '../../public/images', categoria, imagen);

      console.log(`🖼️ Solicitando imagen: ${categoria}/${imagen}`);

      if (!fs.existsSync(imagePath)) {
        console.warn(`⚠️ Imagen no encontrada: ${imagePath}`);
        res.status(404).json({ 
          message: 'Imagen no encontrada',
          requestedPath: `${categoria}/${imagen}`
        });
        return;
      }

      console.log('✅ Imagen encontrada, enviando...');
      res.sendFile(imagePath);
    } catch (error) {
      console.error('❌ Error al obtener imagen:', error);
      res.status(500).json({ 
        message: 'Error al obtener imagen', 
        error: (error as Error).message 
      });
    }
  }
}

export default new ProductController();