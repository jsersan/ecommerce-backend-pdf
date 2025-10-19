import transporter from '../config/email.config';

/**
 * Servicio para enviar emails desde el backend
 */
export class EmailService {

  /**
   * Envía el albarán por email
   * @param pedido - Datos del pedido
   * @param lineas - Líneas del pedido
   * @param usuario - Datos del usuario (con email)
   * @param pdfBuffer - Buffer del PDF generado
   */
  static async enviarAlbaran(
    pedido: any,
    lineas: any[],
    usuario: any,
    pdfBuffer: Buffer
  ): Promise<boolean> {
    try {
      console.log('📧 Enviando albarán a:', usuario.email);

      if (!usuario.email) {
        console.error('❌ El usuario no tiene email configurado');
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: usuario.email,
        subject: `Albarán Pedido #${pedido.id} - TatooTenda`,
        html: this.generarTemplateHTML(pedido, usuario),
        attachments: [
          {
            filename: `Albaran_${pedido.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const info = await transporter.sendMail(mailOptions);

      console.log('✅ Albarán enviado exitosamente a:', usuario.email);
      console.log('📨 Message ID:', info.messageId);

      return true;

    } catch (error) {
      console.error('❌ Error al enviar albarán:', error);
      throw error;
    }
  }

  /**
   * Genera el template HTML del email
   */
  private static generarTemplateHTML(pedido: any, usuario: any): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #526E7A;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 20px 0;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #526E7A;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: 500;
            color: #666;
          }
          .info-value {
            color: #333;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .button {
            display: inline-block;
            background-color: #526E7A;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
          .highlight {
            background-color: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #526E7A;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ALBARÁN</h1>
            <p>Pedido #${pedido.id}</p>
          </div>

          <div class="content">
            <div class="section">
              <div class="section-title">Información del Pedido</div>
              <div class="info-row">
                <span class="info-label">Referencia:</span>
                <span class="info-value">#${pedido.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${this.formatearFecha(pedido.fecha)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total:</span>
                <span class="info-value"><strong>€ ${pedido.total.toFixed(2)}</strong></span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Datos de Envío</div>
              <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">${usuario.nombre || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Dirección:</span>
                <span class="info-value">${usuario.direccion || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Ciudad:</span>
                <span class="info-value">${usuario.ciudad || 'N/A'} - ${usuario.cp || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${usuario.email || 'N/A'}</span>
              </div>
            </div>

            <div class="highlight">
              <p>Adjunto encontrarás el albarán en PDF con todos los detalles de tu pedido.</p>
            </div>

            <div class="section">
              <p>Gracias por tu compra en <strong>TatooTenda</strong>.</p>
              <p>Si tienes cualquier pregunta, no dudes en contactarnos.</p>
            </div>
          </div>

          <div class="footer">
            <p>Este es un email automático. Por favor, no respondas a este correo.</p>
            <p>&copy; 2025 TatooTenda. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Formatea la fecha
   */
  private static formatearFecha(fecha: any): string {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }

  /**
   * Envía email de prueba
   */
  static async enviarPrueba(emailDestino: string): Promise<boolean> {
    try {
      console.log('📧 Enviando email de prueba a:', emailDestino);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emailDestino,
        subject: 'Email de Prueba - TatooTenda',
        html: `
          <h2>¡Email de prueba exitoso!</h2>
          <p>Si recibiste este email, significa que la configuración de email está funcionando correctamente.</p>
          <p><strong>Detalles:</strong></p>
          <ul>
            <li>Proveedor: ${process.env.EMAIL_PROVIDER || 'gmail'}</li>
            <li>Remitente: ${process.env.EMAIL_USER}</li>
            <li>Fecha/Hora: ${new Date().toLocaleString('es-ES')}</li>
          </ul>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Email de prueba enviado exitosamente');

      return true;

    } catch (error) {
      console.error('❌ Error al enviar email de prueba:', error);
      throw error;
    }
  }
}

export default EmailService;