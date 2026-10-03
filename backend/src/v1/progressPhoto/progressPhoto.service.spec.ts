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
import { NotFoundException } from '@nestjs/common';
import { ProgressPhotoService } from './progressPhoto.service';
import { ProgressPhoto } from './progressPhoto.entity';
import { User } from '../user/user.entity';
import { UploadService } from '../upload/upload.service';

const USER_A = 1;
const USER_B = 2;
const PHOTO_OF_B = {
  id: 3,
  photoUrl: '/uploads/progress-photos/0123456789abcdef0123456789abcdef.webp',
  date: '2026-09-01',
  poseTag: 'front',
  notes: null,
  createdAt: new Date(),
  user: { id: USER_B, email: 'b@example.com', role: 'user' },
};

describe('ProgressPhotoService access control (user A vs user B)', () => {
  let service: ProgressPhotoService;
  let photoRepo: any;
  let uploadService: any;

  beforeEach(async () => {
    photoRepo = {
      findOne: jest.fn(async ({ where }: any) =>
        where.id === PHOTO_OF_B.id && where.user?.id === USER_B
          ? PHOTO_OF_B
          : null,
      ),
      find: jest.fn(async () => [PHOTO_OF_B]),
      remove: jest.fn(),
    };
    uploadService = new UploadService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressPhotoService,
        { provide: getRepositoryToken(ProgressPhoto), useValue: photoRepo },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: UploadService, useValue: uploadService },
      ],
    }).compile();

    service = module.get(ProgressPhotoService);
  });

  it("user A gets 404 (not 403) for user B's photo file", async () => {
    await expect(service.getFilePath(USER_A, 3)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("user A gets 404 when deleting user B's photo", async () => {
    await expect(service.delete(USER_A, 3)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(photoRepo.remove).not.toHaveBeenCalled();
  });

  it('owner gets a path inside the uploads directory', async () => {
    const path = await service.getFilePath(USER_B, 3);
    expect(path).toContain('/uploads/progress-photos/');
  });

  it('never exposes the user object or the static path', async () => {
    const [photo] = await service.findAll(USER_B);
    expect(photo).not.toHaveProperty('user');
    expect(photo.photoUrl).toBe('/v1/progress-photos/3/file');
  });
});
