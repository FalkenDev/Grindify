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

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { activitiesToSeed } from '../seed/data/activities.data';

@Injectable()
export class ActivitySeedService implements OnModuleInit {
  private readonly logger = new Logger(ActivitySeedService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  /**
   * Seeds the global activity catalog on application start if none exist yet.
   * Global activities are shared across all users and managed via the admin panel.
   */
  async onModuleInit(): Promise<void> {
    await this.seedGlobalActivities();
  }

  async seedGlobalActivities(): Promise<void> {
    const existing = await this.activityRepo.count({ where: { isGlobal: true } });
    if (existing > 0) return;

    this.logger.log('No global activities found – seeding defaults…');

    const activities: Activity[] = [];

    for (const def of activitiesToSeed) {
      const activity = this.activityRepo.create({
        title: {
          default: def.name,
          eng: def.name,
          swe: def.swedenName ?? def.name,
        },
        descriptionI18n: def.description
          ? {
              default: def.description,
              eng: def.description,
              swe: def.swedenDescription ?? def.description,
            }
          : undefined,
        isGlobal: true,
        createdBy: null,
        icon: def.icon,
        trackDistance: def.trackDistance,
        trackPace: def.trackPace,
        trackElevation: def.trackElevation,
        trackCalories: def.trackCalories,
      });

      activities.push(activity);
    }

    await this.activityRepo.save(activities);
    this.logger.log(`Seeded ${activities.length} global activity(s)`);
  }
}
