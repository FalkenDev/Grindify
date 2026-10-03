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
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { GithubStrategy } from '../strategies/github.strategy';
import { GoogleStrategy } from '../strategies/google.strategy';
import { TokenModule } from './token.module';
import { UploadModule } from '../upload/upload.module';
import { isOAuthProviderConfigured } from '../guards/oauth.guard';

const githubStrategyProvider = {
  provide: GithubStrategy,
  useFactory: (configService: ConfigService, authService: AuthService) => {
    // skip if not configured
    if (!isOAuthProviderConfigured(configService, 'github')) return null;
    return new GithubStrategy(configService, authService);
  },
  inject: [ConfigService, AuthService],
};

const googleStrategyProvider = {
  provide: GoogleStrategy,
  useFactory: (configService: ConfigService, authService: AuthService) => {
    // skip if not configured
    if (!isOAuthProviderConfigured(configService, 'google')) return null;
    return new GoogleStrategy(configService, authService);
  },
  inject: [ConfigService, AuthService],
};

@Module({
  imports: [
    UserModule,
    EmailModule,
    UploadModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, githubStrategyProvider, googleStrategyProvider],
  exports: [TokenModule, AuthService],
})
export class AuthModule {}
