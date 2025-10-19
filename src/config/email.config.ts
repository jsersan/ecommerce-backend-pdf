import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración de Nodemailer para envío de emails
 * Soporta: Gmail, SendGrid, SMTP genérico
 */

const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

let transporter: nodemailer.Transporter;

if (emailProvider === 'gmail') {
  // Configuración para Gmail
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // App password de Gmail, no contraseña normal
    }
  });
} else if (emailProvider === 'sendgrid') {
  // Configuración para SendGrid
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });
} else {
  // Configuración genérica SMTP
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
}

export default transporter;