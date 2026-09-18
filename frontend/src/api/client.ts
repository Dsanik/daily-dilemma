const API_URL = 'https://daily-dilemma.onrender.com'
const LOCAL_USER_KEY = 'daily-dilemma-local-user-id-v1'

// Request timeout and retry configuration
const REQUEST_TIMEOUT = 10000 // 10 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Debounce map to prevent duplicate requests
const pendingRequests = new Map<string, Promise<any>>()

/**
 * Получает user_id:
 * 1. Если в Telegram — берёт user.id
 * 2. Если в браузере — генерирует UUID и хранит в localStorage
 */
export function getUserId(): string {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
  if (tgUser?.id) {
    return `tg_${tgUser.id}`
  }

  try {
    const existing = localStorage.getItem(LOCAL_USER_KEY)
    if (existing) return existing
    const uuid = `local_${crypto.randomUUID()}`
    localStorage.setItem(LOCAL_USER_KEY, uuid)
    return uuid
  } catch {
    return `local_${Date.now()}`
  }
}

/**
 * Возвращает имя пользователя для отображения.
 */
export function getUserName(): string | null {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
  if (tgUser?.first_name) return tgUser.first_name
  return null
}

/**
 * initData Telegram-а — сервер использует её, чтобы проверить, что userId
 * действительно принадлежит тому, кто делает запрос.
 */
function getInitData(): string {
  return window.Telegram?.WebApp?.initData ?? ''
}

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms)
  })
}

/**
 * Delays execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Validates response data to ensure it's not corrupted
 */
function validateResponse(data: any): boolean {
  if (data === null || data === undefined) return false
  if (typeof data === 'object' && Object.keys(data).length === 0) return false
  return true
}

async function makeRequest<T>(
  url: string, 
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<T | null> {
  // Create a unique key for this request to prevent duplicates
  const requestKey = `${options.method || 'GET'}_${url}_${JSON.stringify(options.body || {})}`
  
  // If the same request is already pending, return that promise
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)
  }

  const requestPromise = async (): Promise<T | null> => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add timeout to the request
        const fetchPromise = fetch(url, {
          ...options,
          signal: AbortSignal.timeout ? AbortSignal.timeout(REQUEST_TIMEOUT) : undefined,
        })

        const response = await Promise.race([
          fetchPromise,
          createTimeoutPromise(REQUEST_TIMEOUT)
        ])

        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // Parse JSON with error handling
        let data: T
        try {
          data = await response.json()
        } catch (parseError) {
          throw new Error('Invalid JSON response')
        }

        // Validate response data
        if (!validateResponse(data)) {
          throw new Error('Invalid response data')
        }

        return data

      } catch (error) {
        lastError = error as Error
        console.warn(`API request attempt ${attempt + 1} failed:`, error)

        // Don't retry on certain errors
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          // Network error, worth retrying
        } else if (error instanceof Error && error.message.includes('timeout')) {
          // Timeout error, worth retrying
        } else if (error instanceof Error && error.message.includes('HTTP 4')) {
          // Client error (4xx), don't retry
          break
        } else {
          // Other errors, don't retry
          break
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          await delay(RETRY_DELAY * Math.pow(2, attempt))
        }
      }
    }

    console.error(`API request failed after ${retries + 1} attempts:`, lastError)
    return null
  }

  // Store the promise to prevent duplicate requests
  const promise = requestPromise()
  pendingRequests.set(requestKey, promise)

  // Clean up the pending request after completion
  promise.finally(() => {
    pendingRequests.delete(requestKey)
  })

  return promise
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  const url = `${API_URL}${path}`
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': getInitData(),
    },
    body: JSON.stringify(body),
  }

  return makeRequest<T>(url, options)
}

async function get<T>(path: string): Promise<T | null> {
  const url = `${API_URL}${path}`
  const options: RequestInit = {
    method: 'GET',
    headers: { 
      'X-Telegram-Init-Data': getInitData(),
    },
  }

  return makeRequest<T>(url, options)
}

export interface RegisterResponse {
  ok: boolean
}

export interface CompletedResponse {
  ok: boolean
  streak: number
}

export interface StreakResponse {
  ok: boolean
  streak: number
  totalPlayed: number
  lastCompletedDate: string | null
}

// Enhanced API with better error handling and validation
export const api = {
  register: async (firstName?: string, username?: string): Promise<RegisterResponse | null> => {
    // Input validation
    if (firstName && typeof firstName !== 'string') {
      console.warn('Invalid firstName type')
      return null
    }
    if (username && typeof username !== 'string') {
      console.warn('Invalid username type')
      return null
    }

    return post<RegisterResponse>('/api/register', {
      userId: getUserId(),
      firstName: firstName?.trim() || '',
      username: username?.trim() || '',
    })
  },

  markCompleted: async (dilemmaSlug: string): Promise<CompletedResponse | null> => {
    // Input validation
    if (!dilemmaSlug || typeof dilemmaSlug !== 'string') {
      console.warn('Invalid dilemmaSlug')
      return null
    }

    return post<CompletedResponse>('/api/completed', {
      userId: getUserId(),
      dilemmaSlug: dilemmaSlug.trim(),
    })
  },

  getStreak: async (): Promise<StreakResponse | null> => {
    const userId = getUserId()
    if (!userId) {
      console.warn('No userId available')
      return null
    }

    return get<StreakResponse>(`/api/streak?userId=${encodeURIComponent(userId)}`)
  },

  // Health check endpoint for monitoring API status
  healthCheck: async (): Promise<{ ok: boolean; uptime?: number; users?: number } | null> => {
    return get('/health')
  },

  // Upload share image and get public URL
  uploadShareImage: async (blob: Blob, filename: string): Promise<{ ok: boolean; url?: string; imageId?: string; expiresIn?: number; error?: string } | null> => {
    try {
      // Convert blob to base64
      const base64 = await blobToBase64(blob)
      
      return post<{ ok: boolean; url: string; imageId: string; expiresIn: number }>('/api/upload-share-image', {
        image: base64,
        filename: filename.trim() || 'share-image.png'
      })
    } catch (error) {
      console.error('Upload share image error:', error)
      return { ok: false, error: error instanceof Error ? error.message : 'Upload failed' }
    }
  }
}

// Helper function to convert Blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Export utility functions for testing and debugging
export const apiUtils = {
  clearPendingRequests: () => {
    pendingRequests.clear()
  },
  getPendingRequestsCount: () => {
    return pendingRequests.size
  }
}