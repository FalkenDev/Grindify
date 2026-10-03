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

/**
 * Operator-specific values used in the legal documents (privacy policy, terms,
 * legal notice). They are read from build-time env variables so each
 * self-hosted instance shows its own data controller. Missing values are NOT
 * replaced by fake defaults – the documents show a clear "not configured"
 * warning instead.
 */

/** Version of the terms/privacy policy. Must match CURRENT_TERMS_VERSION in the backend. */
export const LEGAL_VERSION = '1.1'
/** Date the current version took effect (ISO, YYYY-MM-DD). */
export const LEGAL_DATE = '2026-09-30'

/**
 * TODO(operator): Set how many days it takes until deleted data is gone from
 * your backups (i.e. your backup rotation period), e.g. VITE_BACKUP_RETENTION_DAYS=30.
 * Until it is set the privacy policy shows a "not configured" placeholder.
 */
const BACKUP_RETENTION_DAYS_DEFAULT = ''

/**
 * TODO(operator): Set how many days security/audit logs (IP address, user agent,
 * login events) are kept, e.g. VITE_LOG_RETENTION_DAYS=90.
 * Until it is set the privacy policy shows a "not configured" placeholder.
 */
const LOG_RETENTION_DAYS_DEFAULT = ''

const env = (value: string | undefined): string => (value || '').trim()

export const legalConfig = {
  contactEmail: env(import.meta.env.VITE_CONTACT_EMAIL),
  operatorName: env(import.meta.env.VITE_OPERATOR_NAME),
  operatorCity: env(import.meta.env.VITE_OPERATOR_CITY),
  operatorCountry: env(import.meta.env.VITE_OPERATOR_COUNTRY),
  backupRetentionDays:
    env(import.meta.env.VITE_BACKUP_RETENTION_DAYS) || BACKUP_RETENTION_DAYS_DEFAULT,
  logRetentionDays: env(import.meta.env.VITE_LOG_RETENTION_DAYS) || LOG_RETENTION_DAYS_DEFAULT,
}

export type LegalConfigKey = keyof typeof legalConfig

/** Env variable name per config key, used in the "not configured" warning. */
export const legalConfigEnvNames: Record<LegalConfigKey, string> = {
  contactEmail: 'VITE_CONTACT_EMAIL',
  operatorName: 'VITE_OPERATOR_NAME',
  operatorCity: 'VITE_OPERATOR_CITY',
  operatorCountry: 'VITE_OPERATOR_COUNTRY',
  backupRetentionDays: 'VITE_BACKUP_RETENTION_DAYS',
  logRetentionDays: 'VITE_LOG_RETENTION_DAYS',
}

export const missingLegalConfig = (keys: LegalConfigKey[]): LegalConfigKey[] =>
  keys.filter(key => !legalConfig[key])
