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

import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

function flattenErrors(errors: ValidationError[], prefix = ''): string[] {
  const out: string[] = [];
  for (const e of errors) {
    const path = prefix ? `${prefix}.${e.property}` : e.property;
    if (e.constraints) {
      out.push(...Object.values(e.constraints).map((m) => `${path}: ${m}`));
    }
    if (e.children?.length) out.push(...flattenErrors(e.children, path));
  }
  return out;
}

/**
 * Validate untrusted JSON (e.g. from an import file) against a DTO class.
 * Unknown properties are stripped; returns the typed instance or the list of
 * validation errors.
 */
export async function validatePlain<T extends object>(
  cls: new () => T,
  plain: unknown,
): Promise<{ value: T; errors: null } | { value: null; errors: string[] }> {
  if (!plain || typeof plain !== 'object' || Array.isArray(plain)) {
    return { value: null, errors: ['expected a JSON object'] };
  }
  const instance = plainToInstance(cls, plain);
  const errors = await validate(instance as object, {
    whitelist: true,
    forbidUnknownValues: true,
  });
  if (errors.length) {
    return { value: null, errors: flattenErrors(errors).slice(0, 5) };
  }
  return { value: instance, errors: null };
}
