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

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { GithubStrategy } from '../strategies/github.strategy';
import { GoogleStrategy } from '../strategies/google.strategy';

const githubStrategyProvider = {
  provide: GithubStrategy,
  useFactory: (configService: ConfigService, authService: AuthService) => {
    const clientId = configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
    if (!clientId || !clientSecret) return null; // skip if not configured
    return new GithubStrategy(configService, authService);
  },
  inject: [ConfigService, AuthService],
};

const googleStrategyProvider = {
  provide: GoogleStrategy,
  useFactory: (configService: ConfigService, authService: AuthService) => {
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) return null; // skip if not configured
    return new GoogleStrategy(configService, authService);
  },
  inject: [ConfigService, AuthService],
};

@Module({
  imports: [
    UserModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error(
            'JWT_SECRET is not defined in the environment variables',
          );
        }
        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '48h' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, githubStrategyProvider, googleStrategyProvider],
  exports: [JwtModule],
})
export class AuthModule {}
