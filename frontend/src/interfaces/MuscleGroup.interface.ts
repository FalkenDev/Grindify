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

import type { I18nString } from './i18n.types'

export interface MuscleGroup {
  id: number
  name: string
  nameI18n?: I18nString
  descriptionI18n?: I18nString
  createdAt: string
  updatedAt: string
}
