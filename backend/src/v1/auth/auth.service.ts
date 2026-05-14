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
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UserWithoutPasswordDto } from './dto/UserWithoutPassword.dto';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private isEmailVerificationEnabled(): boolean {
    const raw = this.configService.get<string>('REQUIRE_EMAIL_VERIFICATION');
    return ['1', 'true', 'yes', 'on'].includes((raw ?? '').toLowerCase());
  }

  private generateCode(): { code: string; hash: string; expires: Date } {
    const code = crypto.randomInt(100000, 999999).toString();
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    return { code, hash, expires };
  }

  async register(dto: RegisterDto): Promise<UserWithoutPasswordDto> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('User already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    const defaultShowRpeRaw =
      this.configService.get<string>('DEFAULT_SHOW_RPE');
    const defaultShowRpe =
      defaultShowRpeRaw == null
        ? true
        : ['1', 'true', 'yes', 'on'].includes(defaultShowRpeRaw.toLowerCase());

    const requireVerification = this.isEmailVerificationEnabled();

    let emailVerificationToken: string | undefined;
    let emailVerificationExpires: Date | undefined;
    let verificationCode: string | undefined;

    if (requireVerification) {
      const generated = this.generateCode();
      verificationCode = generated.code;
      emailVerificationToken = generated.hash;
      emailVerificationExpires = generated.expires;
    }

    const user = this.userRepo.create({
      ...dto,
      password: hashed,
      showRpe: defaultShowRpe,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      emailVerified: !requireVerification, // auto-verified when feature is disabled
      emailVerificationToken,
      emailVerificationExpires,
    });
    const savedUser = await this.userRepo.save(user);

    // Send verification email only when feature is enabled
    if (requireVerification && verificationCode) {
      await this.emailService.sendVerificationEmail(savedUser.email, verificationCode);
    }

    return new UserWithoutPasswordDto(savedUser);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'password',
        'showRpe',
        'onboardingCompleted',
        'emailVerified',
      ],
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (this.isEmailVerificationEnabled() && !user.emailVerified) {
      throw new ForbiddenException('email_not_verified');
    }

    const userDto = new UserWithoutPasswordDto(user);
    const token = this.jwtService.sign({ id: user.id, email: user.email });

    return { token, user: userDto };
  }

  async verifyEmail(email: string, code: string): Promise<{ token: string; user: UserWithoutPasswordDto }> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'showRpe',
        'onboardingCompleted',
        'emailVerified',
        'emailVerificationToken',
        'emailVerificationExpires',
      ],
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    const inputHash = crypto.createHash('sha256').update(code).digest('hex');

    if (
      !user.emailVerificationToken ||
      !user.emailVerificationExpires ||
      user.emailVerificationToken !== inputHash ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.userRepo.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null as unknown as string,
      emailVerificationExpires: null as unknown as Date,
    });

    user.emailVerified = true;
    const token = this.jwtService.sign({ id: user.id, email: user.email });
    return { token, user: new UserWithoutPasswordDto(user) };
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'emailVerified',
        'emailVerificationExpires',
      ],
    });

    // Return silently to avoid user enumeration
    if (!user) return;
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    // Rate-limit: block resend if a code was sent less than 1 minute ago
    const oneMinuteFromNow = new Date(Date.now() + 14 * 60 * 1000);
    if (user.emailVerificationExpires && user.emailVerificationExpires > oneMinuteFromNow) {
      throw new BadRequestException('Please wait before requesting another code');
    }

    const { code, hash, expires } = this.generateCode();
    await this.userRepo.update(user.id, {
      emailVerificationToken: hash,
      emailVerificationExpires: expires,
    });

    await this.emailService.sendVerificationEmail(email, code);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'email', 'emailVerified'],
    });

    // Always return silently to avoid user enumeration
    if (!user || !user.emailVerified) return;

    const { code, hash, expires } = this.generateCode();
    await this.userRepo.update(user.id, {
      passwordResetToken: hash,
      passwordResetExpires: expires,
    });

    await this.emailService.sendPasswordResetEmail(email, code);
  }

  async findOrCreateGithubUser(profile: {
    githubId: string;
    email?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }): Promise<{ token: string; user: UserWithoutPasswordDto; isNew: boolean }> {
    // 1. Try to find by githubId
    let user = await this.userRepo.findOne({ where: { githubId: profile.githubId } });

    if (!user && profile.email) {
      // 2. Try to find by email — link GitHub to existing account
      user = await this.userRepo.findOne({ where: { email: profile.email } });
      if (user) {
        await this.userRepo.update(user.id, { githubId: profile.githubId });
        user.githubId = profile.githubId;
      }
    }

    let isNew = false;
    if (!user) {
      // 3. Create new user
      const defaultShowRpeRaw = this.configService.get<string>('DEFAULT_SHOW_RPE');
      const defaultShowRpe =
        defaultShowRpeRaw == null
          ? true
          : ['1', 'true', 'yes', 'on'].includes(defaultShowRpeRaw.toLowerCase());

      user = this.userRepo.create({
        githubId: profile.githubId,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        showRpe: defaultShowRpe,
        emailVerified: true, // GitHub already confirmed the email
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
      });
      user = await this.userRepo.save(user);

      isNew = true;
    }

    // Ensure email is marked verified for GitHub users
    if (!user.emailVerified) {
      await this.userRepo.update(user.id, { emailVerified: true });
      user.emailVerified = true;
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    return { token, user: new UserWithoutPasswordDto(user), isNew };
  }

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }): Promise<{ token: string; user: UserWithoutPasswordDto; isNew: boolean }> {
    // 1. Try to find by googleId
    let user = await this.userRepo.findOne({ where: { googleId: profile.googleId } });

    if (!user && profile.email) {
      // 2. Try to find by email — link Google to existing account
      user = await this.userRepo.findOne({ where: { email: profile.email } });
      if (user) {
        await this.userRepo.update(user.id, { googleId: profile.googleId });
        user.googleId = profile.googleId;
      }
    }

    let isNew = false;
    if (!user) {
      // 3. Create new user
      const defaultShowRpeRaw = this.configService.get<string>('DEFAULT_SHOW_RPE');
      const defaultShowRpe =
        defaultShowRpeRaw == null
          ? true
          : ['1', 'true', 'yes', 'on'].includes(defaultShowRpeRaw.toLowerCase());

      user = this.userRepo.create({
        googleId: profile.googleId,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        showRpe: defaultShowRpe,
        emailVerified: true, // Google already confirmed the email
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
      });
      user = await this.userRepo.save(user);

      isNew = true;
    }

    // Ensure email is marked verified for Google users
    if (!user.emailVerified) {
      await this.userRepo.update(user.id, { emailVerified: true });
      user.emailVerified = true;
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    return { token, user: new UserWithoutPasswordDto(user), isNew };
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'passwordResetToken',
        'passwordResetExpires',
      ],
    });

    if (!user) throw new BadRequestException('Invalid or expired reset code');

    const inputHash = crypto.createHash('sha256').update(code).digest('hex');

    if (
      !user.passwordResetToken ||
      !user.passwordResetExpires ||
      user.passwordResetToken !== inputHash ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null as unknown as string,
      passwordResetExpires: null as unknown as Date,
    });
  }
}
