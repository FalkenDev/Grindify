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

export interface I18nString {
  default: string | null;
  eng?: string;
  swe?: string;
}

export interface I18nStringArray {
  default?: string[];
  eng?: string[];
  swe?: string[];
}

export type SupportedLanguage = 'default' | 'eng' | 'swe';
