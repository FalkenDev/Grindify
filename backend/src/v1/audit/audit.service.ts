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

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Request } from 'express';
import { AuditLog } from './auditLog.entity';
import { getRequestMeta } from '../common/requestMeta.util';

export interface AuditActor {
  id?: number | string | null;
  email?: string | null;
}

export interface AuditEntry {
  action: string;
  actor?: AuditActor | null;
  targetType?: string | null;
  targetId?: number | string | null;
  metadata?: Record<string, unknown> | null;
  req?: Request;
}

// Keys that must never end up in the audit log, whatever the caller passes.
const FORBIDDEN_METADATA_KEYS = [
  'password',
  'currentpassword',
  'newpassword',
  'token',
  'code',
  'secret',
  'cookie',
  'authorization',
];

function sanitizeMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!metadata) return null;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.some((k) => key.toLowerCase().includes(k))) {
      continue;
    }
    out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days audit entries are kept (AUDIT_LOG_RETENTION_DAYS, default 90). Shown in the privacy policy. */
const retentionDays = (): number => {
  const n = Number.parseInt(process.env.AUDIT_LOG_RETENTION_DAYS ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : 90;
};

@Injectable()
export class AuditService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditService.name);
  private purgeTimer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  onModuleInit(): void {
    void this.purgeExpired();
    this.purgeTimer = setInterval(() => void this.purgeExpired(), DAY_MS);
    this.purgeTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.purgeTimer) clearInterval(this.purgeTimer);
  }

  /** Delete entries older than the retention period. Never throws. */
  async purgeExpired(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - retentionDays() * DAY_MS);
      const { affected } = await this.auditRepo.delete({
        createdAt: LessThan(cutoff),
      });
      if (affected)
        this.logger.log(`Purged ${affected} expired audit log entries`);
    } catch (error) {
      this.logger.error(
        `Failed to purge audit log: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Record an audit event. Never throws — auditing must not break the
   * request that triggered it.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      const meta = getRequestMeta(entry.req);
      const actorId =
        entry.actor?.id !== undefined && entry.actor?.id !== null
          ? Number(entry.actor.id)
          : null;
      await this.auditRepo.insert({
        action: entry.action.slice(0, 64),
        actorId: Number.isFinite(actorId) ? actorId : null,
        actorEmail: entry.actor?.email?.slice(0, 255) ?? null,
        targetType: entry.targetType?.slice(0, 64) ?? null,
        targetId:
          entry.targetId !== undefined && entry.targetId !== null
            ? String(entry.targetId).slice(0, 64)
            : null,
        ip: meta.ip?.slice(0, 64) ?? null,
        userAgent: meta.userAgent,
        metadata: sanitizeMetadata(entry.metadata) as any,
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log entry "${entry.action}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async list(params: {
    page: number;
    limit: number;
    action?: string;
    actorId?: number;
  }) {
    const qb = this.auditRepo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .addOrderBy('log.id', 'DESC')
      .skip((params.page - 1) * params.limit)
      .take(params.limit);

    if (params.action) {
      // Support prefix filtering, e.g. "admin." or "auth."
      if (params.action.endsWith('.') || params.action.endsWith('*')) {
        qb.andWhere('log.action LIKE :action', {
          action: `${params.action.replace(/\*$/, '').replace(/[%_]/g, '\\$&')}%`,
        });
      } else {
        qb.andWhere('log.action = :action', { action: params.action });
      }
    }
    if (params.actorId !== undefined) {
      qb.andWhere('log.actorId = :actorId', { actorId: params.actorId });
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((i) => ({
        id: i.id,
        createdAt: i.createdAt,
        actorId: i.actorId,
        actorEmail: i.actorEmail,
        action: i.action,
        targetType: i.targetType,
        targetId: i.targetId,
        ip: i.ip,
        userAgent: i.userAgent,
        metadata: i.metadata,
      })),
      total,
      page: params.page,
      limit: params.limit,
    };
  }
}
