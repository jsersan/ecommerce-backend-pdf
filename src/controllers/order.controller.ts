// src/controllers/order.controller.ts

import { Request, Response } from 'express'
import db from '../models'
import { IOrder, IOrderLine } from '../interfaces/order.interface'
import { Transaction } from 'sequelize'
import { PdfService } from '../services/pdf.service'
import { EmailService } from '../services/email.service'

const Order = db.Order
const OrderLine = db.OrderLine
const User = db.User
const Product = db.Product

const orderController = {
  /**
   * Obtiene pedidos de un usuario específico
   * GET /api/pedidos/user/:userId
   */
  findByUser: async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = parseInt(req.params.userId)
      
      console.log('🚀 Buscando pedidos para usuario:', userId);
      console.log('🔐 Usuario autenticado:', req.userId);

      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ 
          message: 'ID de usuario no válido' 
        });
      }

      if (req.userId !== userId && !(await isAdmin(req.userId))) {
        console.warn(`⚠️ Usuario ${req.userId} intentó acceder a pedidos de usuario ${userId}`);
        return res.status(403).json({ 
          message: 'No autorizado para ver estos pedidos' 
        })
      }

      const user = await User.findByPk(userId)
      if (!user) {
        return res.status(404).json({ 
          message: 'Usuario no encontrado' 
        })
      }

      const orders = await Order.findAll({
        where: { iduser: userId },
        include: [
          {
            model: OrderLine,
            as: 'lineas',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'nombre', 'precio', 'imagen', 'carpetaimg'],
                required: false
              }
            ]
          }
        ],
        order: [['fecha', 'DESC']]
      })

      console.log(`✅ Encontrados ${orders.length} pedidos para usuario ${userId}`);

      const formattedOrders = orders.map((order: any) => {
        const orderData = order.toJSON();
        
        const lineas = orderData.lineas?.map((linea: any) => {
          const precioProducto = linea.product?.precio ? parseFloat(linea.product.precio) : 0;
          const cantidad = linea.cant || 1;
          
          return {
            id: linea.id,
            idpedido: linea.idpedido,
            idprod: linea.idprod,
            nombre: linea.nombre || linea.product?.nombre || 'Sin nombre',
            color: linea.color,
            cantidad: cantidad,
            cant: cantidad,
            precio: precioProducto,
            subtotal: precioProducto * cantidad,
            product: linea.product
          };
        }) || [];

        return {
          id: orderData.id,
          fecha: orderData.fecha,
          total: orderData.total,
          lineas: lineas,
          iduser: orderData.iduser
        };
      });

      console.log('✅ Pedidos formateados correctamente para Angular');

      return res.status(200).json(formattedOrders)
    } catch (err) {
      console.error('❌ Error al obtener pedidos del usuario:', err)
      if (err instanceof Error) {
        return res.status(500).json({ message: err.message })
      }
      return res.status(500).json({ message: 'Error al obtener pedidos' })
    }
  },

  /**
   * Obtiene un pedido específico con todos sus detalles
   * GET /api/pedidos/:id
   */
  findOne: async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id)
      
      console.log('🚀 Buscando pedido con ID:', id);
      console.log('🔐 Usuario autenticado:', req.userId);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ 
          message: 'ID de pedido no válido' 
        });
      }

      const order = await Order.findByPk(id, {
        include: [
          {
            model: OrderLine,
            as: 'lineas',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'nombre', 'precio', 'imagen', 'carpetaimg'],
                required: false
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'nombre', 'email']
          }
        ]
      })

      if (!order) {
        return res.status(404).json({ 
          message: 'Pedido no encontrado' 
        })
      }

      if (order.get('iduser') !== req.userId && !(await isAdmin(req.userId))) {
        console.warn(`⚠️ Usuario ${req.userId} intentó acceder al pedido ${id} de otro usuario`);
        return res.status(403).json({ 
          message: 'No autorizado para ver este pedido' 
        })
      }

      console.log(`✅ Pedido ${id} encontrado y autorizado`);

      return res.status(200).json(order)
    } catch (err) {
      console.error('❌ Error al obtener pedido:', err)
      if (err instanceof Error) {
        return res.status(500).json({ message: err.message })
      }
      return res.status(500).json({ message: 'Error al obtener el pedido' })
    }
  },

  /**
   * Crea un nuevo pedido
   * POST /api/pedidos
   */
  create: async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log('🚀 Creando nuevo pedido...');
      console.log('📦 Datos recibidos:', req.body);
      console.log('🔐 Usuario autenticado:', req.userId);

      const userId = req.userId;
      if (!userId) {
        console.error('❌ No hay usuario autenticado');
        return res.status(401).json({
          message: 'Usuario no autenticado'
        });
      }

      const orderData = req.body;
      
      if (!orderData.total || orderData.total <= 0) {
        return res.status(400).json({
          message: 'El total del pedido debe ser mayor a 0'
        });
      }

      if (!orderData.lineas || !Array.isArray(orderData.lineas) || orderData.lineas.length === 0) {
        return res.status(400).json({ 
          message: 'El pedido debe contener al menos un producto' 
        });
      }

      for (let i = 0; i < orderData.lineas.length; i++) {
        const linea = orderData.lineas[i];
        
        if (!linea.idprod || linea.idprod <= 0) {
          return res.status(400).json({
            message: `Línea ${i + 1}: ID de producto no válido`
          });
        }
        
        if (!linea.cant || linea.cant <= 0) {
          return res.status(400).json({
            message: `Línea ${i + 1}: Cantidad debe ser mayor a 0`
          });
        }
        
        if (!linea.color) {
          return res.status(400).json({
            message: `Línea ${i + 1}: Color es requerido`
          });
        }

        const product = await Product.findByPk(linea.idprod);
        if (!product) {
          return res.status(400).json({
            message: `Línea ${i + 1}: Producto con ID ${linea.idprod} no encontrado`
          });
        }
      }

      const result = await db.sequelize.transaction(async (t: Transaction) => {
        console.log('💾 Iniciando transacción de base de datos...');

        const order = await Order.create(
          {
            iduser: userId,
            fecha: orderData.fecha || new Date().toISOString().split('T')[0],
            total: parseFloat(orderData.total)
          },
          { transaction: t }
        )

        const orderId = order.get('id') as number;
        console.log(`✅ Pedido creado con ID: ${orderId}`);

        const orderLines: IOrderLine[] = orderData.lineas.map((line: any) => ({
          idpedido: orderId,
          idprod: line.idprod,
          color: line.color || 'Estándar',
          cant: line.cant,
          nombre: line.nombre || ''
        }));

        await OrderLine.bulkCreate(orderLines, { transaction: t });
        console.log(`✅ Creadas ${orderLines.length} líneas de pedido`);

        const completeOrder = await Order.findByPk(orderId, {
          include: [
            {
              model: OrderLine,
              as: 'lineas',
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'nombre', 'precio', 'imagen', 'carpetaimg'],
                  required: false
                }
              ]
            },
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'nombre', 'email', 'direccion', 'ciudad', 'cp']
            }
          ],
          transaction: t
        });

        return completeOrder;
      });

      console.log('✅ Pedido creado exitosamente:', result?.get('id'));

      // Intentar enviar email automáticamente (sin bloquear si falla)
      try {
        const pedidoJSON = result?.toJSON();
        const lineasFormato = pedidoJSON.lineas?.map((linea: any) => ({
          id: linea.id,
          idpedido: linea.idpedido,
          idprod: linea.idprod,
          nombre: linea.nombre || linea.product?.nombre || 'Sin nombre',
          color: linea.color,
          cant: linea.cant || 1,
          cantidad: linea.cant || 1,
          precio: linea.product?.precio || 0,
          product: linea.product
        })) || [];

        const pdfBuffer = PdfService.generarAlbaranBuffer(pedidoJSON, lineasFormato, pedidoJSON.user);
        await EmailService.enviarAlbaran(pedidoJSON, lineasFormato, pedidoJSON.user, pdfBuffer);
        console.log('✅ Email de albarán enviado automáticamente');
      } catch (emailError) {
        console.warn('⚠️ Error al enviar email automático (no bloquea la operación):', emailError);
      }

      return res.status(201).json(result)
    } catch (err) {
      console.error('❌ Error al crear pedido:', err)
      
      if (err instanceof Error) {
        if (err.name === 'SequelizeValidationError') {
          return res.status(400).json({
            message: 'Error de validación en los datos',
            details: err.message
          });
        }
        
        if (err.name === 'SequelizeForeignKeyConstraintError') {
          return res.status(400).json({
            message: 'Error de referencia: producto o usuario no válido',
            details: err.message
          });
        }
        
        return res.status(500).json({ 
          message: 'Error al crear el pedido',
          details: err.message 
        });
      }
      
      return res.status(500).json({ 
        message: 'Error al crear el pedido' 
      });
    }
  },

  /**
   * Envía el albarán por email
   * POST /api/pedidos/:id/enviar-albaran
   */
  enviarAlbaran: async (req: Request, res: Response): Promise<Response> => {
    try {
      const pedidoId = parseInt(req.params.id);
      
      console.log('📧 Iniciando proceso de envío de albarán para pedido:', pedidoId);
      console.log('👤 Usuario autenticado:', req.userId);

      if (isNaN(pedidoId) || pedidoId <= 0) {
        return res.status(400).json({ 
          message: 'ID de pedido no válido' 
        });
      }

      const order = await Order.findByPk(pedidoId);
      
      if (!order) {
        return res.status(404).json({ 
          message: 'Pedido no encontrado' 
        });
      }

      if (order.get('iduser') !== req.userId && !(await isAdmin(req.userId))) {
        console.warn(`⚠️ Usuario ${req.userId} intentó enviar albarán de pedido ${pedidoId} de otro usuario`);
        return res.status(403).json({ 
          message: 'No autorizado para enviar este albarán' 
        });
      }

      const pedidoCompleto = await Order.findByPk(pedidoId, {
        include: [
          {
            model: OrderLine,
            as: 'lineas',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'nombre', 'precio', 'imagen', 'carpetaimg'],
                required: false
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nombre', 'email', 'username', 'direccion', 'ciudad', 'cp']
          }
        ]
      });

      const pedidoData = pedidoCompleto?.toJSON();
      
      if (!pedidoData?.user?.email) {
        return res.status(400).json({ 
          message: 'El usuario no tiene email configurado' 
        });
      }

      const lineas = pedidoData.lineas?.map((linea: any) => ({
        id: linea.id,
        idpedido: linea.idpedido,
        idprod: linea.idprod,
        nombre: linea.nombre || linea.product?.nombre || 'Sin nombre',
        color: linea.color,
        cantidad: linea.cant || 1,
        cant: linea.cant || 1,
        precio: linea.product?.precio || 0,
        product: linea.product
      })) || [];

      const pdfBuffer = PdfService.generarAlbaranBuffer(
        pedidoData,
        lineas,
        pedidoData.user
      );

      await EmailService.enviarAlbaran(
        pedidoData,
        lineas,
        pedidoData.user,
        pdfBuffer
      );

      console.log('✅ Albarán enviado exitosamente a:', pedidoData.user.email);

      return res.status(200).json({
        message: 'Albarán enviado exitosamente',
        email: pedidoData.user.email,
        pedidoId: pedidoId
      });

    } catch (error) {
      console.error('❌ Error al enviar albarán:', error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          message: 'Error al enviar el albarán',
          details: error.message
        });
      }
      
      return res.status(500).json({
        message: 'Error al enviar el albarán'
      });
    }
  },

  /**
   * Obtiene todos los pedidos (solo admin)
   * GET /api/pedidos
   */
  findAll: async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log('🚀 Obteniendo todos los pedidos (admin)');
      console.log('🔐 Usuario autenticado:', req.userId);

      if (!(await isAdmin(req.userId))) {
        return res.status(403).json({
          message: 'Se requieren permisos de administrador'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const { count, rows: orders } = await Order.findAndCountAll({
        include: [
          {
            model: OrderLine,
            as: 'lineas',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'nombre', 'precio', 'imagen', 'carpetaimg'],
                required: false
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'nombre', 'email']
          }
        ],
        order: [['fecha', 'DESC']],
        limit,
        offset
      });

      return res.status(200).json({
        orders,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          limit
        }
      });
    } catch (err) {
      console.error('❌ Error al obtener todos los pedidos:', err);
      if (err instanceof Error) {
        return res.status(500).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Error al obtener pedidos' });
    }
  }
}

/**
 * Función auxiliar para verificar si un usuario es administrador
 */
const isAdmin = async (userId: number | undefined): Promise<boolean> => {
  if (!userId) return false

  try {
    const user = await User.findByPk(userId)
    const isAdminUser = user && (user.get('username') === 'admin' || user.get('role') === 'admin');
    
    console.log(`🔐 Verificación de admin para usuario ${userId}:`, isAdminUser);
    return isAdminUser;
  } catch (error) {
    console.error('❌ Error al verificar permisos de admin:', error);
    return false;
  }
}

export default orderController;