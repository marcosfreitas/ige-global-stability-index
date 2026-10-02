import { Resend } from 'resend';
import { assertEnv } from '@/shared/config/assert-env';
import { ExternalApiError } from '@/shared/errors';

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface IEmailProvider {
  send(payload: EmailPayload): Promise<void>;
}

export class ResendProvider implements IEmailProvider {
  private client: Resend;
  private from: string;

  constructor() {
    this.client = new Resend(assertEnv('RESEND_API_KEY'));
    this.from = assertEnv('RESEND_FROM_EMAIL');
  }

  async send({ to, subject, html, text, from }: EmailPayload): Promise<void> {
    const { error } = await this.client.emails.send({
      from: from ?? this.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(text ? { text } : {}),
    });

    if (error) {
      throw new ExternalApiError('Resend', error.message);
    }
  }
}
