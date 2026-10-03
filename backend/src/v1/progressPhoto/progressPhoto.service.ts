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

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressPhoto } from './progressPhoto.entity';
import { User } from '../user/user.entity';
import { CreateProgressPhotoDto } from './dto/createProgressPhoto.dto';
import { UploadService } from '../upload/upload.service';

export interface ProgressPhotoResponseDto {
  id: number;
  photoUrl: string;
  date: string;
  poseTag: 'front' | 'side' | 'back' | null;
  notes: string | null;
  createdAt: Date;
}

@Injectable()
export class ProgressPhotoService {
  constructor(
    @InjectRepository(ProgressPhoto)
    private readonly photoRepo: Repository<ProgressPhoto>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Progress photos are never served statically — the URL points at the
   * authenticated file endpoint which checks ownership.
   */
  private toResponseDto(photo: ProgressPhoto): ProgressPhotoResponseDto {
    return {
      id: photo.id,
      photoUrl: `/v1/progress-photos/${photo.id}/file`,
      date: photo.date,
      poseTag: photo.poseTag,
      notes: photo.notes,
      createdAt: photo.createdAt,
    };
  }

  async findAll(userId: number): Promise<ProgressPhotoResponseDto[]> {
    const photos = await this.photoRepo.find({
      where: { user: { id: userId } },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return photos.map((p) => this.toResponseDto(p));
  }

  async create(
    userId: number,
    file: Express.Multer.File,
    dto: CreateProgressPhotoDto,
  ): Promise<ProgressPhotoResponseDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id'],
    });
    if (!user) throw new NotFoundException('User not found');

    const photoUrl = await this.uploadService.processProgressPhoto(file);

    const photo = this.photoRepo.create({
      user: { id: userId } as User,
      photoUrl,
      date: dto.date ?? new Date().toISOString().split('T')[0],
      poseTag: dto.poseTag ?? null,
      notes: dto.notes ?? null,
    });

    const saved = await this.photoRepo.save(photo);
    return this.toResponseDto(saved);
  }

  /** Absolute path of the photo file, only for the owner (404 otherwise). */
  async getFilePath(userId: number, photoId: number): Promise<string> {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId, user: { id: userId } },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    const filepath = this.uploadService.resolveUploadPath(photo.photoUrl);
    if (!filepath) throw new NotFoundException('Photo not found');
    return filepath;
  }

  async delete(userId: number, photoId: number): Promise<void> {
    // Other users' photos are indistinguishable from missing ones (404)
    const photo = await this.photoRepo.findOne({
      where: { id: photoId, user: { id: userId } },
    });

    if (!photo) throw new NotFoundException('Photo not found');

    await this.uploadService.deleteImage(photo.photoUrl);
    await this.photoRepo.remove(photo);
  }
}
