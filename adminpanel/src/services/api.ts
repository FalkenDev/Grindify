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

  const blob = await res.blob()
  const filename =
    filenameFromDisposition(res.headers.get('Content-Disposition')) ??
    `export${extensionForContentType(res.headers.get('Content-Type') ?? blob.type)}`
  return { blob, filename }
}

/** Extract the filename from a Content-Disposition header (RFC 6266 `filename*` preferred). */
export function filenameFromDisposition(disposition: string | null): string | undefined {
  if (!disposition) return undefined
  const extended = disposition.match(/filename\*\s*=\s*(?:[\w-]+)?'[^']*'([^;]+)/i)
  if (extended) {
    try {
      const name = decodeURIComponent(extended[1].trim().replace(/^"|"$/g, ''))
      if (name) return sanitizeFilename(name)
    } catch {
      // malformed encoding — fall through to the plain filename
    }
  }
  const plain = disposition.match(/filename\s*=\s*(?:"([^"]*)"|([^;]+))/i)
  const name = (plain?.[1] ?? plain?.[2])?.trim()
  return name ? sanitizeFilename(name) : undefined
}

function sanitizeFilename(name: string): string | undefined {
  // Never let a header pick a directory: keep only the last path segment.
  const base = name.split(/[\\/]/).pop()?.trim()
  return base || undefined
}

const EXTENSIONS: Record<string, string> = {
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/json': '.json',
  'text/csv': '.csv',
  'application/gzip': '.gz',
}

/** File extension (with dot) for a Content-Type, used when no filename is provided. */
export function extensionForContentType(contentType: string): string {
  const mime = contentType.split(';')[0].trim().toLowerCase()
  return EXTENSIONS[mime] ?? (mime.endsWith('+json') ? '.json' : '')
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
