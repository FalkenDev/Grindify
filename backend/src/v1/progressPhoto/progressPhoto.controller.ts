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
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
  BadRequestException,
  ParseIntPipe,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { RequestWithUser } from '../types/requestWithUser.type';
import { ProgressPhotoService } from './progressPhoto.service';
import { CreateProgressPhotoDto } from './dto/createProgressPhoto.dto';
import { UploadService } from '../upload/upload.service';
import { ConsentGuard } from '../guards/consent.guard';
import { HealthConsentGuard } from '../guards/healthConsent.guard';
import { IMAGE_UPLOAD_OPTIONS } from '../upload/upload.constants';

@ApiTags('progress-photos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ConsentGuard, HealthConsentGuard)
@Controller('progress-photos')
export class ProgressPhotoController {
  constructor(
    private readonly progressPhotoService: ProgressPhotoService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all progress photos for the authenticated user',
  })
  getAll(@Req() req: RequestWithUser) {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return this.progressPhotoService.findAll(+req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Upload a new progress photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Progress photo with optional metadata' })
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateProgressPhotoDto,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    if (!file) throw new BadRequestException('No file provided');

    const validation = this.uploadService.validateImageFile(file);
    if (!validation.valid) throw new BadRequestException(validation.error);

    return this.progressPhotoService.create(+req.user.id, file, body);
  }

  @Get(':id/file')
  @ApiOperation({
    summary: 'Get the image file of a progress photo (owner only)',
  })
  async getPhotoFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ): Promise<void> {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    const filepath = await this.progressPhotoService.getFilePath(
      +req.user.id,
      id,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Type', 'image/webp');
    await new Promise<void>((resolve, reject) => {
      res.sendFile(
        filepath,
        { dotfiles: 'deny', etag: false, lastModified: false },
        (err) => {
          if (err) {
            if (!res.headersSent) {
              reject(new NotFoundException('Photo not found'));
              return;
            }
          }
          resolve();
        },
      );
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a progress photo' })
  async deletePhoto(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.id)
      throw new UnauthorizedException('User not authenticated');
    await this.progressPhotoService.delete(+req.user.id, id);
    return { message: 'Photo deleted' };
  }
}
