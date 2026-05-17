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
  Query,
  Req,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ConflictException,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { SuperAdminGuard } from '../guards/superAdmin.guard';
import { ExerciseService } from '../exercise/exercise.service';
import { ExerciseResponseDto } from '../exercise/dto/exerciseResponse.dto';
import {
  CreateGlobalExerciseDto,
  UpdateGlobalExerciseDto,
} from '../exercise/dto/createGlobalExercise.dto';
import { ActivityService } from '../activity/activity.service';
import { ActivityResponseDto } from '../activity/dto/activityResponse.dto';
import {
  CreateGlobalActivityDto,
  UpdateGlobalActivityDto,
} from '../activity/dto/createGlobalActivity.dto';
import { MuscleGroupService } from '../muscleGroup/muscleGroup.service';
import { MuscleGroup } from '../muscleGroup/muscleGroup.entity';
import { UpdateMuscleGroupAdminDto } from '../muscleGroup/dto/updateMuscleGroupAdmin.dto';
import { CreateMuscleGroupAdminDto } from '../muscleGroup/dto/createMuscleGroupAdmin.dto';
import { ExerciseImage } from '../exercise/exerciseImage.entity';
import { ExerciseImageResponseDto } from '../exercise/dto/exerciseImageResponse.dto';
import { UploadService } from '../upload/upload.service';

interface RequestWithUser extends Request {
  user: { id: number; email: string; role: string };
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly exerciseService: ExerciseService,
    private readonly activityService: ActivityService,
    private readonly muscleGroupService: MuscleGroupService,
    private readonly uploadService: UploadService,
    @InjectRepository(ExerciseImage)
    private readonly exerciseImageRepo: Repository<ExerciseImage>,
  ) {}

  // --- Admin meta ---

  @Get('me')
  @ApiOperation({ summary: 'Get current superadmin profile' })
  getMe(@Req() req: RequestWithUser) {
    return this.adminService.getMe(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate instance statistics' })
  getStats() {
    return this.adminService.getStats();
  }

  // --- Users ---

  @Get('users')
  @ApiOperation({ summary: 'List all users with pagination and search' })
  listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(
      parseInt(page ?? '1', 10),
      parseInt(limit ?? '20', 10),
      search,
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  // --- Global Exercises ---

  @Get('exercises')
  @ApiOperation({ summary: 'List all global exercises' })
  @ApiOkResponse({ type: [ExerciseResponseDto] })
  listGlobalExercises(): Promise<ExerciseResponseDto[]> {
    return this.exerciseService.findAll(0, 'global');
  }

  @Post('exercises')
  @ApiOperation({ summary: 'Create a global exercise' })
  @ApiCreatedResponse({ type: ExerciseResponseDto })
  createGlobalExercise(
    @Body() dto: CreateGlobalExerciseDto,
  ): Promise<ExerciseResponseDto> {
    return this.exerciseService.createGlobal(dto);
  }

  @Put('exercises/:id')
  @ApiOperation({ summary: 'Update a global exercise' })
  @ApiOkResponse({ type: ExerciseResponseDto })
  updateGlobalExercise(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGlobalExerciseDto,
  ): Promise<ExerciseResponseDto> {
    return this.exerciseService.updateGlobal(id, dto);
  }

  @Delete('exercises/:id')
  @ApiOperation({ summary: 'Soft-delete a global exercise (user data preserved)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteGlobalExercise(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.exerciseService.deleteGlobal(id);
  }

  // --- Global Exercise Media ---

  @Post('exercises/:id/media')
  @ApiOperation({ summary: 'Upload instructional media (image or video) to a global exercise' })
  @ApiCreatedResponse({ type: ExerciseResponseDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  async addGlobalExerciseMedia(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExerciseResponseDto> {
    const validation = this.uploadService.validateMediaFile(file);
    if (!validation.valid) throw new BadRequestException(validation.error);

    const { url, type } = await this.uploadService.processExerciseMedia(file);
    return this.exerciseService.addGlobalMedia(id, url, type);
  }

  @Delete('exercises/:id/media/:mediaId')
  @ApiOperation({ summary: 'Delete a media item from a global exercise' })
  @HttpCode(HttpStatus.OK)
  deleteGlobalExerciseMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ): Promise<ExerciseResponseDto> {
    return this.exerciseService.removeGlobalMedia(id, mediaId);
  }

  @Put('exercises/:id/media/reorder')
  @ApiOperation({ summary: 'Reorder media items for a global exercise' })
  reorderGlobalExerciseMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { mediaIds: number[] },
  ): Promise<ExerciseResponseDto> {
    return this.exerciseService.reorderGlobalMedia(id, body.mediaIds);
  }

  // --- Exercise Image Library ---

  @Get('exercise-images')
  @ApiOperation({ summary: 'List all images in the exercise image library' })
  async listExerciseImages() {
    const rows: {
      id: number;
      url: string;
      fileSize: number | null;
      createdAt: Date;
      exercise_id: number | null;
      exercise_title: Record<string, string> | null;
    }[] = await this.exerciseImageRepo.manager.query(`
      SELECT
        ei.id,
        ei.url,
        ei."fileSize",
        ei."createdAt",
        e.id        AS exercise_id,
        e.title     AS exercise_title
      FROM exercise_image ei
      LEFT JOIN exercise e
        ON e.image = ei.url AND e."deletedAt" IS NULL
      ORDER BY ei."createdAt" DESC
    `);

    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      fileSize: r.fileSize,
      createdAt: r.createdAt,
      usedBy: r.exercise_id
        ? { id: r.exercise_id, title: r.exercise_title }
        : null,
    }));
  }

  @Post('exercise-images')
  @ApiOperation({ summary: 'Upload an image to the exercise image library' })
  @ApiCreatedResponse({ type: ExerciseImageResponseDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  async uploadExerciseImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExerciseImageResponseDto> {
    const validation = this.uploadService.validateImageFile(file);
    if (!validation.valid) throw new BadRequestException(validation.error);

    const { url, fileSize } = await this.uploadService.processExerciseImage(file);
    const record = this.exerciseImageRepo.create({ url, fileSize });
    return this.exerciseImageRepo.save(record);
  }

  @Delete('exercise-images/:id')
  @ApiOperation({ summary: 'Delete an image from the exercise image library' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExerciseImage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const image = await this.exerciseImageRepo.findOne({ where: { id } });
    if (!image) return;

    // Block deletion if the image URL is still referenced by any exercise
    const result: { count: string }[] = await this.exerciseImageRepo.manager.query(
      `SELECT COUNT(*) AS count FROM exercise WHERE image = $1 AND "deletedAt" IS NULL`,
      [image.url],
    );
    const inUse = parseInt(result[0]?.count ?? '0', 10);

    if (inUse > 0) {
      throw new ConflictException(
        'Image is currently assigned to one or more exercises. Remove it from those exercises first.',
      );
    }

    await this.uploadService.deleteImage(image.url);
    await this.exerciseImageRepo.remove(image);
  }

  // --- Global Activities ---

  @Get('activities')
  @ApiOperation({ summary: 'List all global activities' })
  @ApiOkResponse({ type: [ActivityResponseDto] })
  listGlobalActivities(): Promise<ActivityResponseDto[]> {
    return this.activityService.findAll(0, 'global');
  }

  @Post('activities')
  @ApiOperation({ summary: 'Create a global activity' })
  @ApiCreatedResponse({ type: ActivityResponseDto })
  createGlobalActivity(
    @Body() dto: CreateGlobalActivityDto,
  ): Promise<ActivityResponseDto> {
    return this.activityService.createGlobal(dto);
  }

  @Put('activities/:id')
  @ApiOperation({ summary: 'Update a global activity' })
  @ApiOkResponse({ type: ActivityResponseDto })
  updateGlobalActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGlobalActivityDto,
  ): Promise<ActivityResponseDto> {
    return this.activityService.updateGlobal(id, dto);
  }

  @Delete('activities/:id')
  @ApiOperation({ summary: 'Soft-delete a global activity (user data preserved)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteGlobalActivity(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.activityService.deleteGlobal(id);
  }

  // --- Muscle Groups ---

  @Get('muscle-groups')
  @ApiOperation({ summary: 'List all muscle groups' })
  listMuscleGroups(): Promise<MuscleGroup[]> {
    return this.muscleGroupService.findAll();
  }

  @Post('muscle-groups')
  @ApiOperation({ summary: 'Create a new muscle group' })
  @ApiCreatedResponse({ type: MuscleGroup })
  createMuscleGroup(
    @Body() dto: CreateMuscleGroupAdminDto,
  ): Promise<MuscleGroup> {
    return this.muscleGroupService.create({
      name: dto.name,
      nameI18n: dto.nameI18n ?? { default: dto.name },
      descriptionI18n: dto.descriptionI18n,
    } as any);
  }

  @Put('muscle-groups/:id')
  @ApiOperation({ summary: 'Update muscle group translations' })
  updateMuscleGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMuscleGroupAdminDto,
  ): Promise<MuscleGroup> {
    return this.muscleGroupService.update(id, dto as any);
  }

  @Get('muscle-groups/:id/exercises')
  @ApiOperation({ summary: 'List exercises that reference a muscle group (for delete warnings)' })
  async getMuscleGroupExercises(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ id: number; title: any }[]> {
    await this.muscleGroupService.findOne(id);
    const exercises = await this.exerciseService.findAll(0, 'global');
    return exercises
      .filter(
        (ex) =>
          ex.muscleGroups.some((mg) => mg.id === id) ||
          ex.primaryMuscleGroups?.some((mg) => mg.id === id),
      )
      .map((ex) => ({ id: ex.id, title: ex.title }));
  }

  @Delete('muscle-groups/:id')
  @ApiOperation({ summary: 'Delete a muscle group (removes association from all exercises)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMuscleGroup(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.muscleGroupService.remove(id);
  }

  // --- Export ---

  @Get('export/exercises')
  @ApiOperation({ summary: 'Export all global exercises as a ZIP archive (one folder per exercise)' })
  @Header('Content-Type', 'application/zip')
  async exportExercises(): Promise<StreamableFile> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const JSZip = require('jszip');
    const zip = new JSZip();

    const exercises = await this.exerciseService.findAll(0, 'global');

    const sanitizeFolderName = (title: string): string =>
      (title ?? '').replace(/[/\\:*?"<>|]/g, '-').trim().slice(0, 80) || 'exercise';

    const usedNames = new Map<string, number>();

    for (const ex of exercises) {
      const base = sanitizeFolderName(ex.title?.default ?? `exercise-${ex.id}`);
      const count = usedNames.get(base) ?? 0;
      usedNames.set(base, count + 1);
      const folderName = count === 0 ? base : `${base}-${count + 1}`;

      const mediaEntries: { order: number; type: string; file: string }[] = [];

      // Cover image
      let coverImagePath: string | null = null;
      if (ex.image) {
        const buffer = await this.uploadService.readFileAsBuffer(ex.image);
        if (buffer) {
          const ext = ex.image.split('.').pop() ?? 'webp';
          zip.file(`${folderName}/images/cover.${ext}`, buffer);
          coverImagePath = `images/cover.${ext}`;
        }
      }

      // Media items
      const sortedMedia = [...(ex.media ?? [])].sort((a, b) => a.order - b.order);
      for (const mediaItem of sortedMedia) {
        const buffer = await this.uploadService.readFileAsBuffer(mediaItem.url);
        if (buffer) {
          const ext = mediaItem.url.split('.').pop() ?? 'webp';
          zip.file(`${folderName}/images/media-${mediaItem.order}.${ext}`, buffer);
          mediaEntries.push({
            order: mediaItem.order,
            type: mediaItem.type,
            file: `images/media-${mediaItem.order}.${ext}`,
          });
        }
      }

      zip.file(
        `${folderName}/exercise.json`,
        JSON.stringify(
          {
            title: ex.title,
            description: ex.description ?? null,
            exerciseType: ex.exerciseType ?? null,
            muscleGroupNames: ex.muscleGroups.map((mg) => mg.name),
            primaryMuscleGroupNames: ex.primaryMuscleGroups?.map((mg) => mg.name) ?? [],
            equipmentI18n: ex.equipmentI18n ?? null,
            instructionsI18n: ex.instructions ?? null,
            proTipsI18n: ex.proTips ?? null,
            mistakesI18n: ex.mistakes ?? null,
            coverImage: coverImagePath,
            media: mediaEntries,
          },
          null,
          2,
        ),
      );
    }

    const zipBuffer: Buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const filename = `exercises-export-${new Date().toISOString().slice(0, 10)}.zip`;

    return new StreamableFile(zipBuffer, {
      type: 'application/zip',
      disposition: `attachment; filename="${filename}"`,
      length: zipBuffer.length,
    });
  }

  @Get('export/activities')
  @ApiOperation({ summary: 'Export all global activities as JSON' })
  @Header('Content-Type', 'application/json')
  async exportActivities(): Promise<StreamableFile> {
    const activities = await this.activityService.findAll(0, 'global');

    const payload = {
      version: 1,
      type: 'activities',
      exportedAt: new Date().toISOString(),
      count: activities.length,
      activities: activities.map((act) => ({
        title: act.title,
        description: act.description ?? null,
        icon: act.icon,
        equipment: act.equipment ?? [],
        trackDistance: act.trackDistance,
        trackPace: act.trackPace,
        trackElevation: act.trackElevation,
        trackCalories: act.trackCalories,
      })),
    };

    const jsonBuffer = Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
    const filename = `activities-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new StreamableFile(jsonBuffer, {
      type: 'application/json',
      disposition: `attachment; filename="${filename}"`,
      length: jsonBuffer.length,
    });
  }

  // --- Import ---

  @Post('import/exercises')
  @ApiOperation({ summary: 'Import global exercises from a ZIP export archive' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  async importExercises(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    if (!file) throw new BadRequestException('No file provided');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const JSZip = require('jszip');
    let zip: any;
    try {
      zip = await JSZip.loadAsync(file.buffer);
    } catch {
      throw new BadRequestException('Invalid ZIP file');
    }

    // Find all exercise.json entries (not directories)
    const exerciseJsonPaths: string[] = Object.keys(zip.files).filter(
      (p: string) => p.endsWith('/exercise.json') && !zip.files[p].dir,
    );

    if (exerciseJsonPaths.length === 0) {
      throw new BadRequestException('No exercise.json files found in ZIP — is this a valid exercises export?');
    }

    const allMuscleGroups = await this.muscleGroupService.findAll();
    const mgByName = new Map(
      allMuscleGroups.map((mg) => [mg.name.toLowerCase(), mg.id]),
    );

    const existingExercises = await this.exerciseService.findAll(0, 'global');
    const existingTitles = new Set(
      existingExercises.map((e) => (e.title?.default ?? '').toLowerCase()),
    );

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const jsonPath of exerciseJsonPaths) {
      const folderPrefix = jsonPath.slice(0, jsonPath.lastIndexOf('/') + 1); // e.g. "Bench Press/"
      let item: any;
      try {
        const jsonContent = await zip.files[jsonPath].async('string');
        item = JSON.parse(jsonContent);
      } catch {
        errors.push(`${jsonPath}: failed to parse exercise.json`);
        continue;
      }

      const titleDefault = item.title?.default ?? '';
      if (existingTitles.has(titleDefault.toLowerCase())) {
        skipped++;
        continue;
      }

      try {
        // Cover image
        let imageUrl: string | undefined;
        if (item.coverImage) {
          const coverPath = `${folderPrefix}${item.coverImage}`;
          const coverFile = zip.files[coverPath];
          if (coverFile && !coverFile.dir) {
            const buffer: Buffer = await coverFile.async('nodebuffer');
            const ext = coverPath.split('.').pop() ?? 'webp';
            imageUrl = await this.uploadService.writeExerciseImageFromBuffer(buffer, ext);
          }
        }

        const muscleGroupIds = (item.muscleGroupNames ?? [])
          .map((name: string) => mgByName.get(name.toLowerCase()))
          .filter((id: number | undefined): id is number => id !== undefined);

        const primaryMuscleGroupIds = (item.primaryMuscleGroupNames ?? [])
          .map((name: string) => mgByName.get(name.toLowerCase()))
          .filter((id: number | undefined): id is number => id !== undefined);

        const created_exercise = await this.exerciseService.createGlobal({
          title: item.title,
          description: item.description ?? undefined,
          exerciseType: item.exerciseType ?? undefined,
          muscleGroupIds,
          primaryMuscleGroupIds,
          equipmentI18n: item.equipmentI18n ?? undefined,
          imageUrl,
          instructionsI18n: item.instructionsI18n ?? undefined,
          proTipsI18n: item.proTipsI18n ?? undefined,
          mistakesI18n: item.mistakesI18n ?? undefined,
        } as any);

        // Media items
        for (const mediaEntry of (item.media ?? []) as { order: number; type: string; file: string }[]) {
          const mediaPath = `${folderPrefix}${mediaEntry.file}`;
          const mediaFile = zip.files[mediaPath];
          if (mediaFile && !mediaFile.dir) {
            const buffer: Buffer = await mediaFile.async('nodebuffer');
            const ext = mediaPath.split('.').pop() ?? 'webp';
            const mediaUrl = await this.uploadService.writeExerciseMediaFromBuffer(buffer, ext);
            await this.exerciseService.addGlobalMedia(
              created_exercise.id,
              mediaUrl,
              mediaEntry.type as 'image' | 'video',
            );
          }
        }

        existingTitles.add(titleDefault.toLowerCase());
        created++;
      } catch (err: any) {
        errors.push(`"${titleDefault}": ${err?.message ?? 'unknown error'}`);
      }
    }

    return { created, skipped, errors };
  }

  @Post('import/activities')
  @ApiOperation({ summary: 'Import global activities from a JSON export file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  async importActivities(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    if (!file) throw new BadRequestException('No file provided');

    let payload: any;
    try {
      payload = JSON.parse(file.buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid JSON file');
    }

    if (payload.type !== 'activities' || !Array.isArray(payload.activities)) {
      throw new BadRequestException('File does not appear to be an activities export');
    }

    const existingActivities = await this.activityService.findAll(0, 'global');
    const existingTitles = new Set(
      existingActivities.map((a) => (a.title?.default ?? '').toLowerCase()),
    );

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of payload.activities) {
      const titleDefault = item.title?.default ?? '';
      if (existingTitles.has(titleDefault.toLowerCase())) {
        skipped++;
        continue;
      }

      try {
        await this.activityService.createGlobal({
          title: item.title,
          description: item.description ?? undefined,
          icon: item.icon,
          equipment: item.equipment ?? [],
          trackDistance: item.trackDistance ?? false,
          trackPace: item.trackPace ?? false,
          trackElevation: item.trackElevation ?? false,
          trackCalories: item.trackCalories ?? false,
        });

        existingTitles.add(titleDefault.toLowerCase());
        created++;
      } catch (err: any) {
        errors.push(`"${titleDefault}": ${err?.message ?? 'unknown error'}`);
      }
    }

    return { created, skipped, errors };
  }
}
