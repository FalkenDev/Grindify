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

import { ActivityIcon } from '../../activity/activity.entity';

export interface ActivitySeedDef {
  name: string;
  swedenName?: string;
  description?: string;
  swedenDescription?: string;
  icon: ActivityIcon;
  trackDistance: boolean;
  trackPace: boolean;
  trackElevation: boolean;
  trackCalories: boolean;
}

export const activitiesToSeed: ActivitySeedDef[] = [
  {
    name: 'Running',
    swedenName: 'Löpning',
    description: 'Outdoor running sessions',
    swedenDescription: 'Utomhuslöpning',
    icon: ActivityIcon.RUNNING,
    trackDistance: true,
    trackPace: true,
    trackElevation: true,
    trackCalories: true,
  },
  {
    name: 'Walking',
    swedenName: 'Promenad',
    description: 'Walking and hiking',
    swedenDescription: 'Promenader och vandring',
    icon: ActivityIcon.WALKING,
    trackDistance: true,
    trackPace: true,
    trackElevation: true,
    trackCalories: true,
  },
  {
    name: 'Cycling',
    swedenName: 'Cykling',
    description: 'Road and mountain biking',
    swedenDescription: 'Landsvägscykling och mountainbike',
    icon: ActivityIcon.CYCLING,
    trackDistance: true,
    trackPace: false,
    trackElevation: true,
    trackCalories: true,
  },
  {
    name: 'Floorball',
    swedenName: 'Innebandy',
    description: 'Floorball training and matches',
    swedenDescription: 'Innebandyträning och matcher',
    icon: ActivityIcon.OTHER,
    trackDistance: false,
    trackPace: false,
    trackElevation: false,
    trackCalories: true,
  },
  {
    name: 'Football',
    swedenName: 'Fotboll',
    description: 'Football training and matches',
    swedenDescription: 'Fotbollsträning och matcher',
    icon: ActivityIcon.FOOTBALL,
    trackDistance: false,
    trackPace: false,
    trackElevation: false,
    trackCalories: true,
  },
  {
    name: 'Swimming',
    swedenName: 'Simning',
    description: 'Swimming sessions',
    swedenDescription: 'Simträning',
    icon: ActivityIcon.SWIMMING,
    trackDistance: true,
    trackPace: false,
    trackElevation: false,
    trackCalories: true,
  },
  {
    name: 'Kayaking',
    swedenName: 'Kajakpaddling',
    description: 'Kayaking and canoeing',
    swedenDescription: 'Kajak och kanot',
    icon: ActivityIcon.KAYAKING,
    trackDistance: true,
    trackPace: false,
    trackElevation: false,
    trackCalories: true,
  },
];
