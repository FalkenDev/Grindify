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
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { ScheduledSessionService } from './scheduledSession.service';
import { CreateScheduledSessionDto } from './dto/createScheduledSession.dto';
import { UpdateScheduledSessionDto } from './dto/updateScheduledSession.dto';
import { DeleteScheduledSessionDto } from './dto/deleteScheduledSession.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { RequestWithUser } from '../types/requestWithUser.type';

@ApiTags('scheduled-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scheduled-sessions')
export class ScheduledSessionController {
  constructor(private readonly service: ScheduledSessionService) {}

  private getUserId(req: RequestWithUser): number {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return +req.user.id;
  }

  @Get()
  @ApiOperation({ summary: 'Get all scheduled sessions for the user' })
  getAll(@Req() req: RequestWithUser) {
    return this.service.findAllForUser(this.getUserId(req));
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Get scheduled sessions for a specific date' })
  getForDate(@Param('date') date: string, @Req() req: RequestWithUser) {
    return this.service.findForDate(this.getUserId(req), date);
  }

  @Get('range')
  @ApiOperation({ summary: 'Get scheduled sessions for a date range' })
  getForRange(
    @Query('start') start: string,
    @Query('end') end: string,
    @Req() req: RequestWithUser,
  ) {
    return this.service.findForDateRange(this.getUserId(req), start, end);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific scheduled session' })
  getOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.service.findOne(this.getUserId(req), id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a scheduled session' })
  @ApiCreatedResponse()
  create(@Req() req: RequestWithUser, @Body() dto: CreateScheduledSessionDto) {
    return this.service.create(this.getUserId(req), dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a scheduled session' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduledSessionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.update(this.getUserId(req), id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a scheduled session' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeleteScheduledSessionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.deleteScheduledSession(
      this.getUserId(req),
      id,
      dto.deleteType,
      dto.occurrenceDate,
    );
  }
}
