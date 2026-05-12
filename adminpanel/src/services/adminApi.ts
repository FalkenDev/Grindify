import { apiFetch } from './api'

export interface AdminUser {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
  role: 'user' | 'superadmin'
  emailVerified: boolean
  currentStreak: number
  weeklyWorkoutGoal: number
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminUserDetail extends AdminUser {
  currentWeekWorkouts: number
  streakFreezes: number
  completedGoalWeeksCount: number
  unitScale: string | null
  weight: number | null
  height: number | null
  dateOfBirth: string | null
  gender: string | null
  primaryGoal: string | null
  showRpe: boolean
  showWeightTracking: boolean
  termsAcceptedAt: string | null
  termsVersion: string | null
}

export interface UsersResponse {
  users: AdminUser[]
  total: number
  page: number
  limit: number
}

export interface StatsResponse {
  totalUsers: number
  totalWorkouts: number
  totalSessions: number
  newUsersLast30Days: number
  recentUsers: Pick<AdminUser, 'id' | 'email' | 'firstName' | 'lastName' | 'avatar' | 'createdAt'>[]
}

export interface ReleaseEntry {
  tagName: string
  name: string
  publishedAt: string | null
  body: string
  prerelease: boolean
  htmlUrl: string | null
}

export interface ReleasesResponse {
  status: 'ok' | 'unconfigured' | 'unavailable'
  source: 'github'
  repo: string | null
  fetchedAt: string
  latestReleaseVersion: string | null
  releases: ReleaseEntry[]
  message: string | null
}

export interface HealthResponse {
  ok: boolean
  at: string
}

export const adminApi = {
  getMe: () => apiFetch<AdminUserDetail>('/admin/me'),
  getStats: () => apiFetch<StatsResponse>('/admin/stats'),
  getUsers: (page = 1, limit = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    return apiFetch<UsersResponse>(`/admin/users?${params}`)
  },
  getUser: (id: number) => apiFetch<AdminUserDetail>(`/admin/users/${id}`),
  getReleases: () => apiFetch<ReleasesResponse>('/releases'),
  getHealth: () => apiFetch<HealthResponse>('/auth/health'),
}
