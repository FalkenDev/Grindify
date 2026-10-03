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
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
  ParseIntPipe,
} from '@nestjs/common';
import { WeightLogService } from './weightLog.service';
import { CreateWeightLogDto } from './dto/createWeightLog.dto';
import { UpdateWeightLogDto } from './dto/updateWeightLog.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ConsentGuard } from '../guards/consent.guard';
import { HealthConsentGuard } from '../guards/healthConsent.guard';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import {
  WeightLogResponseDto,
  WeightLogStatsDto,
} from './dto/weightLogResponse.dto';
import { RequestWithUser } from '../types/requestWithUser.type';

@ApiTags('weight-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ConsentGuard, HealthConsentGuard)
@Controller('weight-logs')
export class WeightLogController {
  constructor(private readonly weightLogService: WeightLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get all weight logs for the authenticated user' })
  @ApiOkResponse({ type: [WeightLogResponseDto] })
  getAllWeightLogs(
    @Req() req: RequestWithUser,
  ): Promise<WeightLogResponseDto[]> {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return this.weightLogService.findAll(+req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get weight tracking statistics' })
  @ApiOkResponse({ type: WeightLogStatsDto })
  getStats(@Req() req: RequestWithUser): Promise<WeightLogStatsDto> {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return this.weightLogService.getStats(+req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new weight log entry' })
  @ApiCreatedResponse({ type: WeightLogResponseDto })
  createWeightLog(
    @Body() body: CreateWeightLogDto,
    @Req() req: RequestWithUser,
  ): Promise<WeightLogResponseDto> {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return this.weightLogService.create(body, +req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a weight log entry' })
  @ApiOkResponse({ type: WeightLogResponseDto })
  updateWeightLog(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWeightLogDto,
    @Req() req: RequestWithUser,
  ): Promise<WeightLogResponseDto> {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return this.weightLogService.update(id, +req.user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a weight log entry' })
  deleteWeightLog(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return this.weightLogService.delete(id, +req.user.id);
  }
}
