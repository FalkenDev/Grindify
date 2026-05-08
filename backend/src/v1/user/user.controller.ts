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

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
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
  updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateUserDto) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.userService.updateUser(+req.user.id, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete user and related data (exercises, etc)' })
  @ApiOkResponse({
    description: 'Success message after deleting the user and their data',
    schema: {
      example: { message: 'User and all related data deleted' },
    },
  })
  deleteProfile(@Req() req: RequestWithUser) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.userService.deleteUser(+req.user.id);
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
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  async uploadAvatar(
    @UploadedFile() file: any,
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
  useStreakFreeze(@Req() req: RequestWithUser, @Body() body: UseStreakFreezeDto) {
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
    @Body() body: { weeklyWorkoutGoal: number },
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
      'JSON file containing all personal data for the authenticated user',
  })
  async exportData(
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ): Promise<void> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const data = await this.userService.exportUserData(+req.user.id);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="grindify-data-export.json"',
    );
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
  }
}
