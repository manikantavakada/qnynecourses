import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type EmailJob =
  | { type: 'verify-email'; to: string; name: string; token: string }
  | { type: 'password-reset'; to: string; name: string; token: string }
  | { type: 'receipt'; to: string; name: string; courseTitle: string; amount: number };

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('EMAIL_PROVIDER_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.config.get<string>('EMAIL_FROM') ?? 'Qnyne <no-reply@qnyne.com>';
    this.frontendUrl = (this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  async send(job: EmailJob) {
    const { subject, html } = this.render(job);
    if (!this.resend) {
      this.logger.warn(`EMAIL_PROVIDER_API_KEY is not set; skipping send of "${subject}" to ${job.to}`);
      return;
    }
    await this.resend.emails.send({ from: this.from, to: job.to, subject, html });
  }

  private render(job: EmailJob): { subject: string; html: string } {
    switch (job.type) {
      case 'verify-email': {
        const link = `${this.frontendUrl}/verify-email/${job.token}`;
        return {
          subject: 'Verify your email',
          html: `<p>Hi ${job.name},</p><p>Confirm your email address to activate your account:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
        };
      }
      case 'password-reset': {
        const link = `${this.frontendUrl}/reset-password/${job.token}`;
        return {
          subject: 'Reset your password',
          html: `<p>Hi ${job.name},</p><p>We received a request to reset your password. If this was you, click the link below:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
        };
      }
      case 'receipt':
        return {
          subject: 'Your purchase receipt',
          html: `<p>Hi ${job.name},</p><p>Thanks for purchasing <strong>${job.courseTitle}</strong> for ₹${(job.amount / 100).toFixed(2)}.</p>`,
        };
    }
  }
}
