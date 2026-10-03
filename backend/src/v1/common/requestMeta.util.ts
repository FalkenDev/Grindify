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

import { Request } from 'express';
import { isIP } from 'net';

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

function isPrivateAddress(address: string | undefined): boolean {
  if (!address) return false;
  const addr = address.startsWith('::ffff:') ? address.slice(7) : address;
  if (addr === '::1' || addr.startsWith('127.')) return true;
  if (addr.startsWith('10.') || addr.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(addr)) return true;
  if (addr.startsWith('169.254.')) return true;
  const lower = addr.toLowerCase();
  return (
    lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')
  );
}

/**
 * Best-effort client IP.
 *
 * Production runs behind Cloudflare Tunnel + Traefik, where Traefik may
 * overwrite X-Forwarded-For with the tunnel's address. Cloudflare's
 * `CF-Connecting-IP` is therefore preferred, but only when the direct peer is
 * a private/loopback address (i.e. the request came through our own proxy)
 * and TRUST_CF_CONNECTING_IP is not disabled. Otherwise Express' `req.ip`
 * (which honours the `trust proxy` setting) is used.
 */
export function getClientIp(req: Request): string | null {
  const trustCf =
    (process.env.TRUST_CF_CONNECTING_IP ?? 'true').toLowerCase() !== 'false';
  if (trustCf && isPrivateAddress(req.socket?.remoteAddress)) {
    const cf = req.headers['cf-connecting-ip'];
    const value = Array.isArray(cf) ? cf[0] : cf;
    if (value && isIP(value.trim())) return value.trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? null;
}

export function getRequestMeta(req?: Request): RequestMeta {
  if (!req) return { ip: null, userAgent: null };
  const ua = req.headers?.['user-agent'];
  return {
    ip: getClientIp(req),
    userAgent: typeof ua === 'string' ? ua.slice(0, 512) : null,
  };
}
