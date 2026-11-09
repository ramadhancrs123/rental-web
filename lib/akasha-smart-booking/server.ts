import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cached: SupabaseClient | null = null

export const AKASHA_SMART_BOOKING_SLUG =
  process.env.AKASHA_SMART_BOOKING_USAHA_SLUG ??
  "akasha-outdoor"

export const AKASHA_SMART_BOOKING_SESSION_COOKIE = "akasha_sb_portal_session"

export function getSmartBookingClient(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !publishableKey) throw new Error("Supabase public credentials are not configured")
  cached = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { "X-Application-Name": "akasha-smart-booking-web" } },
  })
  return cached
}

/** The database persists only a keyed HMAC of this proxy-derived fingerprint. */
export function getSmartBookingClientFingerprint(request: Request): string {
  const headers = request.headers
  const ip =
    headers.get("x-vercel-forwarded-for") ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
    "unknown"
  const userAgent = headers.get("user-agent") ?? "unknown"
  return ip.trim() + "|" + userAgent.slice(0, 240)
}

export class SmartBookingFunctionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "SmartBookingFunctionError"
  }
}

export async function invokeSmartBookingFunction<T>(
  payload: Record<string, unknown>,
): Promise<T> {
  const ingressSecret = process.env.AKASHA_SMART_BOOKING_INGRESS_SECRET
  if (!ingressSecret || !/^[0-9a-f]{64}$/.test(ingressSecret)) {
    throw new SmartBookingFunctionError("AKASHA SMART BOOKING server ingress is not configured", 503)
  }

  const { data, error } = await getSmartBookingClient().functions.invoke(
    "akasha-smart-booking",
    {
      body: payload,
      headers: {
        "x-akasha-smart-booking-ingress-secret": ingressSecret,
      },
    },
  )
  if (error) {
    const response = (error as { context?: unknown }).context
    let status = 503
    let message = "AKASHA SMART BOOKING service unavailable"
    if (response instanceof Response) {
      status = response.status
      try {
        const body = (await response.clone().json()) as { error?: string }
        if (body.error) message = body.error
      } catch {
        // Do not leak provider internals into the customer API.
      }
    }
    throw new SmartBookingFunctionError(message, status)
  }
  if (data == null) throw new SmartBookingFunctionError("AKASHA SMART BOOKING returned an empty response", 503)
  return data as T
}

export function noStoreHeaders(): HeadersInit {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Vary: "Cookie",
  }
}
