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

import type { I18nString, I18nStringArray, SupportedLanguage } from '@/interfaces/i18n.types'

export function resolveI18n(
  field: I18nString | null | undefined,
  lang: SupportedLanguage,
): string {
  if (!field) return ''
  if (lang !== 'default' && field[lang]) return field[lang]!
  return field.default ?? ''
}

export function resolveI18nArray(
  field: I18nStringArray | null | undefined,
  lang: SupportedLanguage,
): string[] {
  if (!field) return []
  if (lang !== 'default' && field[lang]?.length) return field[lang]!
  return field.default ?? []
}

export function displayExerciseName(
  exercise: { title: I18nString },
  lang: SupportedLanguage,
): string {
  return resolveI18n(exercise.title, lang)
}

export function displayActivityName(
  activity: { title: I18nString },
  lang: SupportedLanguage,
): string {
  return resolveI18n(activity.title, lang)
}
