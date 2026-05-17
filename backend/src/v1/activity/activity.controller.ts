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
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
  ParseIntPipe,
} from '@nestjs/common';
import { ActivityService, ActivityFilter } from './activity.service';
import { CreateActivityDto } from './dto/createActivity.dto';
import { UpdateActivityDto } from './dto/updateActivity.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { ActivityResponseDto } from './dto/activityResponse.dto';
import { RequestWithUser } from '../types/requestWithUser.type';

@ApiTags('activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Get activities (filter: all | global | mine)' })
  @ApiOkResponse({ type: [ActivityResponseDto] })
  getAllActivities(
    @Req() req: RequestWithUser,
    @Query('filter') filter?: ActivityFilter,
  ): Promise<ActivityResponseDto[]> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.activityService.findAll(+req.user.id, filter ?? 'all');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific activity by ID' })
  @ApiOkResponse({ type: ActivityResponseDto })
  getActivity(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<ActivityResponseDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.activityService.findOne(id, +req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiCreatedResponse({ type: ActivityResponseDto })
  createActivity(
    @Body() body: CreateActivityDto,
    @Req() req: RequestWithUser,
  ): Promise<ActivityResponseDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.activityService.create(body, +req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an activity' })
  @ApiOkResponse({ type: ActivityResponseDto })
  updateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateActivityDto,
    @Req() req: RequestWithUser,
  ): Promise<ActivityResponseDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.activityService.update(id, body, +req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiOkResponse({ description: 'Activity deleted successfully' })
  deleteActivity(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.activityService.delete(id, +req.user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a global activity for personal use' })
  @ApiCreatedResponse({ type: ActivityResponseDto })
  duplicateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { transferStats?: boolean },
    @Req() req: RequestWithUser,
  ): Promise<ActivityResponseDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.activityService.duplicateGlobalActivity(id, +req.user.id, body.transferStats ?? false);
  }
}
