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

import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  const service = new UploadService();

  describe('resolveUploadPath', () => {
    it('accepts generated upload URLs', () => {
      const url = '/uploads/avatars/0123456789abcdef0123456789abcdef.webp';
      expect(service.resolveUploadPath(url)).toMatch(
        /uploads\/avatars\/0123456789abcdef0123456789abcdef\.webp$/,
      );
    });

    it.each([
      '/uploads/../package.json',
      '/uploads/avatars/../../.env',
      '../../etc/passwd',
      '/etc/passwd',
      '/uploads/avatars/%2e%2e/secret.webp',
      '/uploads/other/0123456789abcdef0123456789abcdef.webp',
      '/uploads/avatars/0123456789abcdef0123456789abcdef.webp/../x',
      '',
    ])('rejects %p', (url) => {
      expect(service.resolveUploadPath(url)).toBeNull();
    });
  });

  describe('detectFileType', () => {
    it('detects real image and video signatures', () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(12).fill(0)]);
      const png = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
      ]);
      const webp = Buffer.concat([
        Buffer.from('RIFF'),
        Buffer.alloc(4),
        Buffer.from('WEBPVP8 '),
      ]);
      const mp4 = Buffer.concat([
        Buffer.alloc(4),
        Buffer.from('ftypisom'),
        Buffer.alloc(4),
      ]);
      expect(service.detectFileType(jpeg)).toBe('jpeg');
      expect(service.detectFileType(png)).toBe('png');
      expect(service.detectFileType(webp)).toBe('webp');
      expect(service.detectFileType(mp4)).toBe('mp4');
    });

    it('rejects spoofed files', () => {
      const html = Buffer.from('<html><script>alert(1)</script></html>');
      expect(service.detectFileType(html)).toBeNull();
      expect(
        service.validateImageFile({
          mimetype: 'image/png',
          buffer: html,
          size: html.length,
        } as any).valid,
      ).toBe(false);
      expect(
        service.validateMediaFile({
          mimetype: 'video/mp4',
          buffer: html,
          size: html.length,
        } as any).valid,
      ).toBe(false);
    });
  });

  it('only downloads OAuth avatars from allowed hosts', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    await expect(
      service.processAvatarFromUrl('https://evil.example.com/a.png'),
    ).resolves.toBeNull();
    await expect(
      service.processAvatarFromUrl('http://avatars.githubusercontent.com/u/1'),
    ).resolves.toBeNull();
    await expect(
      service.processAvatarFromUrl('https://169.254.169.254/latest/meta-data'),
    ).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('rejects corrupt images with 400 instead of 500', async () => {
    // Valid JPEG magic bytes (passes validateImageFile) followed by garbage
    const corrupt = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.from('this is not really a jpeg image'),
    ]);
    const file = { buffer: corrupt } as Express.Multer.File;

    await expect(service.processAvatarImage(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.processProgressPhoto(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.processExerciseImage(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  }, 30000);
});
