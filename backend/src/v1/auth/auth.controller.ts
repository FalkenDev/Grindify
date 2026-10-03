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
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Request, Response } from 'express';
import { AuthService, OAuthResult } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  clearAuthCookieOptions,
} from '../common/cookie.util';
import { AuditService } from '../audit/audit.service';
import {
  OAuthEnabledGuard,
  OAuthGuard,
  isOAuthProviderConfigured,
} from '../guards/oauth.guard';
import { ConfigService } from '@nestjs/config';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// Strict per-IP limits for credential / code endpoints
const LOGIN_LIMIT = { default: { limit: 10, ttl: 5 * MINUTE } };
const REGISTER_LIMIT = { default: { limit: 5, ttl: HOUR } };
const FORGOT_LIMIT = { default: { limit: 5, ttl: HOUR } };
const RESET_LIMIT = { default: { limit: 10, ttl: 15 * MINUTE } };
const VERIFY_LIMIT = { default: { limit: 10, ttl: 15 * MINUTE } };
const RESEND_LIMIT = { default: { limit: 5, ttl: HOUR } };
const OAUTH_LIMIT = { default: { limit: 20, ttl: 5 * MINUTE } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Get('health')
  @SkipThrottle()
  @ApiOkResponse({ description: 'API and database are healthy' })
  async health(@Res({ passthrough: true }) res: Response) {
    try {
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000),
        ),
      ]);
      return { ok: true, db: 'up' };
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { ok: false, db: 'down' };
    }
  }

  @Post('register')
  @Throttle(REGISTER_LIMIT)
  @ApiCreatedResponse({
    description: 'User created successfully. Verification email sent.',
  })
  @ApiBadRequestResponse({ description: 'User already exists' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const user = await this.authService.register(dto);
    await this.auditService.log({
      action: 'auth.register',
      actor: user,
      targetType: 'user',
      targetId: user.id,
      metadata: {
        termsVersion: user.termsVersion,
        healthDataConsent: user.healthDataConsent,
      },
      req,
    });
    return user;
  }

  @Post('login')
  @Throttle(LOGIN_LIMIT)
  @ApiOkResponse({ description: 'Login successful' })
  @ApiBadRequestResponse({ description: 'Invalid credentials' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    try {
      const { token, user } = await this.authService.login(dto);
      res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions(req));
      await this.auditService.log({
        action: 'auth.login',
        actor: user,
        targetType: 'user',
        targetId: user.id,
        metadata: { method: 'password' },
        req,
      });
      return { user };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        await this.auditService.log({
          action: 'auth.login_failed',
          actor: { email: dto.email },
          metadata: {
            reason:
              error instanceof ForbiddenException
                ? 'email_not_verified'
                : 'invalid_credentials',
          },
          req,
        });
      }
      throw error;
    }
  }

  @Post('verify-email')
  @Throttle(VERIFY_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Email verified successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid or expired verification code',
  })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { token, user } = await this.authService.verifyEmail(
      dto.email,
      dto.code,
    );

    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions(req));
    await this.auditService.log({
      action: 'auth.email_verified',
      actor: user,
      targetType: 'user',
      targetId: user.id,
      req,
    });

    return { user };
  }

  @Post('logout')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Logged out successfully' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const actor = await this.authService.logout(
      req.cookies?.[AUTH_COOKIE_NAME],
    );
    res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions(req));
    if (actor) {
      await this.auditService.log({
        action: 'auth.logout',
        actor,
        targetType: 'user',
        targetId: actor.id,
        req,
      });
    }
    return { ok: true };
  }

  @Post('resend-verification')
  @Throttle(RESEND_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Verification email sent' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerification(dto.email);
    return {
      message:
        'If the account exists and is unverified, a new code has been sent',
    };
  }

  @Post('forgot-password')
  @Throttle(FORGOT_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Password reset email sent if account exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const result = await this.authService.forgotPassword(dto.email);
    if (result) {
      await this.auditService.log({
        action: 'auth.password_reset_requested',
        actor: { id: result.userId, email: dto.email },
        targetType: 'user',
        targetId: result.userId,
        req,
      });
    }
    return {
      message:
        'If an account with that email exists, a reset code has been sent',
    };
  }

  @Post('reset-password')
  @Throttle(RESET_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Password reset successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or expired reset code' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const { userId } = await this.authService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
    );
    await this.auditService.log({
      action: 'auth.password_reset',
      actor: { id: userId, email: dto.email },
      targetType: 'user',
      targetId: userId,
      req,
    });
    return { message: 'Password reset successfully' };
  }

  @Get('providers')
  @ApiOkResponse({
    description: 'Which OAuth login providers are enabled on this server',
    schema: { example: { github: true, google: false } },
  })
  providers(): { github: boolean; google: boolean } {
    return {
      github: isOAuthProviderConfigured(this.configService, 'github'),
      google: isOAuthProviderConfigured(this.configService, 'google'),
    };
  }

  @Get('github')
  @Throttle(OAUTH_LIMIT)
  @UseGuards(OAuthEnabledGuard('github'), AuthGuard('github'))
  githubLogin() {
    // Passport redirects to GitHub — no body needed
  }

  @Get('github/callback')
  @Throttle(OAUTH_LIMIT)
  @UseGuards(OAuthGuard('github'))
  async githubCallback(
    @Req() req: Request & { user?: OAuthResult },
    @Res() res: Response,
  ) {
    return this.finishOAuth('github', req, res);
  }

  @Get('google')
  @Throttle(OAUTH_LIMIT)
  @UseGuards(OAuthEnabledGuard('google'), AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google — no body needed
  }

  @Get('google/callback')
  @Throttle(OAUTH_LIMIT)
  @UseGuards(OAuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user?: OAuthResult },
    @Res() res: Response,
  ) {
    return this.finishOAuth('google', req, res);
  }

  /**
   * Sets the auth cookie and redirects back to the frontend. No user data is
   * ever put in the URL — the frontend fetches GET /v1/users afterwards.
   */
  private async finishOAuth(
    provider: 'github' | 'google',
    req: Request & { user?: OAuthResult },
    res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const result = req.user;

    if (!result || result.error !== undefined) {
      const error = result?.error ?? 'oauth_failed';
      await this.auditService.log({
        action: 'auth.login_failed',
        actor:
          result?.error === 'oauth_account_exists'
            ? { email: result.email }
            : null,
        metadata: { method: provider, reason: error },
        req,
      });
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(error)}`,
      );
    }

    res.cookie(AUTH_COOKIE_NAME, result.token, authCookieOptions(req));

    await this.auditService.log({
      action: result.isNew ? 'auth.register' : 'auth.login',
      actor: result.user,
      targetType: 'user',
      targetId: result.user.id,
      metadata: { method: provider },
      req,
    });

    const redirect = result.isNew ? '/onboarding' : '/';
    return res.redirect(
      `${frontendUrl}/oauth-callback?redirect=${encodeURIComponent(redirect)}`,
    );
  }
}
