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
  Patch,
  Query,
  UseGuards,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { WorkoutSessionService } from './workoutSession.service';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { RequestWithUser } from '../types/requestWithUser.type';
import { CreateWorkoutSessionDto } from './dto/createWorkoutSession.dto';
import { AddExerciseToSessionDto } from './dto/addExerciseToSession.dto';
import { LogPastWorkoutSessionDto } from './dto/logPastWorkoutSession.dto';
import { WorkoutSession } from './workoutSession.entity';
import { UpdateWorkoutSessionDto } from './dto/updateWorkoutSession.dto';
import { UpdateSessionExerciseSetsDto } from './dto/updateSessionExerciseSets.dto';
import { CompleteSessionDto } from './dto/completeSession.dto';
import { CreateEmptySessionDto } from './dto/createEmptySession.dto';

@ApiTags('workout-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workoutSessions')
export class WorkoutSessionController {
  constructor(private readonly sessionService: WorkoutSessionService) {}

  private getUserId(req: RequestWithUser): number {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return +req.user.id;
  }

  @Get()
  @ApiOperation({ summary: 'Get all workout sessions for the user' })
  @ApiOkResponse({ type: [WorkoutSession] })
  getAll(@Req() req: RequestWithUser): Promise<WorkoutSession[]> {
    return this.sessionService.getAllSessions(this.getUserId(req));
  }

  @Post()
  @ApiOperation({ summary: 'Create a workout session' })
  @ApiCreatedResponse({ type: WorkoutSession })
  create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateWorkoutSessionDto,
  ): Promise<WorkoutSession> {
    return this.sessionService.createSession(
      dto.workoutId,
      this.getUserId(req),
      dto.scheduledSessionId,
    );
  }

  @Post('empty')
  @ApiOperation({ summary: 'Create an empty workout session' })
  @ApiCreatedResponse({ type: WorkoutSession })
  createEmpty(
    @Req() req: RequestWithUser,
    @Body() body: CreateEmptySessionDto,
  ): Promise<WorkoutSession> {
    return this.sessionService.createEmptySession(
      this.getUserId(req),
      body?.scheduledSessionId,
    );
  }

  @Post('log-past')
  @ApiOperation({ summary: 'Log a past workout session' })
  @ApiCreatedResponse({ type: WorkoutSession })
  logPast(
    @Req() req: RequestWithUser,
    @Body() dto: LogPastWorkoutSessionDto,
  ): Promise<WorkoutSession> {
    return this.sessionService.logPastSession(this.getUserId(req), dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one workout session by ID' })
  @ApiOkResponse({ type: WorkoutSession })
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<WorkoutSession> {
    return this.sessionService.getOneSession(id, this.getUserId(req));
  }

  @Get(':id/previous-sets')
  @ApiOperation({ summary: 'Get previous sets for each exercise in a session' })
  @ApiOkResponse({ description: 'Previous sets per exercise' })
  getPreviousSets(
    @Param('id', ParseIntPipe) id: number,
    @Query('exerciseIds') exerciseIds: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    const parsedExerciseIds = exerciseIds
      ?.split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);

    return this.sessionService.getPreviousSets(
      this.getUserId(req),
      id,
      parsedExerciseIds,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workout session' })
  @ApiOkResponse({ type: WorkoutSession })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkoutSessionDto,
    @Req() req: RequestWithUser,
  ): Promise<WorkoutSession> {
    return this.sessionService.updateSession(id, this.getUserId(req), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workout session' })
  @ApiOkResponse({
    schema: { example: { message: 'Workout session deleted' } },
  })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    return this.sessionService.deleteSession(id, this.getUserId(req));
  }

  @Patch(':id/exercises')
  @ApiOperation({ summary: 'Add exercise to workout session' })
  @ApiOkResponse({ type: WorkoutSession })
  addExercise(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddExerciseToSessionDto,
    @Req() req: RequestWithUser,
  ): Promise<WorkoutSession> {
    return this.sessionService.addExerciseToSession(
      id,
      dto.exerciseId,
      this.getUserId(req),
      dto.sets,
    );
  }

  @Patch(':id/exercises/:exerciseId/sets')
  @ApiOperation({
    summary: 'Update sets for an exercise in a finished session',
  })
  @ApiOkResponse({ type: WorkoutSession })
  updateExerciseSets(
    @Param('id', ParseIntPipe) id: number,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
    @Body() dto: UpdateSessionExerciseSetsDto,
    @Req() req: RequestWithUser,
  ): Promise<WorkoutSession> {
    return this.sessionService.updateSessionExerciseSets(
      id,
      exerciseId,
      this.getUserId(req),
      dto.sets,
    );
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark session as completed and calculate stats' })
  @ApiOkResponse({ type: WorkoutSession })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Body() payload: CompleteSessionDto,
  ): Promise<WorkoutSession> {
    return this.sessionService.completeSession(
      id,
      this.getUserId(req),
      payload,
    );
  }

  @Post(':id/abandon')
  @ApiOperation({ summary: 'Mark session as abandoned' })
  @ApiOkResponse({ type: WorkoutSession })
  abandon(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<WorkoutSession> {
    return this.sessionService.abandonSession(id, this.getUserId(req));
  }
}
