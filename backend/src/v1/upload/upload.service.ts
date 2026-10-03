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

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomBytes } from 'crypto';
import type SharpDefault from 'sharp';
import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_MEDIA_UPLOAD_BYTES,
} from './upload.constants';

// sharp >= 0.35 ships ESM-first typings (default export) while the CJS entry
// exports the function itself; load the CJS build with the ESM types.
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const sharp: typeof SharpDefault = require('sharp');

export type DetectedFileType = 'jpeg' | 'png' | 'webp' | 'mp4';

/** Hosts we are willing to download OAuth avatars from. */
const OAUTH_AVATAR_HOST_SUFFIXES = [
  '.githubusercontent.com',
  '.googleusercontent.com',
];
const OAUTH_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const OAUTH_AVATAR_TIMEOUT_MS = 5000;

/** Client-facing message when an uploaded image cannot be decoded. */
export const INVALID_IMAGE_MESSAGE =
  'The image could not be processed. The file is corrupt or not a valid JPEG, PNG or WebP image';

/**
 * Stored upload URLs always look like `/uploads/<dir>/<32 hex chars>.<ext>`.
 * Anything else is rejected before it can be turned into a filesystem path.
 */
const UPLOAD_URL_PATTERN =
  /^\/uploads\/(avatars|exercises|exercises\/media|progress-photos)\/[a-f0-9]{32}\.(webp|mp4|jpe?g|png)$/;

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadsDir = path.resolve(process.cwd(), 'uploads');
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

  private randomName(ext: string): string {
    return `${randomBytes(16).toString('hex')}.${ext}`;
  }

  /**
   * Resolve a stored `/uploads/...` URL to an absolute path inside the
   * uploads directory. Returns null for anything that does not match the
   * expected pattern or would escape the uploads directory.
   */
  resolveUploadPath(relativeUrl: string | null | undefined): string | null {
    if (!relativeUrl || typeof relativeUrl !== 'string') return null;
    if (!UPLOAD_URL_PATTERN.test(relativeUrl)) return null;
    const resolved = path.resolve(
      this.uploadsDir,
      relativeUrl.slice('/uploads/'.length),
    );
    if (!resolved.startsWith(this.uploadsDir + path.sep)) return null;
    return resolved;
  }

  isValidUploadUrl(relativeUrl: string | null | undefined): boolean {
    return this.resolveUploadPath(relativeUrl) !== null;
  }

  /**
   * Detect the real file type from magic bytes (never trust the client
   * supplied mimetype).
   */
  detectFileType(buffer: Buffer | undefined | null): DetectedFileType | null {
    if (!buffer || buffer.length < 12) return null;
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'jpeg';
    }
    if (
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return 'png';
    }
    if (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'webp';
    }
    if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
      return 'mp4';
    }
    return null;
  }

  private async toWebp(
    buffer: Buffer,
    width: number,
    height: number,
    fit: 'inside' | 'cover',
    quality: number,
    filepath: string,
  ) {
    const pipeline = sharp(buffer, { failOn: 'error' }).rotate();
    const resized =
      fit === 'cover'
        ? pipeline.resize(width, height, { fit: 'cover', position: 'center' })
        : pipeline.resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true,
          });
    // Decode/encode in memory first: corrupt, truncated or undecodable input
    // is a client error (400), while disk errors below remain 500s.
    const output = await resized
      .webp({ quality })
      .toBuffer({ resolveWithObject: true })
      .catch((error: unknown) => {
        this.logger.warn(
          `Image decoding failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new BadRequestException(INVALID_IMAGE_MESSAGE);
      });
    await fs.writeFile(filepath, output.data);
    return output.info;
  }

  /**
   * Process and optimize an exercise image
   * Optimized for mobile - smaller dimensions and size
   */
  async processExerciseImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; fileSize: number }> {
    const filename = this.randomName('webp');
    const filepath = path.join(this.exercisesDir, filename);

    // Optimize for mobile: max 800px width, high compression
    const info = await this.toWebp(
      file.buffer,
      800,
      800,
      'inside',
      80,
      filepath,
    );

    return { url: `/uploads/exercises/${filename}`, fileSize: info.size };
  }

  /**
   * Process and optimize an avatar image
   * Smaller dimensions for profile pictures
   */
  async processAvatarImage(file: Express.Multer.File): Promise<string> {
    return this.processAvatarBuffer(file.buffer);
  }

  private async processAvatarBuffer(buffer: Buffer): Promise<string> {
    const filename = this.randomName('webp');
    const filepath = path.join(this.avatarsDir, filename);

    // Avatar optimized: 400x400px, circular crop friendly
    await this.toWebp(buffer, 400, 400, 'cover', 85, filepath);

    return `/uploads/avatars/${filename}`;
  }

  /**
   * Download an OAuth provider avatar server-side and store it locally.
   * Only https URLs on GitHub/Google avatar hosts are accepted; the download
   * is time- and size-limited and re-encoded with sharp. Returns null on any
   * failure (the user simply gets no avatar).
   */
  async processAvatarFromUrl(
    remoteUrl: string | null | undefined,
  ): Promise<string | null> {
    if (!remoteUrl) return null;
    let parsed: URL;
    try {
      parsed = new URL(remoteUrl);
    } catch {
      return null;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      parsed.protocol !== 'https:' ||
      !OAUTH_AVATAR_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
    ) {
      return null;
    }

    try {
      const response = await fetch(parsed.toString(), {
        redirect: 'error',
        signal: AbortSignal.timeout(OAUTH_AVATAR_TIMEOUT_MS),
      });
      if (!response.ok || !response.body) return null;

      const declared = Number(response.headers.get('content-length') ?? '0');
      if (declared > OAUTH_AVATAR_MAX_BYTES) return null;

      const chunks: Buffer[] = [];
      let total = 0;
      const reader = response.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > OAUTH_AVATAR_MAX_BYTES) {
          await reader.cancel();
          return null;
        }
        chunks.push(Buffer.from(value));
      }

      const buffer = Buffer.concat(chunks);
      const type = this.detectFileType(buffer);
      if (!type || type === 'mp4') return null;

      return await this.processAvatarBuffer(buffer);
    } catch (error) {
      this.logger.warn(
        `Failed to download OAuth avatar: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Process exercise media (image or video).
   * Images are converted to WebP; videos are stored as-is (after a magic
   * byte check).
   */
  async processExerciseMedia(
    file: Express.Multer.File,
  ): Promise<{ url: string; type: 'image' | 'video' }> {
    return this.writeExerciseMedia(file.buffer);
  }

  private async writeExerciseMedia(
    buffer: Buffer,
  ): Promise<{ url: string; type: 'image' | 'video' }> {
    const detected = this.detectFileType(buffer);
    if (!detected) {
      throw new BadRequestException(
        'Unsupported media file. Only JPEG, PNG, WebP and MP4 are allowed',
      );
    }

    if (detected === 'mp4') {
      const filename = this.randomName('mp4');
      const filepath = path.join(this.mediaDir, filename);
      await fs.writeFile(filepath, buffer);
      return { url: `/uploads/exercises/media/${filename}`, type: 'video' };
    }

    // Image processing
    const filename = this.randomName('webp');
    const filepath = path.join(this.mediaDir, filename);
    await this.toWebp(buffer, 1200, 1200, 'inside', 85, filepath);

    return { url: `/uploads/exercises/media/${filename}`, type: 'image' };
  }

  async readFileAsBuffer(relativeUrl: string): Promise<Buffer | null> {
    const filepath = this.resolveUploadPath(relativeUrl);
    if (!filepath) return null;
    try {
      return await fs.readFile(filepath);
    } catch {
      return null;
    }
  }

  /**
   * Store an exercise cover image coming from an import archive.
   * The image is always decoded and re-encoded with sharp.
   */
  async writeExerciseImageFromBuffer(
    buffer: Buffer,
  ): Promise<{ url: string; fileSize: number }> {
    const detected = this.detectFileType(buffer);
    if (!detected || detected === 'mp4') {
      throw new BadRequestException(
        'Unsupported image file. Only JPEG, PNG and WebP are allowed',
      );
    }
    const filename = this.randomName('webp');
    const filepath = path.join(this.exercisesDir, filename);
    const info = await this.toWebp(buffer, 800, 800, 'inside', 80, filepath);
    return { url: `/uploads/exercises/${filename}`, fileSize: info.size };
  }

  /**
   * Store an exercise media item coming from an import archive.
   * Images are re-encoded with sharp, videos must be real MP4 files.
   */
  async writeExerciseMediaFromBuffer(
    buffer: Buffer,
  ): Promise<{ url: string; type: 'image' | 'video' }> {
    return this.writeExerciseMedia(buffer);
  }

  /**
   * Delete an uploaded file. Silently ignores URLs that are not valid
   * upload paths (never deletes anything outside the uploads directory).
   */
  async deleteImage(imageUrl: string | null | undefined): Promise<void> {
    const filepath = this.resolveUploadPath(imageUrl);
    if (!filepath) return;

    try {
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
    const filename = this.randomName('webp');
    const filepath = path.join(this.progressPhotosDir, filename);

    await this.toWebp(file.buffer, 1080, 1920, 'inside', 85, filepath);

    return `/uploads/progress-photos/${filename}`;
  }

  /**
   * Validate uploaded file (images only)
   */
  validateImageFile(file: Express.Multer.File): {
    valid: boolean;
    error?: string;
  } {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ];

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    const detected = this.detectFileType(file.buffer);
    if (
      !allowedMimeTypes.includes(file.mimetype) ||
      !detected ||
      detected === 'mp4'
    ) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
      };
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
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

    const detected = this.detectFileType(file.buffer);
    const isVideoMime = file.mimetype === 'video/mp4';
    if (
      !allowedMimeTypes.includes(file.mimetype) ||
      !detected ||
      isVideoMime !== (detected === 'mp4')
    ) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and MP4 are allowed',
      };
    }

    const maxSize = isVideoMime
      ? MAX_MEDIA_UPLOAD_BYTES
      : MAX_IMAGE_UPLOAD_BYTES;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
      };
    }

    return { valid: true };
  }
}
