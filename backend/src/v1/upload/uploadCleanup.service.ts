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
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { UploadService } from './upload.service';

/**
 * Deletes uploaded files only when no row references them any more.
 * Exercise images are shared between global exercises, the admin image
 * library and personal copies, so a file must never be deleted just because
 * one owner goes away.
 */
@Injectable()
export class UploadCleanupService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly uploadService: UploadService,
  ) {}

  async isReferenced(url: string, manager?: EntityManager): Promise<boolean> {
    const runner = manager ?? this.dataSource;
    const rows: { count: string }[] = await runner.query(
      `SELECT (
         (SELECT COUNT(*) FROM exercise WHERE image = $1) +
         (SELECT COUNT(*) FROM exercise_media WHERE url = $1) +
         (SELECT COUNT(*) FROM exercise_image WHERE url = $1) +
         (SELECT COUNT(*) FROM "user" WHERE avatar = $1) +
         (SELECT COUNT(*) FROM progress_photo WHERE "photoUrl" = $1)
       ) AS count`,
      [url],
    );
    return parseInt(rows[0]?.count ?? '0', 10) > 0;
  }

  /** Delete each file that is a valid upload path and no longer referenced. */
  async deleteIfUnreferenced(
    urls: (string | null | undefined)[],
  ): Promise<void> {
    const unique = [...new Set(urls.filter((u): u is string => !!u))];
    for (const url of unique) {
      if (!this.uploadService.isValidUploadUrl(url)) continue;
      if (await this.isReferenced(url)) continue;
      await this.uploadService.deleteImage(url);
    }
  }
}
