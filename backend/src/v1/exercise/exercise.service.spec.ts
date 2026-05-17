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

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { Exercise, ExerciseType } from './exercise.entity';
import { ExerciseMedia } from './exerciseMedia.entity';
import { MuscleGroupService } from '../muscleGroup/muscleGroup.service';
import { UploadService } from '../upload/upload.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 1,
    title: { default: 'Bench Press' },
    descriptionI18n: undefined,
    isGlobal: false,
    personalizedFromGlobalId: undefined,
    personalizedAt: undefined,
    image: undefined as any,
    exerciseType: ExerciseType.COMPOUND,
    equipmentI18n: undefined,
    instructionsI18n: undefined,
    proTipsI18n: undefined,
    mistakesI18n: undefined,
    createdBy: { id: 1 } as any,
    primaryMuscleGroups: [],
    muscleGroups: [],
    media: [],
    createdAt: new Date('2026-01-01'),
    deletedAt: undefined,
    ...overrides,
  } as Exercise;
}

function makeGlobalExercise(overrides: Partial<Exercise> = {}): Exercise {
  return makeExercise({
    id: 100,
    title: { default: 'Pull-up', eng: 'Pull-up', swe: 'Chins' },
    isGlobal: true,
    createdBy: null,
    ...overrides,
  });
}

function makeMockManager(affectedUsers: { userId: number }[] = [], copyId = 200) {
  return {
    query: jest.fn()
      .mockResolvedValueOnce(affectedUsers)
      .mockResolvedValue(undefined),
    create: jest.fn((_entity: any, data: any) => ({ ...data })),
    save: jest.fn((_entity: any, data: any) => Promise.resolve({ ...data, id: copyId++ })),
    softRemove: jest.fn().mockResolvedValue(undefined),
    findOne: jest.fn(),
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('ExerciseService', () => {
  let service: ExerciseService;
  let exerciseRepo: jest.Mocked<any>;
  let mediaRepo: jest.Mocked<any>;
  let muscleGroupService: jest.Mocked<Pick<MuscleGroupService, 'findByIds'>>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    exerciseRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((_data: any) => ({ ..._data })),
      save: jest.fn((e: any) => Promise.resolve({ ...e, id: e.id ?? 99 })),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };

    mediaRepo = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => data),
      save: jest.fn((m: any) => Promise.resolve(m)),
      remove: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };

    muscleGroupService = { findByIds: jest.fn().mockResolvedValue([]) };

    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseService,
        { provide: getRepositoryToken(Exercise), useValue: exerciseRepo },
        { provide: getRepositoryToken(ExerciseMedia), useValue: mediaRepo },
        { provide: MuscleGroupService, useValue: muscleGroupService },
        { provide: UploadService, useValue: { deleteImage: jest.fn() } },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ExerciseService>(ExerciseService);
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('filter=mine returns only user exercises', async () => {
      exerciseRepo.find.mockResolvedValue([makeExercise()]);

      const result = await service.findAll(1, 'mine');

      expect(exerciseRepo.find).toHaveBeenCalledTimes(1);
      expect(exerciseRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { createdBy: { id: 1 }, isGlobal: false } }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].isGlobal).toBe(false);
    });

    it('filter=global returns only global exercises', async () => {
      exerciseRepo.find.mockResolvedValue([makeGlobalExercise()]);

      const result = await service.findAll(1, 'global');

      expect(exerciseRepo.find).toHaveBeenCalledTimes(1);
      expect(exerciseRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isGlobal: true } }),
      );
      expect(result[0].isGlobal).toBe(true);
    });

    it('filter=all returns user exercises first, then globals', async () => {
      const userEx = makeExercise({ id: 1 });
      const globalEx = makeGlobalExercise({ id: 100 });
      exerciseRepo.find
        .mockResolvedValueOnce([userEx])
        .mockResolvedValueOnce([globalEx]);

      const result = await service.findAll(1, 'all');

      expect(exerciseRepo.find).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(100);
    });

    it('default filter is all (makes two parallel repo calls)', async () => {
      exerciseRepo.find.mockResolvedValue([]);

      await service.findAll(1);

      expect(exerciseRepo.find).toHaveBeenCalledTimes(2);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns exercise owned by user', async () => {
      exerciseRepo.findOne.mockResolvedValue(makeExercise());

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
      expect(result.title).toEqual({ default: 'Bench Press' });
    });

    it('returns global exercise regardless of userId', async () => {
      exerciseRepo.findOne.mockResolvedValue(makeGlobalExercise());

      const result = await service.findOne(100, 999);

      expect(result.isGlobal).toBe(true);
    });

    it('queries with [user-owned OR global] where conditions', async () => {
      exerciseRepo.findOne.mockResolvedValue(makeExercise());

      await service.findOne(1, 42);

      expect(exerciseRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { id: 1, createdBy: { id: 42 } },
            { id: 1, isGlobal: true },
          ],
        }),
      );
    });

    it('throws NotFoundException when no exercise matches', async () => {
      exerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('returns soft-deleted exercise (withDeleted: true)', async () => {
      exerciseRepo.findOne.mockResolvedValue(
        makeExercise({ deletedAt: new Date('2026-04-01') }),
      );

      const result = await service.findOne(1, 1);

      expect(result.deletedAt).toEqual(new Date('2026-04-01'));
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    beforeEach(() => {
      exerciseRepo.save.mockResolvedValue(makeExercise({ id: 5 }));
      exerciseRepo.findOne.mockResolvedValue(makeExercise({ id: 5 }));
    });

    it('wraps string name into title.default', async () => {
      await service.create({ name: 'Squat' } as any, 1);

      expect(exerciseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: { default: 'Squat' }, isGlobal: false }),
      );
    });

    it('wraps optional description into descriptionI18n.default', async () => {
      await service.create({ name: 'Squat', description: 'Leg exercise' } as any, 1);

      expect(exerciseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ descriptionI18n: { default: 'Leg exercise' } }),
      );
    });

    it('sets createdBy to the userId', async () => {
      await service.create({ name: 'Deadlift' } as any, 42);

      expect(exerciseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: { id: 42 } }),
      );
    });

    it('omits descriptionI18n when no description provided', async () => {
      await service.create({ name: 'Plank' } as any, 1);

      const callArg = exerciseRepo.create.mock.calls[0][0];
      expect(callArg.descriptionI18n).toBeUndefined();
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates title.default when name is provided', async () => {
      const existing = makeExercise({ title: { default: 'Old Name' } });
      exerciseRepo.findOne.mockResolvedValue(existing);
      exerciseRepo.save.mockResolvedValue({ ...existing, title: { default: 'New Name' } });

      await service.update(1, { name: 'New Name' } as any, 1);

      expect(exerciseRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, createdBy: { id: 1 }, isGlobal: false },
        }),
      );
      expect(existing.title.default).toBe('New Name');
    });

    it('throws NotFoundException for global exercises (isGlobal:false guard)', async () => {
      exerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.update(100, { name: 'X' } as any, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when exercise belongs to another user', async () => {
      exerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.update(1, {} as any, 99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('soft-deletes the user-owned exercise', async () => {
      const ex = makeExercise();
      exerciseRepo.findOne.mockResolvedValue(ex);

      const result = await service.remove(1, 1);

      expect(exerciseRepo.softRemove).toHaveBeenCalledWith(ex);
      expect(result).toEqual({ message: 'Exercise deleted' });
    });

    it('throws NotFoundException for global exercises (isGlobal:false guard)', async () => {
      exerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(100, 1)).rejects.toThrow(NotFoundException);
    });

    it('does NOT hard-delete — only softRemove', async () => {
      const ex = makeExercise();
      exerciseRepo.findOne.mockResolvedValue(ex);
      const removeSpy = jest.spyOn(exerciseRepo, 'softRemove');

      await service.remove(1, 1);

      expect(removeSpy).toHaveBeenCalled();
      expect(exerciseRepo['delete']).toBeUndefined();
    });
  });

  // ── deleteGlobal ──────────────────────────────────────────────────────────

  describe('deleteGlobal', () => {
    it('throws NotFoundException when global exercise does not exist', async () => {
      exerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteGlobal(999)).rejects.toThrow(NotFoundException);
    });

    it('soft-deletes global exercise — never hard-deletes', async () => {
      const globalEx = makeGlobalExercise({ id: 100 });
      exerciseRepo.findOne.mockResolvedValue(globalEx);

      const manager = makeMockManager([]);
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      await service.deleteGlobal(100);

      expect(manager.softRemove).toHaveBeenCalledWith(Exercise, globalEx);
    });

    it('skips copy creation when no users have data on the exercise', async () => {
      const globalEx = makeGlobalExercise({ id: 100 });
      exerciseRepo.findOne.mockResolvedValue(globalEx);

      const manager = makeMockManager([]); // no affected users
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      await service.deleteGlobal(100);

      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.softRemove).toHaveBeenCalledWith(Exercise, globalEx);
    });

    it('creates a personalized copy for each affected user', async () => {
      const globalEx = makeGlobalExercise({ id: 100 });
      exerciseRepo.findOne.mockResolvedValue(globalEx);

      const manager = makeMockManager([{ userId: 1 }, { userId: 2 }]);
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      await service.deleteGlobal(100);

      expect(manager.create).toHaveBeenCalledTimes(2);
      expect(manager.save).toHaveBeenCalledTimes(2);
      expect(manager.create).toHaveBeenCalledWith(
        Exercise,
        expect.objectContaining({
          isGlobal: false,
          personalizedFromGlobalId: 100,
          personalizedAt: expect.any(Date),
          title: globalEx.title,
        }),
      );
    });

    it('copies all translation fields from the global onto the user copy', async () => {
      const globalEx = makeGlobalExercise({
        id: 100,
        title: { default: 'Pull-up', eng: 'Pull-up', swe: 'Chins' },
        descriptionI18n: { default: 'Back exercise', swe: 'Ryggrörsel' },
        instructionsI18n: { default: ['Grip bar', 'Pull up'] },
      });
      exerciseRepo.findOne.mockResolvedValue(globalEx);

      const manager = makeMockManager([{ userId: 5 }]);
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      await service.deleteGlobal(100);

      expect(manager.create).toHaveBeenCalledWith(
        Exercise,
        expect.objectContaining({
          title: globalEx.title,
          descriptionI18n: globalEx.descriptionI18n,
          instructionsI18n: globalEx.instructionsI18n,
        }),
      );
    });

    it('updates FK refs in session_exercise, exercise_record, workout_exercise for each user', async () => {
      const globalEx = makeGlobalExercise({ id: 100 });
      exerciseRepo.findOne.mockResolvedValue(globalEx);

      let savedId = 200;
      const manager = {
        query: jest.fn()
          .mockResolvedValueOnce([{ userId: 7 }])
          .mockResolvedValue(undefined),
        create: jest.fn((_e: any, data: any) => data),
        save: jest.fn((_e: any, data: any) => Promise.resolve({ ...data, id: savedId++ })),
        softRemove: jest.fn().mockResolvedValue(undefined),
      };
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      await service.deleteGlobal(100);

      // query calls: 1 (affected users) + 3 (FK updates for user 7) = 4
      expect(manager.query).toHaveBeenCalledTimes(4);

      // All FK updates pass [newCopyId=200, globalId=100, userId=7]
      const fkCalls = manager.query.mock.calls.slice(1);
      fkCalls.forEach((call: any[]) => {
        expect(call[1]).toEqual([200, 100, 7]);
      });
    });

    it('returns a success message', async () => {
      const globalEx = makeGlobalExercise({ id: 100 });
      exerciseRepo.findOne.mockResolvedValue(globalEx);

      const manager = makeMockManager([]);
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      const result = await service.deleteGlobal(100);

      expect(result.message).toBeTruthy();
    });
  });

  // ── duplicateGlobalExercise ───────────────────────────────────────────────

  describe('duplicateGlobalExercise', () => {
    function makeManagerForDuplicate(copyId = 200, globalEx: Exercise) {
      const fullCopy = {
        ...globalEx,
        id: copyId,
        isGlobal: false,
        personalizedFromGlobalId: globalEx.id,
        createdBy: { id: 1 },
      };
      return {
        create: jest.fn((_e: any, data: any) => data),
        save: jest.fn((_e: any, data: any) => Promise.resolve({ ...data, id: copyId })),
        query: jest.fn().mockResolvedValue(undefined),
        findOne: jest.fn().mockResolvedValue(fullCopy),
      };
    }

    it('throws NotFoundException when global exercise does not exist', async () => {
      exerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.duplicateGlobalExercise(999, 1, false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates a personal copy with isGlobal=false and personalization metadata', async () => {
      const globalEx = makeGlobalExercise({ id: 100 });
      exerciseRepo.findOne.mockResolvedValue(globalEx);

      const manager = makeManagerForDuplicate(200, globalEx);
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      const result = await service.duplicateGlobalExercise(100, 1, false);

      expect(manager.create).toHaveBeenCalledWith(
        Exercise,
        expect.objectContaining({
          isGlobal: false,
          createdBy: { id: 1 },
          personalizedFromGlobalId: 100,
          personalizedAt: expect.any(Date),
          title: globalEx.title,
        }),
      );
      expect(result.isGlobal).toBe(false);
      expect(result.personalizedFromGlobalId).toBe(100);
    });

    it('does NOT run any FK-update queries when transferStats=false', async () => {
      const globalEx = makeGlobalExercise({ id: 100 });
      exerciseRepo.findOne.mockResolvedValue(globalEx);

      const manager = makeManagerForDuplicate(200, globalEx);
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      await service.duplicateGlobalExercise(100, 1, false);

      expect(manager.query).not.toHaveBeenCalled();
    });

    it('runs FK-update queries for all 3 tables when transferStats=true', async () => {
      const globalEx = makeGlobalExercise({ id: 100 });
      exerciseRepo.findOne.mockResolvedValue(globalEx);

      const manager = makeManagerForDuplicate(200, globalEx);
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      await service.duplicateGlobalExercise(100, 1, true);

      expect(manager.query).toHaveBeenCalledTimes(3);
      manager.query.mock.calls.forEach((call: any[]) => {
        expect(call[1]).toEqual([200, 100, 1]); // [newCopyId, globalId, userId]
      });
    });

    it('copies all i18n translation fields from global source', async () => {
      const globalEx = makeGlobalExercise({
        id: 100,
        title: { default: 'Pull-up', eng: 'Pull-up', swe: 'Chins' },
        instructionsI18n: { default: ['Grab bar'], swe: ['Tag tag'] },
        proTipsI18n: { default: ['Keep core tight'] },
        mistakesI18n: { default: ['Kipping'] },
      });
      exerciseRepo.findOne.mockResolvedValue(globalEx);

      const manager = makeManagerForDuplicate(200, globalEx);
      dataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      await service.duplicateGlobalExercise(100, 5, false);

      expect(manager.create).toHaveBeenCalledWith(
        Exercise,
        expect.objectContaining({
          instructionsI18n: globalEx.instructionsI18n,
          proTipsI18n: globalEx.proTipsI18n,
          mistakesI18n: globalEx.mistakesI18n,
        }),
      );
    });
  });

  // ── serialization: I18nString fields don't crash ──────────────────────────

  describe('toResponseDto (I18nString serialization)', () => {
    it('maps multilingual title correctly', async () => {
      exerciseRepo.findOne.mockResolvedValue(
        makeExercise({
          title: { default: 'Bench Press', eng: 'Bench Press', swe: 'Bänkpress' },
        }),
      );

      const result = await service.findOne(1, 1);

      expect(result.title).toEqual({
        default: 'Bench Press',
        eng: 'Bench Press',
        swe: 'Bänkpress',
      });
    });

    it('maps I18nStringArray fields (instructions, proTips, mistakes)', async () => {
      exerciseRepo.findOne.mockResolvedValue(
        makeExercise({
          instructionsI18n: { default: ['Step 1', 'Step 2'], swe: ['Steg 1', 'Steg 2'] },
          proTipsI18n: { default: ['Keep core tight'] },
          mistakesI18n: { default: ['Flared elbows'] },
        }),
      );

      const result = await service.findOne(1, 1);

      expect(result.instructions).toEqual({
        default: ['Step 1', 'Step 2'],
        swe: ['Steg 1', 'Steg 2'],
      });
      expect(result.proTips).toEqual({ default: ['Keep core tight'] });
      expect(result.mistakes).toEqual({ default: ['Flared elbows'] });
    });

    it('handles migrated legacy exercise with only title.default (no optional fields)', async () => {
      exerciseRepo.findOne.mockResolvedValue(
        makeExercise({
          title: { default: 'Squat' },
          descriptionI18n: undefined,
          instructionsI18n: undefined,
          proTipsI18n: undefined,
          mistakesI18n: undefined,
          equipmentI18n: undefined,
        }),
      );

      const result = await service.findOne(1, 1);

      expect(result.title).toEqual({ default: 'Squat' });
      expect(result.description).toBeUndefined();
      expect(result.instructions).toBeUndefined();
      expect(result.proTips).toBeUndefined();
      expect(result.mistakes).toBeUndefined();
      expect(result.equipment).toEqual([]);
      expect(result.equipmentI18n).toBeUndefined();
    });

    it('does not crash when exercise has a deletedAt timestamp (old session data)', async () => {
      exerciseRepo.findOne.mockResolvedValue(
        makeExercise({
          title: { default: 'Overhead Press' },
          deletedAt: new Date('2026-03-15'),
        }),
      );

      const result = await service.findOne(1, 1);

      expect(result.title).toEqual({ default: 'Overhead Press' });
      expect(result.deletedAt).toEqual(new Date('2026-03-15'));
    });

    it('defaults equipment to empty array when equipmentI18n is null/undefined', async () => {
      exerciseRepo.findOne.mockResolvedValue(
        makeExercise({ equipmentI18n: undefined }),
      );

      const result = await service.findOne(1, 1);

      expect(result.equipment).toEqual([]);
    });
  });

  // ── createGlobal / updateGlobal ───────────────────────────────────────────

  describe('createGlobal', () => {
    it('creates with isGlobal=true and createdBy=null', async () => {
      const saved = makeGlobalExercise({ id: 101 });
      exerciseRepo.save.mockResolvedValue(saved);
      exerciseRepo.findOne.mockResolvedValue(saved);

      await service.createGlobal({
        title: { default: 'New Global' },
      } as any);

      expect(exerciseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isGlobal: true, createdBy: null }),
      );
    });
  });

  describe('updateGlobal', () => {
    it('throws NotFoundException when global exercise does not exist', async () => {
      exerciseRepo.findOne.mockResolvedValue(null);

      await expect(service.updateGlobal(999, { title: { default: 'X' } } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('queries with isGlobal=true filter', async () => {
      const globalEx = makeGlobalExercise();
      exerciseRepo.findOne.mockResolvedValue(globalEx);
      exerciseRepo.save.mockResolvedValue(globalEx);

      await service.updateGlobal(100, { title: { default: 'Updated' } } as any);

      expect(exerciseRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 100, isGlobal: true } }),
      );
    });
  });
});
