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

import { CURRENT_TERMS_VERSION } from './constants';

interface ConsentFields {
  termsAcceptedAt?: Date | null;
  termsVersion?: string | null;
  healthDataConsentAt?: Date | null;
}

/**
 * A user must (re-)accept the terms when they were never accepted or the
 * accepted version is outdated. Health data consent is deliberately NOT part
 * of this: it is voluntary (GDPR art. 7(4)) and checked separately.
 */
export function isConsentRequired(user: ConsentFields): boolean {
  return !user.termsAcceptedAt || user.termsVersion !== CURRENT_TERMS_VERSION;
}

/** Explicit consent to processing of health data (GDPR art. 9(2)(a)). */
export function hasHealthDataConsent(user: ConsentFields): boolean {
  return !!user.healthDataConsentAt;
}
