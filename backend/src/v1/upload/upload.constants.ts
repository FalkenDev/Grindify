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

import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/**
 * Sub-directories of `uploads/` that are served statically (each under its own
 * `/uploads/<dir>/` prefix, sub-folders included). Everything else — notably
 * `progress-photos` (health data) — is never reachable through a static root
 * and only served by authenticated endpoints.
 */
export const PUBLIC_UPLOAD_DIRS = ['avatars', 'exercises'] as const;

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_MEDIA_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB (video)
export const MAX_ZIP_IMPORT_BYTES = 100 * 1024 * 1024; // 100MB
export const MAX_JSON_IMPORT_BYTES = 5 * 1024 * 1024; // 5MB

const baseLimits = { files: 1, fields: 20, parts: 25, fieldSize: 64 * 1024 };

/** Multer options for single image uploads (avatar, progress photo, exercise image). */
export const IMAGE_UPLOAD_OPTIONS: MulterOptions = {
  limits: { ...baseLimits, fileSize: MAX_IMAGE_UPLOAD_BYTES },
};

/** Multer options for exercise media (image or mp4 video). */
export const MEDIA_UPLOAD_OPTIONS: MulterOptions = {
  limits: { ...baseLimits, fileSize: MAX_MEDIA_UPLOAD_BYTES },
};

/** Multer options for admin ZIP imports. */
export const ZIP_IMPORT_OPTIONS: MulterOptions = {
  limits: { ...baseLimits, fileSize: MAX_ZIP_IMPORT_BYTES },
};

/** Multer options for admin JSON imports. */
export const JSON_IMPORT_OPTIONS: MulterOptions = {
  limits: { ...baseLimits, fileSize: MAX_JSON_IMPORT_BYTES },
};
