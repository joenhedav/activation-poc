import { Injectable } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer';

/** Envía emails por SMTP. En la POC el destino es Mailhog (puerto 1025). */
@Injectable()
export class MailerService {
  private readonly transporter: Transporter = createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    ignoreTLS: true,
  });

  async send(to: string, subject: string, text: string): Promise<void> {
    await this.transporter.sendMail({
      from: 'Activaciones <activaciones@poc.demo>',
      to,
      subject,
      text,
    });
  }
}
