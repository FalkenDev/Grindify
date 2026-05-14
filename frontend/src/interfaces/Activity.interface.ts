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

export enum ActivityIcon {
  RUNNING = 'run',
  WALKING = 'walk',
  CYCLING = 'bike',
  FOOTBALL = 'soccer',
  SWIMMING = 'swim',
  KAYAKING = 'kayaking',
  HIKING = 'hiking',
  YOGA = 'yoga',
  BOXING = 'boxing-glove',
  TENNIS = 'tennis',
  BASKETBALL = 'basketball',
  VOLLEYBALL = 'volleyball',
  SKIING = 'ski',
  SKATING = 'skate',
  ROWING = 'rowing',
  WEIGHTLIFTING = 'weight-lifter',
  GOLF = 'golf',
  RUGBY = 'rugby',
  HOCKEY = 'hockey-sticks',
  DANCE = 'dance-ballroom',
  OTHER = 'dots-horizontal',
}

export interface Activity {
  id: number
  title: I18nString
  description?: I18nString | null
  icon: ActivityIcon
  equipment?: string[]
  trackDistance: boolean
  trackPace: boolean
  trackElevation: boolean
  trackCalories: boolean
  isGlobal: boolean
  personalizedFromGlobalId?: number | null
  personalizedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateActivityDto {
  name: string
  description?: string
  icon: ActivityIcon
  equipment?: string[]
  trackDistance: boolean
  trackPace: boolean
  trackElevation: boolean
  trackCalories: boolean
}

export interface ActivityLog {
  id: number
  activity: Activity
  date: string
  duration: number // in minutes
  distance?: number // in kilometers
  pace?: string // formatted as "5:30/km"
  elevationGain?: number // in meters
  maxElevation?: number // in meters
  calories?: number
  notes?: string
  createdAt: string
}

export interface CreateActivityLogDto {
  activityId: number
  date: string // YYYY-MM-DD format
  duration: number
  distance?: number
  elevationGain?: number
  maxElevation?: number
  calories?: number
  notes?: string
  scheduledSessionId?: number
}

export interface UpdateActivityLogDto {
  date?: string
  duration?: number
  distance?: number
  elevationGain?: number
  maxElevation?: number
  calories?: number
  notes?: string
}
