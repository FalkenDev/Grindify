/*
 * Copyright (c) 2026 FalkenDev
 *
 * This file is part of Grindify.
 *
 * Grindify is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with Grindify. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/** "john.doe@example.com" -> "jo***@example.com" (for logs only). */
export function maskEmail(email: string): string {
  const [local, domain] = (email ?? '').split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}

@Injectable()
export class EmailService {
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.from =
      this.configService.get<string>('EMAIL_FROM') ?? 'noreply@localhost';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    // Resend throws on a missing key — only create the client when configured
    this.resend = apiKey?.trim() ? new Resend(apiKey.trim()) : null;
    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY is not set — outgoing email (verification / password reset) is disabled',
      );
    }
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  private getClient(): Resend {
    if (!this.resend) {
      throw new ServiceUnavailableException('Email delivery is not configured');
    }
    return this.resend;
  }

  async sendVerificationEmail(to: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #555; margin-bottom: 24px;">Use the code below to verify your Grindify account. It expires in <strong>15 minutes</strong>.</p>
        <div style="background: #fff; border: 2px solid #e0e0e0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #999; font-size: 13px;">If you didn't create a Grindify account, you can safely ignore this email.</p>
      </div>
    `;

    try {
      await this.getClient().emails.send({
        from: this.from,
        to,
        subject: `${code} is your Grindify verification code`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${maskEmail(to)}`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #555; margin-bottom: 24px;">Use the code below to reset your Grindify password. It expires in <strong>15 minutes</strong>.</p>
        <div style="background: #fff; border: 2px solid #e0e0e0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #999; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
      </div>
    `;

    try {
      await this.getClient().emails.send({
        from: this.from,
        to,
        subject: `${code} is your Grindify password reset code`,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${maskEmail(to)}`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}
