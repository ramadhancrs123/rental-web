import { NextRequest, NextResponse } from "next/server"
import {
  AKASHA_SMART_BOOKING_SLUG,
  AKASHA_SMART_BOOKING_SESSION_COOKIE,
  getSmartBookingClientFingerprint,
  invokeSmartBookingFunction,
  noStoreHeaders,
} from "@/lib/akasha-smart-booking/server"

export const runtime = "nodejs"

type ExchangeResult = { ok?: boolean; session_token?: string; expires_at?: string }

export async function POST(request: NextRequest) {
  let body: { portal_link_token?: unknown }
  try {
    const raw = await request.text()
    if (raw.length > 2_000) {
      return NextResponse.json({ error: "Tautan akses tidak valid." }, { status: 413, headers: noStoreHeaders() })
    }
    body = JSON.parse(raw) as typeof body
  } catch {
    return NextResponse.json({ error: "Format tautan akses tidak valid." }, { status: 400, headers: noStoreHeaders() })
  }

  const token = typeof body.portal_link_token === "string" ? body.portal_link_token.trim().toLowerCase() : ""
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.json({ error: "Tautan pribadi tidak valid atau telah kedaluwarsa." }, { status: 401, headers: noStoreHeaders() })
  }

  try {
    const result = await invokeSmartBookingFunction<ExchangeResult>({
      action: "login_link",
      slug: AKASHA_SMART_BOOKING_SLUG,
      portal_link_token: token,
      client_fingerprint: getSmartBookingClientFingerprint(request),
    })
    if (!result.ok || !result.session_token) {
      return NextResponse.json({ error: "Tautan pribadi tidak valid atau telah kedaluwarsa." }, { status: 401, headers: noStoreHeaders() })
    }

    const expiresAt = result.expires_at ? new Date(result.expires_at) : new Date(Date.now() + 7 * 86400_000)
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Tautan pribadi tidak valid atau telah kedaluwarsa." }, { status: 401, headers: noStoreHeaders() })
    }
    const maxAge = Math.max(1, Math.min(7 * 86400, Math.floor((expiresAt.getTime() - Date.now()) / 1000)))
    const response = NextResponse.json({ ok: true, expires_at: expiresAt.toISOString() }, { headers: noStoreHeaders() })
    response.cookies.set({
      name: AKASHA_SMART_BOOKING_SESSION_COOKIE,
      value: result.session_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/akasha-smart-booking/portal",
      maxAge,
      expires: expiresAt,
    })
    return response
  } catch {
    return NextResponse.json({ error: "Portal booking belum dapat diakses. Silakan coba kembali." }, { status: 503, headers: noStoreHeaders() })
  }
}
