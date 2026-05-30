/**
 * Supabase URL + anon key validation & auto-detection helpers.
 *
 * These run client-side only — no DB writes, no schema changes.
 */

/** Extract the project ref from a Supabase URL. Returns null if not a valid Supabase URL. */
export function extractProjectRef(url: string): string | null {
  const m = url.trim().match(/^https?:\/\/([a-z0-9]+)\.supabase\.co/i)
  return m ? m[1] : null
}

/** Normalize a Supabase URL to a clean form. */
export function normalizeSupabaseUrl(url: string): string {
  const raw = url.trim()
  const ref = extractProjectRef(raw)
  if (ref) return `https://${ref}.supabase.co`
  // Not a standard Supabase URL — return as-is (self-hosted, etc.)
  return raw.replace(/\/+$/, '')
}

export interface UrlValidation {
  valid: boolean
  ref: string | null
  error?: string
}

export function validateUrl(url: string): UrlValidation {
  const trimmed = url.trim()
  if (!trimmed) return { valid: false, ref: null, error: 'URL is required' }
  if (!trimmed.startsWith('http')) return { valid: false, ref: null, error: 'URL must start with https://' }
  const ref = extractProjectRef(trimmed)
  if (!ref) {
    // Could be self-hosted — still valid if it's a proper URL
    try {
      new URL(trimmed)
      return { valid: true, ref: null }
    } catch {
      return { valid: false, ref: null, error: 'Invalid URL format' }
    }
  }
  return { valid: true, ref }
}

export interface KeyValidation {
  valid: boolean
  error?: string
  isJwt: boolean
  matchesProject: boolean
}

/** Validate anon key format and check if it matches the project ref. */
export function validateAnonKey(key: string, projectRef: string | null): KeyValidation {
  const trimmed = key.trim()
  if (!trimmed) return { valid: false, error: 'Anon key is required', isJwt: false, matchesProject: false }

  // Check if it looks like a JWT (3 parts separated by dots)
  const parts = trimmed.split('.')
  const isJwt = parts.length === 3 && parts.every((p) => p.length > 10)

  if (!isJwt) {
    // Could be a new-format publishable key (sb_publishable_...)
    if (trimmed.startsWith('sb_publishable_')) {
      return { valid: true, isJwt: false, matchesProject: true }
    }
    return {
      valid: false,
      error: 'ไม่ใช่รูปแบบ JWT — ควรเริ่มด้วย eyJ... (ยาวมาก ~200 ตัวอักษร) หรือ sb_publishable_...',
      isJwt: false,
      matchesProject: false,
    }
  }

  // Try to decode the JWT payload to check the project ref
  let matchesProject = false
  try {
    const payload = JSON.parse(atob(parts[1]))
    if (projectRef && payload.ref === projectRef) matchesProject = true
    else if (projectRef && payload.ref && payload.ref !== projectRef) {
      return {
        valid: false,
        error: `Key belongs to project "${payload.ref}" but URL is "${projectRef}" — key ไม่ตรงกับ URL`,
        isJwt: true,
        matchesProject: false,
      }
    }
    // Check role is anon (not service_role which is dangerous)
    if (payload.role === 'service_role') {
      return {
        valid: false,
        error: '⚠️ นี่คือ service_role key (ห้ามใช้!) — ให้ใช้ anon (public) key แทน',
        isJwt: true,
        matchesProject,
      }
    }
  } catch {
    // JWT decode failed — could still be valid, just can't verify
  }

  return { valid: true, isJwt, matchesProject }
}

/** Quick pre-flight: test if the URL + key combination works (returns table count or error). */
export async function quickTest(
  url: string,
  anonKey: string
): Promise<{ ok: boolean; latencyMs: number; tableCount?: number; error?: string }> {
  const normalizedUrl = normalizeSupabaseUrl(url)
  const started = performance.now()
  try {
    const res = await fetch(`${normalizedUrl}/rest/v1/`, {
      headers: { apikey: anonKey.trim(), Authorization: `Bearer ${anonKey.trim()}` },
      signal: AbortSignal.timeout(10000),
    })
    const latencyMs = Math.round(performance.now() - started)
    if (!res.ok) {
      const explain: Record<number, string> = {
        401: 'Anon key ไม่ถูกต้อง — ไปที่ Supabase → Settings → API → anon public key แล้ว copy ใหม่',
        403: 'Key ถูกต้องแต่ถูก block — ตรวจสอบ RLS/API settings',
        404: 'ไม่พบ project — ตรวจสอบ URL',
      }
      return { ok: false, latencyMs, error: explain[res.status] ?? `HTTP ${res.status}` }
    }
    let tableCount: number | undefined
    try {
      const spec = await res.json()
      tableCount = spec?.definitions ? Object.keys(spec.definitions).length : undefined
    } catch {
      /* still ok */
    }
    return { ok: true, latencyMs, tableCount }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - started),
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}
