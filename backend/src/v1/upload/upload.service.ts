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

import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class UploadService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly exercisesDir = path.join(this.uploadsDir, 'exercises');
  private readonly avatarsDir = path.join(this.uploadsDir, 'avatars');
  private readonly mediaDir = path.join(this.exercisesDir, 'media');
  private readonly progressPhotosDir = path.join(
    this.uploadsDir,
    'progress-photos',
  );

  constructor() {
    this.ensureDirectoriesExist();
  }

  private async ensureDirectoriesExist() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.exercisesDir, { recursive: true });
      await fs.mkdir(this.avatarsDir, { recursive: true });
      await fs.mkdir(this.mediaDir, { recursive: true });
      await fs.mkdir(this.progressPhotosDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  /**
   * Process and optimize an exercise image
   * Optimized for mobile - smaller dimensions and size
   */
  async processExerciseImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; fileSize: number }> {
    const filename = `${randomBytes(16).toString('hex')}.webp`;
    const filepath = path.join(this.exercisesDir, filename);

    // Optimize for mobile: max 800px width, high compression
    const info = await sharp(file.buffer)
      .rotate()
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    return { url: `/uploads/exercises/${filename}`, fileSize: info.size };
  }

  /**
   * Process and optimize an avatar image
   * Smaller dimensions for profile pictures
   */
  async processAvatarImage(file: Express.Multer.File): Promise<string> {
    const filename = `${randomBytes(16).toString('hex')}.webp`;
    const filepath = path.join(this.avatarsDir, filename);

    // Avatar optimized: 400x400px, circular crop friendly
    await sharp(file.buffer)
      .rotate()
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    return `/uploads/avatars/${filename}`;
  }

  /**
   * Process exercise media (image or video).
   * Images are converted to WebP; videos are stored as-is.
   */
  async processExerciseMedia(
    file: Express.Multer.File,
  ): Promise<{ url: string; type: 'image' | 'video' }> {
    const isVideo = file.mimetype === 'video/mp4';

    if (isVideo) {
      const filename = `${randomBytes(16).toString('hex')}.mp4`;
      const filepath = path.join(this.mediaDir, filename);
      await fs.writeFile(filepath, file.buffer);
      return { url: `/uploads/exercises/media/${filename}`, type: 'video' };
    }

    // Image processing
    const filename = `${randomBytes(16).toString('hex')}.webp`;
    const filepath = path.join(this.mediaDir, filename);
    await sharp(file.buffer)
      .rotate()
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filepath);

    return { url: `/uploads/exercises/media/${filename}`, type: 'image' };
  }

  async readFileAsBuffer(relativeUrl: string): Promise<Buffer | null> {
    if (!relativeUrl) return null;
    try {
      const filepath = path.join(process.cwd(), relativeUrl);
      return await fs.readFile(filepath);
    } catch {
      return null;
    }
  }

  async writeExerciseImageFromBuffer(buffer: Buffer, ext: string): Promise<string> {
    const filename = `${randomBytes(16).toString('hex')}.${ext}`;
    const filepath = path.join(this.exercisesDir, filename);
    await fs.writeFile(filepath, buffer);
    return `/uploads/exercises/${filename}`;
  }

  async writeExerciseMediaFromBuffer(buffer: Buffer, ext: string): Promise<string> {
    const filename = `${randomBytes(16).toString('hex')}.${ext}`;
    const filepath = path.join(this.mediaDir, filename);
    await fs.writeFile(filepath, buffer);
    return `/uploads/exercises/media/${filename}`;
  }

  /**
   * Delete an image file from the filesystem
   */
  async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    try {
      const filepath = path.join(process.cwd(), imageUrl);
      await fs.unlink(filepath);
    } catch (error) {
      // File might not exist, which is fine
      console.log('Image deletion failed (file may not exist):', error.message);
    }
  }

  /**
   * Process and optimize a progress photo
   * Max 1080px wide, preserves portrait aspect ratio
   */
  async processProgressPhoto(file: Express.Multer.File): Promise<string> {
    const filename = `${randomBytes(16).toString('hex')}.webp`;
    const filepath = path.join(this.progressPhotosDir, filename);

    await sharp(file.buffer)
      .rotate()
      .resize(1080, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    return `/uploads/progress-photos/${filename}`;
  }

  /**
   * Validate uploaded file (images only)
   */
  validateImageFile(file: Express.Multer.File): {
    valid: boolean;
    error?: string;
  } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ];

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
      };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 10MB' };
    }

    return { valid: true };
  }

  /**
   * Validate uploaded media file (images + video)
   */
  validateMediaFile(file: Express.Multer.File): {
    valid: boolean;
    error?: string;
  } {
    const maxSize = 50 * 1024 * 1024; // 50MB for video
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
      'video/mp4',
    ];

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and MP4 are allowed',
      };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 50MB' };
    }

    return { valid: true };
  }
}
