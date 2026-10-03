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
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { RequestWithUser } from '../types/requestWithUser.type';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOkResponse,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserWithoutPasswordDto } from '../auth/dto/UserWithoutPassword.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UpdateUserPreferencesDto } from './dto/UpdateUserPreferences.dto';
import { UseStreakFreezeDto } from './dto/UseStreakFreeze.dto';
import { UploadService } from '../upload/upload.service';
import { IMAGE_UPLOAD_OPTIONS } from '../upload/upload.constants';
import { UpdateWeeklyGoalDto } from './dto/UpdateWeeklyGoal.dto';
import { GiveConsentDto } from './dto/GiveConsent.dto';
import { AuditService } from '../audit/audit.service';
import { TokenService } from '../auth/token.service';
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  clearAuthCookieOptions,
} from '../common/cookie.util';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
    private readonly auditService: AuditService,
    private readonly tokenService: TokenService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ type: UserWithoutPasswordDto })
  getProfile(@Req() req: RequestWithUser) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.userService.findOneById(+req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiOkResponse({ type: UserWithoutPasswordDto })
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserWithoutPasswordDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const result = await this.userService.updateUser(+req.user.id, dto);

    if (result.passwordChanged) {
      // All other sessions were revoked; keep this one alive with a fresh token
      const subject = await this.userService.getTokenSubject(+req.user.id);
      res.cookie(
        AUTH_COOKIE_NAME,
        this.tokenService.sign(subject),
        authCookieOptions(req),
      );
      await this.auditService.log({
        action: 'user.password_changed',
        actor: result.user,
        targetType: 'user',
        targetId: result.user.id,
        req,
      });
    }
    if (result.emailChanged) {
      await this.auditService.log({
        action: 'user.email_changed',
        actor: result.user,
        targetType: 'user',
        targetId: result.user.id,
        metadata: { previousEmail: result.previousEmail },
        req,
      });
    }
    return result.user;
  }

  @Delete()
  @ApiOperation({ summary: 'Delete user and related data (exercises, etc)' })
  @ApiOkResponse({
    description: 'Success message after deleting the user and their data',
    schema: {
      example: { message: 'User and all related data deleted' },
    },
  })
  async deleteProfile(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const result = await this.userService.deleteUser(+req.user.id);
    res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions(req));
    await this.auditService.log({
      action: 'user.deleted',
      actor: { id: req.user.id, email: req.user.email },
      targetType: 'user',
      targetId: req.user.id,
      req,
    });
    return result;
  }

  @Post('consent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Accept the current terms and give health data consent (GDPR art. 9)',
  })
  @ApiOkResponse({ type: UserWithoutPasswordDto })
  async giveConsent(
    @Req() req: RequestWithUser,
    @Body() dto: GiveConsentDto,
  ): Promise<UserWithoutPasswordDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const user = await this.userService.giveConsent(
      +req.user.id,
      dto.healthDataConsent,
    );
    await this.auditService.log({
      action: 'user.consent_given',
      actor: user,
      targetType: 'user',
      targetId: user.id,
      metadata: {
        termsVersion: user.termsVersion,
        healthDataConsent: dto.healthDataConsent === true,
      },
      req,
    });
    return user;
  }

  @Post('consent/health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Give (voluntary) consent to processing of health data',
  })
  @ApiOkResponse({ type: UserWithoutPasswordDto })
  async giveHealthConsent(
    @Req() req: RequestWithUser,
  ): Promise<UserWithoutPasswordDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const user = await this.userService.giveHealthConsent(+req.user.id);
    await this.auditService.log({
      action: 'user.health_consent_given',
      actor: user,
      targetType: 'user',
      targetId: user.id,
      req,
    });
    return user;
  }

  @Delete('consent/health')
  @ApiOperation({
    summary:
      'Withdraw health data consent — deletes weight logs, progress photos and body metrics',
  })
  @ApiOkResponse({ type: UserWithoutPasswordDto })
  async withdrawHealthConsent(
    @Req() req: RequestWithUser,
  ): Promise<UserWithoutPasswordDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const user = await this.userService.withdrawHealthConsent(+req.user.id);
    await this.auditService.log({
      action: 'user.health_consent_withdrawn',
      actor: user,
      targetType: 'user',
      targetId: user.id,
      req,
    });
    return user;
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload avatar for the authenticated user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({ type: UserWithoutPasswordDto })
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ): Promise<UserWithoutPasswordDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const validation = this.uploadService.validateImageFile(file);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const avatarUrl = await this.uploadService.processAvatarImage(file);

    return this.userService.updateAvatar(+req.user.id, avatarUrl);
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get user streak information' })
  @ApiOkResponse({
    description: 'User streak information',
    schema: {
      example: {
        currentStreak: 5,
        weeklyWorkoutGoal: 3,
        currentWeekWorkouts: 2,
        progressPercentage: 67,
      },
    },
  })
  getStreak(@Req() req: RequestWithUser) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.userService.getStreakInfo(+req.user.id);
  }

  @Post('streak/freeze')
  @ApiOperation({ summary: 'Use a streak freeze to protect the current week' })
  @ApiOkResponse({
    description: 'Updated streak info after consuming the freeze',
  })
  useStreakFreeze(
    @Req() req: RequestWithUser,
    @Body() body: UseStreakFreezeDto,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.userService.useStreakFreeze(+req.user.id, body.date);
  }

  @Put('weekly-goal')
  @ApiOperation({ summary: 'Update weekly workout goal' })
  @ApiOkResponse({ type: UserWithoutPasswordDto })
  updateWeeklyGoal(
    @Req() req: RequestWithUser,
    @Body() body: UpdateWeeklyGoalDto,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.userService.updateWeeklyWorkoutGoal(
      +req.user.id,
      body.weeklyWorkoutGoal,
    );
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences and onboarding data' })
  @ApiOkResponse({ type: UserWithoutPasswordDto })
  updatePreferences(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.userService.updateUserPreferences(+req.user.id, dto);
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export all user data (GDPR Art. 20 data portability)',
  })
  @ApiOkResponse({
    description:
      'ZIP archive with data.json and all uploaded files of the authenticated user',
  })
  async exportData(
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ): Promise<void> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const zip = await this.userService.exportUserDataZip(+req.user.id);
    await this.auditService.log({
      action: 'user.export',
      actor: { id: req.user.id, email: req.user.email },
      targetType: 'user',
      targetId: req.user.id,
      req,
    });
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="grindify-export.zip"',
    );
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', zip.length.toString());
    res.send(zip);
  }
}
