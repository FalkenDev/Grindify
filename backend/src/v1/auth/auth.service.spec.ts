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

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../user/user.entity';
import { EmailService } from '../email/email.service';
import { TokenService } from './token.service';
import { UploadService } from '../upload/upload.service';
import { UserService } from '../user/user.service';
import { hashOneTimeCode } from '../common/oneTimeCode.util';
import { MAX_CODE_ATTEMPTS } from '../common/constants';

const SECRET = 'x'.repeat(40);

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'a@example.com',
    emailVerified: true,
    password: 'hash',
    tokenVersion: 0,
    passwordResetToken: hashOneTimeCode(SECRET, 'reset', 1, '123456'),
    passwordResetExpires: new Date(Date.now() + 60_000),
    passwordResetAttempts: 0,
    ...overrides,
  } as User;
}

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let current: User | null;
  let attempts: number;
  let config: Record<string, string>;

  beforeEach(async () => {
    attempts = 0;
    current = makeUser();
    config = { JWT_SECRET: SECRET };

    const qb: any = {
      addSelect: jest.fn(() => qb),
      where: jest.fn(() => qb),
      andWhere: jest.fn(() => qb),
      update: jest.fn(() => qb),
      set: jest.fn(() => qb),
      getOne: jest.fn(async () => current),
      execute: jest.fn(async () => {
        if (attempts >= MAX_CODE_ATTEMPTS) return { affected: 0 };
        attempts++;
        return { affected: 1 };
      }),
    };
    userRepo = {
      createQueryBuilder: jest.fn(() => qb),
      update: jest.fn(async () => undefined),
      increment: jest.fn(async () => undefined),
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn(async (d: any) => ({ ...d, id: 99 })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: ConfigService,
          useValue: { get: (k: string) => config[k] },
        },
        { provide: TokenService, useValue: { sign: () => 'jwt' } },
        { provide: EmailService, useValue: { isConfigured: () => true } },
        {
          provide: UploadService,
          useValue: { processAvatarFromUrl: jest.fn(async () => null) },
        },
        { provide: UserService, useValue: {} },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('resetPassword', () => {
    it('accepts the correct code, bumps tokenVersion and clears the code', async () => {
      await service.resetPassword('a@example.com', '123456', 'newpassword1');
      expect(userRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          passwordResetToken: null,
          passwordResetAttempts: 0,
        }),
      );
      expect(userRepo.increment).toHaveBeenCalledWith(
        { id: 1 },
        'tokenVersion',
        1,
      );
    });

    it('does not accept a plain sha256 of the code (HMAC only)', async () => {
      const crypto = await import('crypto');
      current = makeUser({
        passwordResetToken: crypto
          .createHash('sha256')
          .update('123456')
          .digest('hex'),
      });
      await expect(
        service.resetPassword('a@example.com', '123456', 'newpassword1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it(`locks the code after ${MAX_CODE_ATTEMPTS} wrong attempts`, async () => {
      for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
        current = makeUser({ passwordResetAttempts: attempts });
        await expect(
          service.resetPassword('a@example.com', '000000', 'newpassword1'),
        ).rejects.toBeInstanceOf(BadRequestException);
      }
      // Even the correct code is now rejected
      current = makeUser({ passwordResetAttempts: attempts });
      await expect(
        service.resetPassword('a@example.com', '123456', 'newpassword1'),
      ).rejects.toThrow(/Too many failed attempts/);
      expect(userRepo.increment).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreateOAuthUser', () => {
    it('does not link to an existing local account whose email ownership is unproven', async () => {
      // No account with this provider id, but a password account with the same email
      const qbResults = [null, makeUser({ emailVerified: true })];
      userRepo.createQueryBuilder = jest.fn(() => {
        const qb: any = {
          addSelect: () => qb,
          where: () => qb,
          getOne: async () => qbResults.shift() ?? null,
        };
        return qb;
      });
      config.REQUIRE_EMAIL_VERIFICATION = 'false';

      const result = await service.findOrCreateOAuthUser('google', {
        providerId: 'g-1',
        email: 'a@example.com',
        firstName: 'A',
        lastName: 'B',
      });
      expect(result.error).toBe('oauth_account_exists');
      expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('creates new OAuth users without recorded consent', async () => {
      userRepo.createQueryBuilder = jest.fn(() => {
        const qb: any = {
          addSelect: () => qb,
          where: () => qb,
          getOne: async () => null,
        };
        return qb;
      });
      const result = await service.findOrCreateOAuthUser('github', {
        providerId: 'gh-1',
        email: 'new@example.com',
        firstName: 'N',
        lastName: 'U',
      });
      expect(result.error).toBeUndefined();
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          termsAcceptedAt: null,
          termsVersion: null,
          healthDataConsentAt: null,
        }),
      );
      if (!result.error) {
        expect(result.user.consentRequired).toBe(true);
        expect(result.user.healthDataConsent).toBe(false);
      }
    });

    it('refuses OAuth logins without a verified email', async () => {
      userRepo.createQueryBuilder = jest.fn(() => {
        const qb: any = {
          addSelect: () => qb,
          where: () => qb,
          getOne: async () => null,
        };
        return qb;
      });
      const result = await service.findOrCreateOAuthUser('github', {
        providerId: 'gh-2',
        email: undefined,
        firstName: 'N',
        lastName: 'U',
      });
      expect(result.error).toBe('oauth_email_unverified');
    });
  });
});
