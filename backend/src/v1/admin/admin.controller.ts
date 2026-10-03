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
import * as JSZip from 'jszip';
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
import { UploadCleanupService } from '../upload/uploadCleanup.service';
import {
  IMAGE_UPLOAD_OPTIONS,
  MEDIA_UPLOAD_OPTIONS,
  ZIP_IMPORT_OPTIONS,
  JSON_IMPORT_OPTIONS,
} from '../upload/upload.constants';
import { AuditService } from '../audit/audit.service';
import { AuditLogQueryDto } from '../audit/auditLogQuery.dto';
import { ReorderMediaDto } from '../common/dto/reorderMedia.dto';
import { ImportExerciseItemDto } from './dto/importExercise.dto';
import { validatePlain } from '../common/validatePlain.util';

// Hard limits for admin imports (zip bombs / resource exhaustion)
const IMPORT_MAX_EXERCISES = 500;
const IMPORT_MAX_ZIP_ENTRIES = 5000;
const IMPORT_MAX_UNCOMPRESSED_BYTES = 300 * 1024 * 1024; // 300MB
const IMPORT_MAX_ENTRY_BYTES = 50 * 1024 * 1024; // 50MB per file
const IMPORT_MAX_JSON_BYTES = 1024 * 1024; // 1MB per exercise.json
const IMPORT_MAX_ACTIVITIES = 1000;
const IMPORT_ALLOWED_EXTENSIONS = ['json', 'webp', 'jpg', 'jpeg', 'png', 'mp4'];

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
    private readonly uploadCleanupService: UploadCleanupService,
    private readonly auditService: AuditService,
    @InjectRepository(ExerciseImage)
    private readonly exerciseImageRepo: Repository<ExerciseImage>,
  ) {}

  private audit(
    req: RequestWithUser,
    action: string,
    targetType?: string | null,
    targetId?: number | string | null,
    metadata?: Record<string, unknown>,
  ) {
    return this.auditService.log({
      action: `admin.${action}`,
      actor: req.user,
      targetType,
      targetId,
      metadata,
      req,
    });
  }

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
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit ?? '20', 10) || 20),
    );
    return this.adminService.listUsers(
      pageNum,
      limitNum,
      search?.slice(0, 100),
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  async getUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const user = await this.adminService.getUserById(id);
    await this.audit(req, 'user_viewed', 'user', id);
    return user;
  }

  // --- Audit log ---

  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit log entries (newest first)' })
  listAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.auditService.list({
      page: query.page ?? 1,
      limit: query.limit ?? 50,
      action: query.action || undefined,
      actorId: query.actorId,
    });
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
  async createGlobalExercise(
    @Body() dto: CreateGlobalExerciseDto,
    @Req() req: RequestWithUser,
  ): Promise<ExerciseResponseDto> {
    const created = await this.exerciseService.createGlobal(dto);
    await this.audit(req, 'exercise_created', 'exercise', created.id);
    return created;
  }

  @Put('exercises/:id')
  @ApiOperation({ summary: 'Update a global exercise' })
  @ApiOkResponse({ type: ExerciseResponseDto })
  async updateGlobalExercise(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGlobalExerciseDto,
    @Req() req: RequestWithUser,
  ): Promise<ExerciseResponseDto> {
    const updated = await this.exerciseService.updateGlobal(id, dto);
    await this.audit(req, 'exercise_updated', 'exercise', id);
    return updated;
  }

  @Delete('exercises/:id')
  @ApiOperation({
    summary: 'Soft-delete a global exercise (user data preserved)',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGlobalExercise(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const result = await this.exerciseService.deleteGlobal(id);
    await this.audit(req, 'exercise_deleted', 'exercise', id);
    return result;
  }

  // --- Global Exercise Media ---

  @Post('exercises/:id/media')
  @ApiOperation({
    summary: 'Upload instructional media (image or video) to a global exercise',
  })
  @ApiCreatedResponse({ type: ExerciseResponseDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', MEDIA_UPLOAD_OPTIONS))
  async addGlobalExerciseMedia(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ): Promise<ExerciseResponseDto> {
    await this.exerciseService.assertGlobalExerciseExists(id);
    const validation = this.uploadService.validateMediaFile(file);
    if (!validation.valid) throw new BadRequestException(validation.error);

    const { url, type } = await this.uploadService.processExerciseMedia(file);
    const result = await this.exerciseService.addGlobalMedia(id, url, type);
    await this.audit(req, 'exercise_media_added', 'exercise', id, { type });
    return result;
  }

  @Delete('exercises/:id/media/:mediaId')
  @ApiOperation({ summary: 'Delete a media item from a global exercise' })
  @HttpCode(HttpStatus.OK)
  async deleteGlobalExerciseMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() req: RequestWithUser,
  ): Promise<ExerciseResponseDto> {
    const result = await this.exerciseService.removeGlobalMedia(id, mediaId);
    await this.audit(req, 'exercise_media_deleted', 'exercise', id, {
      mediaId,
    });
    return result;
  }

  @Put('exercises/:id/media/reorder')
  @ApiOperation({ summary: 'Reorder media items for a global exercise' })
  async reorderGlobalExerciseMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReorderMediaDto,
    @Req() req: RequestWithUser,
  ): Promise<ExerciseResponseDto> {
    const result = await this.exerciseService.reorderGlobalMedia(
      id,
      body.mediaIds,
    );
    await this.audit(req, 'exercise_media_reordered', 'exercise', id);
    return result;
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
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async uploadExerciseImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ): Promise<ExerciseImageResponseDto> {
    const validation = this.uploadService.validateImageFile(file);
    if (!validation.valid) throw new BadRequestException(validation.error);

    const { url, fileSize } =
      await this.uploadService.processExerciseImage(file);
    const record = this.exerciseImageRepo.create({ url, fileSize });
    const saved = await this.exerciseImageRepo.save(record);
    await this.audit(
      req,
      'exercise_image_uploaded',
      'exercise_image',
      saved.id,
    );
    return saved;
  }

  @Delete('exercise-images/:id')
  @ApiOperation({ summary: 'Delete an image from the exercise image library' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExerciseImage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const image = await this.exerciseImageRepo.findOne({ where: { id } });
    if (!image) return;

    // Block deletion if the image URL is still referenced by any exercise
    const result: { count: string }[] =
      await this.exerciseImageRepo.manager.query(
        `SELECT COUNT(*) AS count FROM exercise WHERE image = $1 AND "deletedAt" IS NULL`,
        [image.url],
      );
    const inUse = parseInt(result[0]?.count ?? '0', 10);

    if (inUse > 0) {
      throw new ConflictException(
        'Image is currently assigned to one or more exercises. Remove it from those exercises first.',
      );
    }

    const url = image.url;
    await this.exerciseImageRepo.remove(image);
    // Personal copies (incl. soft-deleted ones) may still use the file
    await this.uploadCleanupService.deleteIfUnreferenced([url]);
    await this.audit(req, 'exercise_image_deleted', 'exercise_image', id);
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
  async createGlobalActivity(
    @Body() dto: CreateGlobalActivityDto,
    @Req() req: RequestWithUser,
  ): Promise<ActivityResponseDto> {
    const created = await this.activityService.createGlobal(dto);
    await this.audit(req, 'activity_created', 'activity', created.id);
    return created;
  }

  @Put('activities/:id')
  @ApiOperation({ summary: 'Update a global activity' })
  @ApiOkResponse({ type: ActivityResponseDto })
  async updateGlobalActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGlobalActivityDto,
    @Req() req: RequestWithUser,
  ): Promise<ActivityResponseDto> {
    const updated = await this.activityService.updateGlobal(id, dto);
    await this.audit(req, 'activity_updated', 'activity', id);
    return updated;
  }

  @Delete('activities/:id')
  @ApiOperation({
    summary: 'Soft-delete a global activity (user data preserved)',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGlobalActivity(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const result = await this.activityService.deleteGlobal(id);
    await this.audit(req, 'activity_deleted', 'activity', id);
    return result;
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
  async createMuscleGroup(
    @Body() dto: CreateMuscleGroupAdminDto,
    @Req() req: RequestWithUser,
  ): Promise<MuscleGroup> {
    const created = await this.muscleGroupService.create({
      name: dto.name,
      nameI18n: dto.nameI18n ?? { default: dto.name },
      descriptionI18n: dto.descriptionI18n,
    });
    await this.audit(req, 'muscle_group_created', 'muscle_group', created.id);
    return created;
  }

  @Put('muscle-groups/:id')
  @ApiOperation({ summary: 'Update muscle group translations' })
  async updateMuscleGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMuscleGroupAdminDto,
    @Req() req: RequestWithUser,
  ): Promise<MuscleGroup> {
    const updated = await this.muscleGroupService.update(id, dto);
    await this.audit(req, 'muscle_group_updated', 'muscle_group', id);
    return updated;
  }

  @Get('muscle-groups/:id/exercises')
  @ApiOperation({
    summary:
      'List exercises that reference a muscle group (for delete warnings)',
  })
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
  @ApiOperation({
    summary: 'Delete a muscle group (removes association from all exercises)',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMuscleGroup(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const result = await this.muscleGroupService.remove(id);
    await this.audit(req, 'muscle_group_deleted', 'muscle_group', id);
    return result;
  }

  // --- Export ---

  @Get('export/exercises')
  @ApiOperation({
    summary:
      'Export all global exercises as a ZIP archive (one folder per exercise)',
  })
  @Header('Content-Type', 'application/zip')
  async exportExercises(@Req() req: RequestWithUser): Promise<StreamableFile> {
    const zip = new JSZip();

    const exercises = await this.exerciseService.findAll(0, 'global');

    const sanitizeFolderName = (title: string): string =>
      (title ?? '')
        .replace(/[/\\:*?"<>|]/g, '-')
        .trim()
        .slice(0, 80) || 'exercise';

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
      const sortedMedia = [...(ex.media ?? [])].sort(
        (a, b) => a.order - b.order,
      );
      for (const mediaItem of sortedMedia) {
        const buffer = await this.uploadService.readFileAsBuffer(mediaItem.url);
        if (buffer) {
          const ext = mediaItem.url.split('.').pop() ?? 'webp';
          zip.file(
            `${folderName}/images/media-${mediaItem.order}.${ext}`,
            buffer,
          );
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
            primaryMuscleGroupNames:
              ex.primaryMuscleGroups?.map((mg) => mg.name) ?? [],
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

    const zipBuffer: Buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });
    await this.audit(req, 'export_exercises', null, null, {
      count: exercises.length,
    });
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
  async exportActivities(@Req() req: RequestWithUser): Promise<StreamableFile> {
    const activities = await this.activityService.findAll(0, 'global');
    await this.audit(req, 'export_activities', null, null, {
      count: activities.length,
    });

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
  @ApiOperation({
    summary: 'Import global exercises from a ZIP export archive',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', ZIP_IMPORT_OPTIONS))
  async importExercises(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    if (!file) throw new BadRequestException('No file provided');

    let zip: any;
    try {
      zip = await JSZip.loadAsync(file.buffer, { checkCRC32: true });
    } catch {
      throw new BadRequestException('Invalid ZIP file');
    }

    const entryNames: string[] = Object.keys(zip.files).filter(
      (p: string) => !zip.files[p].dir,
    );
    if (entryNames.length > IMPORT_MAX_ZIP_ENTRIES) {
      throw new BadRequestException(
        `ZIP contains too many files (max ${IMPORT_MAX_ZIP_ENTRIES})`,
      );
    }

    // Declared sizes are checked up front; actual sizes are enforced while reading
    let declaredTotal = 0;
    for (const name of entryNames) {
      const ext = name.split('.').pop()?.toLowerCase() ?? '';
      if (name.includes('..') || name.startsWith('/') || name.includes('\\')) {
        throw new BadRequestException(
          `Invalid path in ZIP: ${name.slice(0, 100)}`,
        );
      }
      if (
        !IMPORT_ALLOWED_EXTENSIONS.includes(ext) &&
        !name.startsWith('__MACOSX/') &&
        !name.endsWith('.DS_Store')
      ) {
        throw new BadRequestException(
          `Unsupported file type in ZIP: ${name.slice(0, 100)}`,
        );
      }
      const size = Number(zip.files[name]?._data?.uncompressedSize ?? 0);
      if (size > IMPORT_MAX_ENTRY_BYTES) {
        throw new BadRequestException(
          `File too large in ZIP: ${name.slice(0, 100)}`,
        );
      }
      declaredTotal += size;
    }
    if (declaredTotal > IMPORT_MAX_UNCOMPRESSED_BYTES) {
      throw new BadRequestException('ZIP content is too large');
    }

    let bytesRead = 0;
    const readEntry = (entry: any, maxBytes: number): Promise<Buffer> =>
      new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let size = 0;
        let done = false;
        const stream = entry.internalStream('uint8array');
        stream
          .on('data', (chunk: Uint8Array) => {
            if (done) return;
            size += chunk.length;
            bytesRead += chunk.length;
            if (size > maxBytes || bytesRead > IMPORT_MAX_UNCOMPRESSED_BYTES) {
              done = true;
              stream.pause();
              reject(new BadRequestException('ZIP content is too large'));
              return;
            }
            chunks.push(Buffer.from(chunk));
          })
          .on('error', (err: Error) => {
            if (done) return;
            done = true;
            reject(err);
          })
          .on('end', () => {
            if (done) return;
            done = true;
            resolve(Buffer.concat(chunks));
          })
          .resume();
      });

    // Find all exercise.json entries (not directories)
    const exerciseJsonPaths = entryNames.filter(
      (p) => p.endsWith('/exercise.json') && !p.startsWith('__MACOSX/'),
    );

    if (exerciseJsonPaths.length === 0) {
      throw new BadRequestException(
        'No exercise.json files found in ZIP — is this a valid exercises export?',
      );
    }
    if (exerciseJsonPaths.length > IMPORT_MAX_EXERCISES) {
      throw new BadRequestException(
        `Too many exercises in ZIP (max ${IMPORT_MAX_EXERCISES})`,
      );
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
      let item: ImportExerciseItemDto;
      try {
        const jsonContent = (
          await readEntry(zip.files[jsonPath], IMPORT_MAX_JSON_BYTES)
        ).toString('utf-8');
        const parsed = await validatePlain(
          ImportExerciseItemDto,
          JSON.parse(jsonContent),
        );
        if (parsed.errors) {
          errors.push(
            `${jsonPath}: invalid exercise.json (${parsed.errors.join('; ')})`,
          );
          continue;
        }
        item = parsed.value;
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        errors.push(`${jsonPath}: failed to parse exercise.json`);
        continue;
      }

      const titleDefault = item.title?.default ?? '';
      if (!titleDefault.trim()) {
        errors.push(`${jsonPath}: missing title.default`);
        continue;
      }
      if (existingTitles.has(titleDefault.toLowerCase())) {
        skipped++;
        continue;
      }

      const writtenFiles: string[] = [];
      try {
        // Cover image (always re-encoded with sharp)
        let imageUrl: string | undefined;
        if (item.coverImage) {
          const coverFile = zip.files[`${folderPrefix}${item.coverImage}`];
          if (coverFile && !coverFile.dir) {
            const buffer = await readEntry(coverFile, IMPORT_MAX_ENTRY_BYTES);
            const { url } =
              await this.uploadService.writeExerciseImageFromBuffer(buffer);
            writtenFiles.push(url);
            imageUrl = url;
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
        });

        // Media items (images re-encoded, videos must be real MP4)
        for (const mediaEntry of item.media ?? []) {
          const mediaFile = zip.files[`${folderPrefix}${mediaEntry.file}`];
          if (mediaFile && !mediaFile.dir) {
            const buffer = await readEntry(mediaFile, IMPORT_MAX_ENTRY_BYTES);
            const { url, type } =
              await this.uploadService.writeExerciseMediaFromBuffer(buffer);
            writtenFiles.push(url);
            await this.exerciseService.addGlobalMedia(
              created_exercise.id,
              url,
              type,
            );
          }
        }

        existingTitles.add(titleDefault.toLowerCase());
        created++;
      } catch (err: any) {
        if (
          err instanceof BadRequestException &&
          err.message === 'ZIP content is too large'
        ) {
          await this.uploadCleanupService.deleteIfUnreferenced(writtenFiles);
          throw err;
        }
        await this.uploadCleanupService.deleteIfUnreferenced(writtenFiles);
        errors.push(`"${titleDefault}": ${err?.message ?? 'unknown error'}`);
      }
    }

    await this.audit(req, 'import_exercises', null, null, {
      created,
      skipped,
      errors: errors.length,
    });

    return { created, skipped, errors };
  }

  @Post('import/activities')
  @ApiOperation({ summary: 'Import global activities from a JSON export file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', JSON_IMPORT_OPTIONS))
  async importActivities(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    if (!file) throw new BadRequestException('No file provided');

    let payload: any;
    try {
      payload = JSON.parse(file.buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid JSON file');
    }

    if (payload?.type !== 'activities' || !Array.isArray(payload.activities)) {
      throw new BadRequestException(
        'File does not appear to be an activities export',
      );
    }
    if (payload.activities.length > IMPORT_MAX_ACTIVITIES) {
      throw new BadRequestException(
        `Too many activities in file (max ${IMPORT_MAX_ACTIVITIES})`,
      );
    }

    const existingActivities = await this.activityService.findAll(0, 'global');
    const existingTitles = new Set(
      existingActivities.map((a) => (a.title?.default ?? '').toLowerCase()),
    );

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [index, raw] of (payload.activities as unknown[]).entries()) {
      const candidate =
        raw && typeof raw === 'object'
          ? {
              ...(raw as Record<string, unknown>),
              description: (raw as any).description ?? undefined,
              equipment: (raw as any).equipment ?? [],
              trackDistance: (raw as any).trackDistance ?? false,
              trackPace: (raw as any).trackPace ?? false,
              trackElevation: (raw as any).trackElevation ?? false,
              trackCalories: (raw as any).trackCalories ?? false,
            }
          : raw;
      const parsed = await validatePlain(CreateGlobalActivityDto, candidate);
      if (parsed.errors) {
        errors.push(`activities[${index}]: ${parsed.errors.join('; ')}`);
        continue;
      }
      const item = parsed.value;

      const titleDefault = item.title?.default ?? '';
      if (existingTitles.has(titleDefault.toLowerCase())) {
        skipped++;
        continue;
      }

      try {
        await this.activityService.createGlobal(item);

        existingTitles.add(titleDefault.toLowerCase());
        created++;
      } catch (err: any) {
        errors.push(`"${titleDefault}": ${err?.message ?? 'unknown error'}`);
      }
    }

    await this.audit(req, 'import_activities', null, null, {
      created,
      skipped,
      errors: errors.length,
    });

    return { created, skipped, errors };
  }
}
