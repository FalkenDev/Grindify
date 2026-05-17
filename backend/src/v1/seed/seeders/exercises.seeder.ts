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

import { DataSource } from 'typeorm';
import { Exercise } from '../../exercise/exercise.entity';
import { MuscleGroup } from '../../muscleGroup/muscleGroup.entity';
import { User } from '../../user/user.entity';
import { exercisesToSeed } from '../data/exercises.data';

export async function seedUserExercises(
  dataSource: DataSource,
  mgMap: Map<string, MuscleGroup>,
  user: User,
): Promise<void> {
  const exerciseRepo = dataSource.getRepository(Exercise);

  for (const ex of exercisesToSeed) {
    const primaryMuscleGroupName = ex.primaryMuscleGroup ?? ex.muscleGroups[0];
    const primaryMuscleGroup = primaryMuscleGroupName
      ? mgMap.get(primaryMuscleGroupName)
      : undefined;

    const exercise = exerciseRepo.create({
      title: { default: ex.defaultName },
      descriptionI18n: { default: ex.defaultDescription ?? '' },
      exerciseType: ex.exerciseType,
      equipmentI18n: ex.equipment ? { default: ex.equipment } : undefined,
      instructionsI18n: ex.instructions ? { default: ex.instructions } : undefined,
      proTipsI18n: ex.proTips ? { default: ex.proTips } : undefined,
      mistakesI18n: ex.mistakes ? { default: ex.mistakes } : undefined,
      createdBy: user,
      primaryMuscleGroups: [primaryMuscleGroup].filter(
        (mg): mg is MuscleGroup => !!mg,
      ),
      muscleGroups: ex.muscleGroups
        .map((name) => mgMap.get(name))
        .filter((mg): mg is MuscleGroup => !!mg),
    });
    await exerciseRepo.save(exercise);
  }

  console.log(
    `💪 Seeded ${exercisesToSeed.length} exercise(s) for user ${user.email}`,
  );
}
