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
  Logger,
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
import { EmailService } from '../email/email.service';
import { TokenService } from './token.service';
import { UploadService } from '../upload/upload.service';
import { CURRENT_TERMS_VERSION, MAX_CODE_ATTEMPTS } from '../common/constants';
import {
  CodePurpose,
  generateOneTimeCode,
  hashOneTimeCode,
} from '../common/oneTimeCode.util';
import { UserService } from '../user/user.service';

const CODE_FIELDS: Record<
  CodePurpose,
  {
    token: 'emailVerificationToken' | 'passwordResetToken';
    expires: 'emailVerificationExpires' | 'passwordResetExpires';
    attempts: 'emailVerificationAttempts' | 'passwordResetAttempts';
  }
> = {
  verify: {
    token: 'emailVerificationToken',
    expires: 'emailVerificationExpires',
    attempts: 'emailVerificationAttempts',
  },
  reset: {
    token: 'passwordResetToken',
    expires: 'passwordResetExpires',
    attempts: 'passwordResetAttempts',
  },
};

export type OAuthProvider = 'github' | 'google';

export interface OAuthProfile {
  providerId: string;
  /** Only a provider-verified email may be passed here */
  email?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export type OAuthResult =
  | {
      token: string;
      user: UserWithoutPasswordDto;
      isNew: boolean;
      provider: OAuthProvider;
      error?: undefined;
    }
  | {
      error: 'oauth_email_unverified' | 'oauth_account_exists' | 'oauth_failed';
      provider: OAuthProvider;
      email?: string;
    };

// Used to equalize timing when the account does not exist
let dummyBcryptHash: string | null = null;
function getDummyBcryptHash(): string {
  if (!dummyBcryptHash) {
    dummyBcryptHash = bcrypt.hashSync(
      crypto.randomBytes(16).toString('hex'),
      10,
    );
  }
  return dummyBcryptHash;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly uploadService: UploadService,
    private readonly userService: UserService,
  ) {}

  private isEmailVerificationEnabled(): boolean {
    const raw = this.configService.get<string>('REQUIRE_EMAIL_VERIFICATION');
    return ['1', 'true', 'yes', 'on'].includes((raw ?? '').toLowerCase());
  }

  private getDefaultShowRpe(): boolean {
    const defaultShowRpeRaw =
      this.configService.get<string>('DEFAULT_SHOW_RPE');
    return defaultShowRpeRaw == null
      ? true
      : ['1', 'true', 'yes', 'on'].includes(defaultShowRpeRaw.toLowerCase());
  }

  private get codeSecret(): string {
    return this.configService.get<string>('JWT_SECRET') ?? '';
  }

  /** Loads a user including the hidden auth columns. */
  private findUserWithSecrets(where: { email?: string; id?: number }) {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .addSelect([
        'user.password',
        'user.tokenVersion',
        'user.emailVerificationToken',
        'user.emailVerificationExpires',
        'user.emailVerificationAttempts',
        'user.passwordResetToken',
        'user.passwordResetExpires',
        'user.passwordResetAttempts',
      ]);
    if (where.id !== undefined) {
      qb.where('user.id = :id', { id: where.id });
    } else {
      qb.where('user.email = :email', { email: where.email });
    }
    return qb.getOne();
  }

  /**
   * Verify a one-time code with a hard limit on wrong attempts. An attempt is
   * reserved atomically before comparing, so parallel guesses cannot exceed
   * MAX_CODE_ATTEMPTS. Throws a generic 400 on any failure.
   */
  private async checkCode(
    user: User,
    purpose: CodePurpose,
    code: string,
    genericError: string,
  ): Promise<void> {
    const f = CODE_FIELDS[purpose];
    const storedHash = user[f.token];
    const expires = user[f.expires];

    if (!storedHash || !expires || new Date(expires) < new Date()) {
      throw new BadRequestException(genericError);
    }

    const reserved = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ [f.attempts]: () => `"${f.attempts}" + 1` } as any)
      .where('id = :id', { id: user.id })
      .andWhere(`"${f.attempts}" < :max`, { max: MAX_CODE_ATTEMPTS })
      .execute();

    if (!reserved.affected) {
      await this.invalidateCode(user.id, purpose);
      throw new BadRequestException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    const expected = Buffer.from(storedHash, 'hex');
    const actual = Buffer.from(
      hashOneTimeCode(this.codeSecret, purpose, user.id, code),
      'hex',
    );
    const ok =
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual);

    if (!ok) {
      const attemptsUsed = (user[f.attempts] ?? 0) + 1;
      if (attemptsUsed >= MAX_CODE_ATTEMPTS) {
        await this.invalidateCode(user.id, purpose);
        throw new BadRequestException(
          'Too many failed attempts. Please request a new code.',
        );
      }
      throw new BadRequestException(genericError);
    }
  }

  private async invalidateCode(userId: number, purpose: CodePurpose) {
    const f = CODE_FIELDS[purpose];
    await this.userRepo.update(userId, {
      [f.token]: null,
      [f.expires]: null,
    } as any);
  }

  async register(dto: RegisterDto): Promise<UserWithoutPasswordDto> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('User already exists');

    // Validated by the DTO, but never record consent unless it was given
    if (dto.termsAccepted !== true) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const requireVerification = this.isEmailVerificationEnabled();
    const now = new Date();

    const user = this.userRepo.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashed,
      showRpe: this.getDefaultShowRpe(),
      termsAcceptedAt: now,
      termsVersion: CURRENT_TERMS_VERSION,
      // Health data consent is voluntary and only recorded when given
      healthDataConsentAt: dto.healthDataConsent === true ? now : null,
      emailVerified: !requireVerification, // auto-verified when feature is disabled
    });
    const savedUser = await this.userRepo.save(user);

    // Send verification email only when feature is enabled
    if (requireVerification) {
      try {
        await this.sendNewVerificationCode(savedUser.id, savedUser.email);
      } catch {
        // Account is created; the user can request a new code later
        this.logger.error(
          `Could not send verification email for new user ${savedUser.id}`,
        );
      }
    }

    return new UserWithoutPasswordDto(savedUser);
  }

  /** Generates, stores and emails a fresh verification code. */
  async sendNewVerificationCode(userId: number, email: string): Promise<void> {
    await this.userService.sendVerificationCode(userId, email);
  }

  async login(dto: LoginDto) {
    const user = await this.findUserWithSecrets({ email: dto.email });

    if (!user || !user.password) {
      // Equalize response time to avoid account enumeration via timing
      await bcrypt.compare(dto.password, getDummyBcryptHash());
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (this.isEmailVerificationEnabled() && !user.emailVerified) {
      throw new ForbiddenException('email_not_verified');
    }

    const userDto = new UserWithoutPasswordDto(user);
    const token = this.tokenService.sign(user);

    return { token, user: userDto };
  }

  async verifyEmail(
    email: string,
    code: string,
  ): Promise<{ token: string; user: UserWithoutPasswordDto }> {
    const genericError = 'Invalid or expired verification code';
    const user = await this.findUserWithSecrets({ email });

    // Same response for unknown and already verified accounts
    if (!user || user.emailVerified) {
      throw new BadRequestException(genericError);
    }

    await this.checkCode(user, 'verify', code, genericError);

    await this.userRepo.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null as unknown as string,
      emailVerificationExpires: null as unknown as Date,
      emailVerificationAttempts: 0,
    });

    user.emailVerified = true;
    const token = this.tokenService.sign(user);
    return { token, user: new UserWithoutPasswordDto(user) };
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'email', 'emailVerified', 'emailVerificationExpires'],
    });

    // Return silently to avoid user enumeration
    if (!user || user.emailVerified) return;

    // Rate-limit: block resend if a code was sent less than 1 minute ago
    const oneMinuteFromNow = new Date(Date.now() + 14 * 60 * 1000);
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires > oneMinuteFromNow
    ) {
      throw new BadRequestException(
        'Please wait before requesting another code',
      );
    }

    await this.sendNewVerificationCode(user.id, user.email);
  }

  async forgotPassword(email: string): Promise<{ userId: number } | null> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'email', 'emailVerified'],
    });

    // Always return silently to avoid user enumeration
    if (!user || !user.emailVerified) return null;

    if (!this.emailService.isConfigured()) {
      this.logger.warn(
        'Password reset requested but email delivery is not configured (RESEND_API_KEY missing)',
      );
      return null;
    }

    const { code, hash, expires } = generateOneTimeCode(
      this.codeSecret,
      'reset',
      user.id,
    );
    await this.userRepo.update(user.id, {
      passwordResetToken: hash,
      passwordResetExpires: expires,
      passwordResetAttempts: 0,
    });

    await this.emailService.sendPasswordResetEmail(email, code);
    return { userId: user.id };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ userId: number }> {
    const genericError = 'Invalid or expired reset code';
    const user = await this.findUserWithSecrets({ email });

    if (!user) throw new BadRequestException(genericError);

    await this.checkCode(user, 'reset', code, genericError);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null as unknown as string,
      passwordResetExpires: null as unknown as Date,
      passwordResetAttempts: 0,
    });
    // Revoke all existing sessions
    await this.bumpTokenVersion(user.id);
    return { userId: user.id };
  }

  /** Invalidates every JWT issued to the user so far. */
  async bumpTokenVersion(userId: number): Promise<void> {
    await this.userRepo.increment({ id: userId }, 'tokenVersion', 1);
  }

  /**
   * Logout: revoke all tokens of the user owning the (valid) token.
   * Returns the user id for auditing, or null when no valid token was sent.
   */
  async logout(
    token: string | undefined,
  ): Promise<{ id: number; email: string } | null> {
    const payload = this.tokenService.verify(token);
    if (!payload?.id) return null;
    const user = await this.findUserWithSecrets({ id: payload.id });
    if (!user || (user.tokenVersion ?? 0) !== payload.tv) return null;
    await this.bumpTokenVersion(user.id);
    return { id: user.id, email: user.email };
  }

  async findOrCreateOAuthUser(
    provider: OAuthProvider,
    profile: OAuthProfile,
  ): Promise<OAuthResult> {
    const idField = provider === 'github' ? 'githubId' : 'googleId';

    try {
      // 1. Existing link by provider id
      let user = await this.userRepo
        .createQueryBuilder('user')
        .addSelect(['user.password', 'user.tokenVersion'])
        .where(`user.${idField} = :pid`, { pid: profile.providerId })
        .getOne();

      let isNew = false;

      if (!user) {
        if (!profile.email) {
          return { error: 'oauth_email_unverified', provider };
        }

        // 2. Existing account with the same (provider-verified) email.
        // Only link when the local account's ownership of the address has
        // actually been proven: either email verification is enforced and
        // done, or the account is OAuth-only (created from another provider
        // with a verified email). Otherwise an attacker could pre-register
        // the victim's address and have the victim's OAuth login linked in.
        const existing = await this.findUserWithSecrets({
          email: profile.email,
        });
        if (existing) {
          const ownershipProven =
            existing.emailVerified === true &&
            (this.isEmailVerificationEnabled() || !existing.password);
          if (!ownershipProven) {
            return {
              error: 'oauth_account_exists',
              provider,
              email: profile.email,
            };
          }
          await this.userRepo.update(existing.id, {
            [idField]: profile.providerId,
          });
          existing[idField] = profile.providerId;
          user = existing;
        }
      }

      if (!user) {
        // 3. Create new user — no consent recorded; the frontend must ask
        const avatar = await this.uploadService.processAvatarFromUrl(
          profile.avatar,
        );
        const created = this.userRepo.create({
          [idField]: profile.providerId,
          email: profile.email,
          firstName: (profile.firstName ?? '').slice(0, 50),
          lastName: (profile.lastName ?? '').slice(0, 50),
          avatar: avatar ?? undefined,
          showRpe: this.getDefaultShowRpe(),
          emailVerified: true, // provider confirmed the email
          termsAcceptedAt: null,
          termsVersion: null,
          healthDataConsentAt: null,
        });
        user = await this.userRepo.save(created);
        user.tokenVersion = 0;
        isNew = true;
      } else if (!user.avatar || !user.avatar.startsWith('/uploads/')) {
        // Replace missing / legacy remote avatar with a local copy
        const avatar = await this.uploadService.processAvatarFromUrl(
          profile.avatar,
        );
        if (avatar) {
          await this.userRepo.update(user.id, { avatar });
          user.avatar = avatar;
        }
      }

      const token = this.tokenService.sign(user);
      return { token, user: new UserWithoutPasswordDto(user), isNew, provider };
    } catch (error) {
      this.logger.error(
        `OAuth (${provider}) login failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { error: 'oauth_failed', provider };
    }
  }
}
