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

import type { RouteLocationNormalizedLoaded } from 'vue-router'
import i18n from '@/plugins/i18n'

const APP_NAME = 'Grindify'

/** Set document.title from the route's meta.title (an i18n key): "Page – Grindify". */
export const updateDocumentTitle = (route: RouteLocationNormalizedLoaded) => {
  const titleKey = [...route.matched].reverse().find(record => record.meta.title)?.meta.title
  const pageTitle = typeof titleKey === 'string' ? i18n.global.t(titleKey) : ''
  document.title = pageTitle ? `${pageTitle} – ${APP_NAME}` : APP_NAME
}
