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
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { RequestWithUser } from '../types/requestWithUser.type';
import {
  ExerciseProgressQueryDto,
  PaginationQueryDto,
  WeeksQueryDto,
} from './dto/statistics-query.dto';

@ApiTags('statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  private getUserId(req: RequestWithUser): number {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return +req.user.id;
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get overview statistics for the user' })
  getOverview(@Req() req: RequestWithUser) {
    return this.statisticsService.getOverview(this.getUserId(req));
  }

  @Get('exercises/:exerciseId/history')
  @ApiOperation({ summary: 'Get exercise performance history' })
  getExerciseHistory(
    @Req() req: RequestWithUser,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.statisticsService.getExerciseHistory(
      this.getUserId(req),
      exerciseId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('exercises/:exerciseId/records')
  @ApiOperation({ summary: 'Get personal records for an exercise' })
  getExerciseRecords(
    @Req() req: RequestWithUser,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
  ) {
    return this.statisticsService.getExerciseRecords(
      this.getUserId(req),
      exerciseId,
    );
  }

  @Get('exercises/:exerciseId/progress')
  @ApiOperation({ summary: 'Get exercise progress chart data' })
  getExerciseProgress(
    @Req() req: RequestWithUser,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
    @Query() query: ExerciseProgressQueryDto,
  ) {
    return this.statisticsService.getExerciseProgress(
      this.getUserId(req),
      exerciseId,
      query.metric ?? 'estimated_1rm',
      query.period ?? 'all',
    );
  }

  @Get('exercises/:exerciseId/quick')
  @ApiOperation({ summary: 'Get quick stats for exercise dialog' })
  getExerciseQuickStats(
    @Req() req: RequestWithUser,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
  ) {
    return this.statisticsService.getExerciseQuickStats(
      this.getUserId(req),
      exerciseId,
    );
  }

  @Get('workouts/:workoutId/history')
  @ApiOperation({ summary: 'Get workout session history' })
  getWorkoutHistory(
    @Req() req: RequestWithUser,
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.statisticsService.getWorkoutHistory(
      this.getUserId(req),
      workoutId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('workouts/:workoutId/quick')
  @ApiOperation({ summary: 'Get quick stats for workout details page' })
  getWorkoutQuickStats(
    @Req() req: RequestWithUser,
    @Param('workoutId', ParseIntPipe) workoutId: number,
  ) {
    return this.statisticsService.getWorkoutQuickStats(
      this.getUserId(req),
      workoutId,
    );
  }

  @Get('weekly-trends')
  @ApiOperation({
    summary: 'Get weekly volume/workout trends for the last N weeks',
  })
  getWeeklyTrends(@Req() req: RequestWithUser, @Query() query: WeeksQueryDto) {
    return this.statisticsService.getWeeklyTrends(
      this.getUserId(req),
      query.weeks ?? 12,
    );
  }

  @Get('comparison')
  @ApiOperation({
    summary:
      'Get this week vs last week and this month vs last month comparison',
  })
  getComparison(@Req() req: RequestWithUser) {
    return this.statisticsService.getComparison(this.getUserId(req));
  }

  @Get('activity-heatmap')
  @ApiOperation({
    summary: 'Get daily activity counts for heatmap visualization',
  })
  getActivityHeatmap(
    @Req() req: RequestWithUser,
    @Query() query: WeeksQueryDto,
  ) {
    return this.statisticsService.getActivityHeatmap(
      this.getUserId(req),
      query.weeks ?? 12,
    );
  }
}
