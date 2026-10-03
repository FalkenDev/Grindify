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

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GithubRelease {
  tag_name?: string;
  name?: string;
  published_at?: string;
  body?: string;
  prerelease?: boolean;
  html_url?: string;
}

export interface ReleaseHistoryEntry {
  tagName: string;
  name: string;
  publishedAt: string | null;
  body: string;
  prerelease: boolean;
  htmlUrl: string | null;
}

export interface ReleaseHistoryResponse {
  status: 'ok' | 'unconfigured' | 'unavailable';
  source: 'github';
  repo: string | null;
  fetchedAt: string;
  latestReleaseVersion: string | null;
  releases: ReleaseHistoryEntry[];
  message: string | null;
}

const CACHE_TTL_MS = 20 * 60 * 1000; // successful responses: 20 minutes
const FAILURE_CACHE_TTL_MS = 2 * 60 * 1000; // failures: retry after 2 minutes

@Injectable()
export class ReleasesService {
  private readonly logger = new Logger(ReleasesService.name);
  private cache: { value: ReleaseHistoryResponse; expiresAt: number } | null =
    null;
  private inflight: Promise<ReleaseHistoryResponse> | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Cached in memory so clients cannot drive the GitHub API rate limit
   * (unauthenticated: 60 req/h per IP) or slow down the API.
   */
  async getReleaseHistory(): Promise<ReleaseHistoryResponse> {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.value;
    }
    if (!this.inflight) {
      this.inflight = this.fetchReleaseHistory()
        .then((value) => {
          this.cache = {
            value,
            expiresAt:
              Date.now() +
              (value.status === 'ok' ? CACHE_TTL_MS : FAILURE_CACHE_TTL_MS),
          };
          return value;
        })
        .finally(() => {
          this.inflight = null;
        });
    }
    return this.inflight;
  }

  private async fetchReleaseHistory(): Promise<ReleaseHistoryResponse> {
    const repo = this.getConfiguredRepo();
    if (!repo) {
      return this.buildFallbackResponse(
        'unconfigured',
        null,
        'GitHub release proxy is not configured.',
      );
    }

    try {
      const headers = new Headers({
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Grindify Release Proxy',
      });
      const token = this.configService
        .get<string>('GITHUB_RELEASES_TOKEN')
        ?.trim();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(
        `https://api.github.com/repos/${repo.owner}/${repo.name}/releases?per_page=12`,
        { headers, signal: AbortSignal.timeout(10_000) },
      );

      if (!response.ok) {
        const details = (await response.text()).slice(0, 500);
        this.logger.warn(
          `GitHub releases request failed with ${response.status}: ${details}`,
        );
        return this.buildFallbackResponse(
          'unavailable',
          `${repo.owner}/${repo.name}`,
          `GitHub releases are currently unavailable (${response.status}).`,
        );
      }

      const payload = (await response.json()) as GithubRelease[];
      if (!Array.isArray(payload)) {
        return this.buildFallbackResponse(
          'unavailable',
          `${repo.owner}/${repo.name}`,
          'Unexpected GitHub releases response.',
        );
      }

      const releases = payload
        .filter((release) => Boolean(release.tag_name))
        .map((release) => ({
          tagName: String(release.tag_name),
          name: release.name?.trim() || String(release.tag_name),
          publishedAt: release.published_at ?? null,
          body: release.body?.trim() || '',
          prerelease: Boolean(release.prerelease),
          htmlUrl: release.html_url ?? null,
        }));

      const latestStableRelease = releases.find(
        (release) => !release.prerelease,
      );

      return {
        status: 'ok',
        source: 'github',
        repo: `${repo.owner}/${repo.name}`,
        fetchedAt: new Date().toISOString(),
        latestReleaseVersion:
          latestStableRelease?.tagName ?? releases[0]?.tagName ?? null,
        releases,
        message: null,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch GitHub releases: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.buildFallbackResponse(
        'unavailable',
        `${repo.owner}/${repo.name}`,
        'GitHub releases could not be fetched right now.',
      );
    }
  }

  private getConfiguredRepo(): { owner: string; name: string } | null {
    const configuredOwner = this.configService.get<string>(
      'GITHUB_RELEASES_OWNER',
    );
    const configuredRepo = this.configService.get<string>(
      'GITHUB_RELEASES_REPO',
    );

    const owner =
      configuredOwner === undefined ? 'FalkenDev' : configuredOwner.trim();
    const name =
      configuredRepo === undefined ? 'Grindify' : configuredRepo.trim();

    if (!owner || !name) {
      return null;
    }

    return { owner, name };
  }

  private buildFallbackResponse(
    status: ReleaseHistoryResponse['status'],
    repo: string | null,
    message: string,
  ): ReleaseHistoryResponse {
    return {
      status,
      source: 'github',
      repo,
      fetchedAt: new Date().toISOString(),
      latestReleaseVersion: null,
      releases: [],
      message,
    };
  }
}
