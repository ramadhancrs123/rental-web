import { NextRequest, NextResponse } from "next/server"
import {
  AKASHA_SMART_BOOKING_SESSION_COOKIE,
  invokeSmartBookingFunction,
  noStoreHeaders,
} from "@/lib/akasha-smart-booking/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AKASHA_SMART_BOOKING_SESSION_COOKIE)?.value
  if (token) {
    try {
      await invokeSmartBookingFunction<boolean>({ action: "logout", session_token: token })
    } catch {
      // The cookie is still cleared locally; the DB session expiry is fallback.
    }
  }
  const response = NextResponse.json({ ok: true }, { headers: noStoreHeaders() })
  response.cookies.set({
    name: AKASHA_SMART_BOOKING_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/akasha-smart-booking/portal",
    maxAge: 0,
  })
  return response
}
