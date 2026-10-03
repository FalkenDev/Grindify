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
  Param,
  Body,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MuscleGroupService } from './muscleGroup.service';
import { CreateMuscleGroupDto } from './dto/createMuscleGroup.dto';
import { UpdateMuscleGroupDto } from './dto/updateMuscleGroup.dto';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { SuperAdminGuard } from '../guards/superAdmin.guard';
import { AuditService } from '../audit/audit.service';
import { RequestWithUser } from '../types/requestWithUser.type';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { MuscleGroupResponseDto } from './dto/muscleGroupResponse.dto';

@ApiTags('musclegroups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('muscleGroups')
export class MuscleGroupController {
  constructor(
    private readonly muscleGroupService: MuscleGroupService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all muscle groups' })
  @ApiOkResponse({ type: [MuscleGroupResponseDto] })
  getAll() {
    return this.muscleGroupService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one muscle group by ID' })
  @ApiOkResponse({ type: MuscleGroupResponseDto })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.muscleGroupService.findOne(id);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create a new muscle group (superadmin)' })
  @ApiOkResponse({ type: MuscleGroupResponseDto })
  async create(@Body() dto: CreateMuscleGroupDto, @Req() req: RequestWithUser) {
    const created = await this.muscleGroupService.create(dto);
    await this.auditService.log({
      action: 'admin.muscle_group_created',
      actor: req.user,
      targetType: 'muscle_group',
      targetId: created?.id,
      req,
    });
    return created;
  }

  @Put(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Update a muscle group (superadmin)' })
  @ApiOkResponse({ type: MuscleGroupResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMuscleGroupDto,
    @Req() req: RequestWithUser,
  ) {
    const updated = await this.muscleGroupService.update(id, dto);
    await this.auditService.log({
      action: 'admin.muscle_group_updated',
      actor: req.user,
      targetType: 'muscle_group',
      targetId: id,
      req,
    });
    return updated;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a muscle group' })
  @ApiOkResponse({
    schema: { example: { message: 'Muscle group deleted' } },
  })
  @UseGuards(SuperAdminGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const result = await this.muscleGroupService.remove(id);
    await this.auditService.log({
      action: 'admin.muscle_group_deleted',
      actor: req.user,
      targetType: 'muscle_group',
      targetId: id,
      req,
    });
    return result;
  }
}
