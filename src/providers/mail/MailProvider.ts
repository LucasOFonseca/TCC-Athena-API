import nodemailer from 'nodemailer';
import { AppError } from '../../infra/http/errors';

export class MailProvider {
  private client = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_PROVIDER_USER,
      pass: process.env.EMAIL_PROVIDER_PASSWORD,
    },
  });

  async sendMail(to: string, subject: string, template: string) {
    try {
      await this.client.sendMail({
        from: `Athena Software <${process.env.EMAIL_PROVIDER_USER}>`,
        to,
        subject,
        html: template,
      });
    } catch (error) {
      throw new AppError(error);
    }
  }
}
