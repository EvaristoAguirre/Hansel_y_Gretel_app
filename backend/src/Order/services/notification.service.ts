import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'hanselygretel.chocolateria@gmail.com',
        pass: 'tu-contraseña-app', // Usa una contraseña de aplicación o similar.
      },
    });
  }

  async notifyError(subject: string, message: string) {
    try {
      await this.transporter.sendMail({
        from: '"Gestión de la Cafetería" <tu-correo@gmail.com>',
        to: 'destinatario@gmail.com', // Cambia esto por el correo destinatario.
        subject,
        text: message,
      });

      console.log('Notificación enviada exitosamente.');
    } catch (error) {
      console.error('Error al enviar la notificación:', error.message);
    }
  }
}
