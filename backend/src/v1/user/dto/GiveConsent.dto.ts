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

import { Equals, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GiveConsentDto {
  @ApiProperty({ description: 'Must be true: accepts the current terms' })
  @IsBoolean()
  @Equals(true, { message: 'You must accept the terms and conditions' })
  termsAccepted: boolean;

  @ApiProperty({
    required: false,
    description:
      'Optional: explicit consent to processing of health data (GDPR art. 9). Only recorded when true.',
  })
  @IsOptional()
  @IsBoolean()
  healthDataConsent?: boolean;
}
