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

import { Controller, Post, Body, Res, Get, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
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
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return { ok: true, at: 'auth' };
  }

  @Post('register')
  @ApiCreatedResponse({ description: 'User created successfully. Verification email sent.' })
  @ApiBadRequestResponse({ description: 'User already exists' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOkResponse({ description: 'Login successful' })
  @ApiBadRequestResponse({ description: 'Invalid credentials' })
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const isLocalhost =
      req.hostname === 'localhost' ||
      req.hostname === '127.0.0.1' ||
      req.hostname === '::1';

    const cookiePath = process.env.AUTH_COOKIE_PATH || '/';

    const envSameSite = process.env.AUTH_COOKIE_SAMESITE?.toLowerCase();
    let cookieSameSite: boolean | 'lax' | 'strict' | 'none' | undefined = 'lax';
    if (envSameSite === 'lax' || envSameSite === 'strict' || envSameSite === 'none') {
      cookieSameSite = envSameSite;
    } else if (envSameSite === 'true') {
      cookieSameSite = true;
    } else if (envSameSite === 'false') {
      cookieSameSite = false;
    } else if (envSameSite === undefined) {
      cookieSameSite = 'lax';
    } else {
      cookieSameSite = undefined;
    }

    let cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined;
    let cookieSecure = process.env.AUTH_COOKIE_SECURE === 'true';

    // Local dev (http://localhost:*): never set Domain or Secure, and avoid SameSite=None
    if (isLocalhost) {
      cookieDomain = undefined;
      cookieSecure = false;
      cookieSameSite = 'lax';
    }

    // Browsers require Secure when SameSite=None
    if (cookieSameSite === 'none') {
      cookieSecure = true;
    }

    return this.authService.login(dto).then(({ token, user }) => {
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
        ...(cookiePath ? { path: cookiePath } : {}),
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      return { user };
    });
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Email verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or expired verification code' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { token, user } = await this.authService.verifyEmail(dto.email, dto.code);

    const isLocalhost =
      req.hostname === 'localhost' ||
      req.hostname === '127.0.0.1' ||
      req.hostname === '::1';

    const cookiePath = process.env.AUTH_COOKIE_PATH || '/';
    let cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined;
    let cookieSecure = process.env.AUTH_COOKIE_SECURE === 'true';
    let cookieSameSite: boolean | 'lax' | 'strict' | 'none' | undefined = 'lax';

    if (isLocalhost) {
      cookieDomain = undefined;
      cookieSecure = false;
      cookieSameSite = 'lax';
    }

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      ...(cookiePath ? { path: cookiePath } : {}),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Logged out successfully' })
  logout(@Res({ passthrough: true }) res: Response) {
    const cookiePath = process.env.AUTH_COOKIE_PATH || '/';
    res.clearCookie('auth_token', { path: cookiePath });
    return { ok: true };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Verification email sent' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerification(dto.email);
    return { message: 'If the account exists and is unverified, a new code has been sent' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Password reset email sent if account exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If an account with that email exists, a reset code has been sent' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Password reset successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or expired reset code' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
    return { message: 'Password reset successfully' };
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // Passport redirects to GitHub — no body needed
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const { token, user, isNew } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const isLocalhost =
      req.hostname === 'localhost' ||
      req.hostname === '127.0.0.1' ||
      req.hostname === '::1';

    const cookiePath = process.env.AUTH_COOKIE_PATH || '/';
    let cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined;
    let cookieSecure = process.env.AUTH_COOKIE_SECURE === 'true';
    let cookieSameSite: boolean | 'lax' | 'strict' | 'none' | undefined = 'lax';

    if (isLocalhost) {
      cookieDomain = undefined;
      cookieSecure = false;
      cookieSameSite = 'lax';
    }

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      ...(cookiePath ? { path: cookiePath } : {}),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Pass user data to frontend via a short-lived query param (base64 encoded)
    const userParam = Buffer.from(JSON.stringify(user)).toString('base64url');
    const redirect = isNew ? '/onboarding' : '/';
    res.redirect(`${frontendUrl}/oauth-callback?user=${userParam}&redirect=${redirect}`);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google — no body needed
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const { token, user, isNew } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const isLocalhost =
      req.hostname === 'localhost' ||
      req.hostname === '127.0.0.1' ||
      req.hostname === '::1';

    const cookiePath = process.env.AUTH_COOKIE_PATH || '/';
    let cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined;
    let cookieSecure = process.env.AUTH_COOKIE_SECURE === 'true';
    let cookieSameSite: boolean | 'lax' | 'strict' | 'none' | undefined = 'lax';

    if (isLocalhost) {
      cookieDomain = undefined;
      cookieSecure = false;
      cookieSameSite = 'lax';
    }

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      ...(cookiePath ? { path: cookiePath } : {}),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Pass user data to frontend via a short-lived query param (base64 encoded)
    const userParam = Buffer.from(JSON.stringify(user)).toString('base64url');
    const redirect = isNew ? '/onboarding' : '/';
    res.redirect(`${frontendUrl}/oauth-callback?user=${userParam}&redirect=${redirect}`);
  }
}
