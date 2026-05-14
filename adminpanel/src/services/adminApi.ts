import { apiFetch, apiFetchForm, apiFetchBlob } from './api'

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

// --- i18n types ---

export interface I18nString {
  default: string | null
  eng?: string
  swe?: string
}

export interface I18nStringArray {
  default?: string[]
  eng?: string[]
  swe?: string[]
}

// --- Exercise Image Library ---

export interface ExerciseImage {
  id: number
  url: string
  fileSize: number | null
  createdAt: string
  usedBy: { id: number; title: Record<string, string> } | null
}

// --- Global Exercise ---

export interface ExerciseMediaItem {
  id: number
  type: 'image' | 'video'
  url: string
  order: number
}

export interface GlobalExercise {
  id: number
  title: I18nString
  description?: I18nString | null
  exerciseType?: string | null
  muscleGroups: { id: number; name: string }[]
  primaryMuscleGroups?: { id: number; name: string }[]
  equipment: string[]
  equipmentI18n?: I18nStringArray
  image?: string | null
  media?: ExerciseMediaItem[]
  instructionsI18n?: I18nStringArray
  proTipsI18n?: I18nStringArray
  mistakesI18n?: I18nStringArray
  isGlobal: boolean
  createdAt: string
}

export interface CreateGlobalExercisePayload {
  title: I18nString
  description?: I18nString
  exerciseType?: string
  muscleGroupIds?: number[]
  primaryMuscleGroupIds?: number[]
  equipmentI18n?: I18nStringArray
  imageUrl?: string | null
  instructionsI18n?: I18nStringArray
  proTipsI18n?: I18nStringArray
  mistakesI18n?: I18nStringArray
}

// --- Global Activity ---

export interface GlobalActivity {
  id: number
  title: I18nString
  description?: I18nString | null
  icon: string
  equipment?: string[]
  trackDistance: boolean
  trackPace: boolean
  trackElevation: boolean
  trackCalories: boolean
  isGlobal: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateGlobalActivityPayload {
  title: I18nString
  description?: I18nString
  icon: string
  equipment?: string[]
  trackDistance: boolean
  trackPace: boolean
  trackElevation: boolean
  trackCalories: boolean
}

// --- Muscle Group ---

export interface AdminMuscleGroup {
  id: number
  name: string
  nameI18n?: I18nString
  descriptionI18n?: I18nString
  createdAt: string
  updatedAt: string
}

export interface UpdateMuscleGroupPayload {
  nameI18n?: I18nString
  descriptionI18n?: I18nString
}

export interface CreateMuscleGroupPayload {
  name: string
  nameI18n?: I18nString
  descriptionI18n?: I18nString
}

export interface ImportResult {
  created: number
  skipped: number
  errors: string[]
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

  // Global Exercises
  getGlobalExercises: () => apiFetch<GlobalExercise[]>('/admin/exercises'),
  createGlobalExercise: (data: CreateGlobalExercisePayload) =>
    apiFetch<GlobalExercise>('/admin/exercises', { method: 'POST', body: JSON.stringify(data) }),
  updateGlobalExercise: (id: number, data: Partial<CreateGlobalExercisePayload>) =>
    apiFetch<GlobalExercise>(`/admin/exercises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGlobalExercise: (id: number) =>
    apiFetch<void>(`/admin/exercises/${id}`, { method: 'DELETE' }),

  // Global Exercise Media
  uploadGlobalExerciseMedia: (exerciseId: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetchForm<GlobalExercise>(`/admin/exercises/${exerciseId}/media`, fd)
  },
  deleteGlobalExerciseMedia: (exerciseId: number, mediaId: number) =>
    apiFetch<GlobalExercise>(`/admin/exercises/${exerciseId}/media/${mediaId}`, { method: 'DELETE' }),
  reorderGlobalExerciseMedia: (exerciseId: number, mediaIds: number[]) =>
    apiFetch<GlobalExercise>(`/admin/exercises/${exerciseId}/media/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ mediaIds }),
    }),

  // Exercise Image Library
  getExerciseImages: () => apiFetch<ExerciseImage[]>('/admin/exercise-images'),
  uploadExerciseImage: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetchForm<ExerciseImage>('/admin/exercise-images', fd)
  },
  deleteExerciseImage: (id: number) =>
    apiFetch<void>(`/admin/exercise-images/${id}`, { method: 'DELETE' }),

  // Global Activities
  getGlobalActivities: () => apiFetch<GlobalActivity[]>('/admin/activities'),
  createGlobalActivity: (data: CreateGlobalActivityPayload) =>
    apiFetch<GlobalActivity>('/admin/activities', { method: 'POST', body: JSON.stringify(data) }),
  updateGlobalActivity: (id: number, data: Partial<CreateGlobalActivityPayload>) =>
    apiFetch<GlobalActivity>(`/admin/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGlobalActivity: (id: number) =>
    apiFetch<void>(`/admin/activities/${id}`, { method: 'DELETE' }),

  // Muscle Groups
  getMuscleGroups: () => apiFetch<AdminMuscleGroup[]>('/admin/muscle-groups'),
  createMuscleGroup: (data: CreateMuscleGroupPayload) =>
    apiFetch<AdminMuscleGroup>('/admin/muscle-groups', { method: 'POST', body: JSON.stringify(data) }),
  updateMuscleGroup: (id: number, data: UpdateMuscleGroupPayload) =>
    apiFetch<AdminMuscleGroup>(`/admin/muscle-groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getMuscleGroupExercises: (id: number) =>
    apiFetch<{ id: number; title: I18nString }[]>(`/admin/muscle-groups/${id}/exercises`),
  deleteMuscleGroup: (id: number) =>
    apiFetch<void>(`/admin/muscle-groups/${id}`, { method: 'DELETE' }),

  // Export
  exportExercises: () => apiFetchBlob('/admin/export/exercises'),
  exportActivities: () => apiFetchBlob('/admin/export/activities'),

  // Import
  importExercises: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetchForm<ImportResult>('/admin/import/exercises', fd)
  },
  importActivities: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetchForm<ImportResult>('/admin/import/activities', fd)
  },
}
