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

import type { ValidationPipeOptions } from '@nestjs/common';

/** Version of the terms of service / privacy policy users must accept. */
export const CURRENT_TERMS_VERSION = '1.1';

/** Lifetime of issued JWTs. The auth cookie uses the same lifetime. */
export const JWT_EXPIRES_IN_SECONDS = 48 * 60 * 60;
export const JWT_ALGORITHM = 'HS256' as const;

/** Maximum number of wrong attempts for a verification / reset code. */
export const MAX_CODE_ATTEMPTS = 5;

/**
 * Options of the global ValidationPipe (main.ts). Shared so that DTO tests
 * validate exactly like the running API.
 */
export const VALIDATION_PIPE_OPTIONS: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
};
