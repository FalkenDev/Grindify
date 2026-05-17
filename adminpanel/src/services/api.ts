const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:1337/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body?.message ?? message
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function apiFetchBlob(path: string): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body?.message ?? message
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message)
  }

  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? 'export.json'
  const blob = await res.blob()
  return { blob, filename }
}

export async function apiFetchForm<T>(path: string, formData: FormData, method = 'POST'): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    body: formData,
    // Do NOT set Content-Type – browser sets it with boundary for multipart/form-data
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body?.message ?? message
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
