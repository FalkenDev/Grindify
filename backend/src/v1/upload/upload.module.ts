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

import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadCleanupService } from './uploadCleanup.service';

@Module({
  providers: [UploadService, UploadCleanupService],
  exports: [UploadService, UploadCleanupService],
})
export class UploadModule {}
