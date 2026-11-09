import { NextRequest, NextResponse } from "next/server"
import {
  AKASHA_SMART_BOOKING_SESSION_COOKIE,
  invokeSmartBookingFunction,
  noStoreHeaders,
  SmartBookingFunctionError,
} from "@/lib/akasha-smart-booking/server"

export const runtime = "nodejs"

type ChangeBody = {
  request_type?: unknown
  payload?: unknown
  reason?: unknown
  expected_revision?: unknown
  idempotency_key?: unknown
}
const allowed = new Set(["item_change", "variant_change", "quantity_change", "schedule_change", "cancellation", "alternative_interest", "other"])

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AKASHA_SMART_BOOKING_SESSION_COOKIE)?.value
  if (!token) return NextResponse.json({ error: "Sesi portal tidak ditemukan." }, { status: 401, headers: noStoreHeaders() })

  let body: ChangeBody
  try {
    const raw = await request.text()
    if (raw.length > 14_000) return NextResponse.json({ error: "Ukuran permintaan perubahan terlalu besar." }, { status: 413, headers: noStoreHeaders() })
    body = JSON.parse(raw) as ChangeBody
  } catch {
    return NextResponse.json({ error: "Format permintaan perubahan tidak valid." }, { status: 400, headers: noStoreHeaders() })
  }

  const type = typeof body.request_type === "string" ? body.request_type : ""
  const revision = Number(body.expected_revision)
  const idempotency = typeof body.idempotency_key === "string" ? body.idempotency_key.trim() : ""
  if (!allowed.has(type) || !Number.isInteger(revision) || revision < 1 || idempotency.length < 8 || idempotency.length > 100) {
    return NextResponse.json({ error: "Jenis permintaan, revisi, atau kunci permintaan tidak valid." }, { status: 400, headers: noStoreHeaders() })
  }
  if (!body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) {
    return NextResponse.json({ error: "Detail perubahan tidak valid." }, { status: 400, headers: noStoreHeaders() })
  }

  try {
    const data = await invokeSmartBookingFunction<Record<string, unknown>>({
      action: "change",
      session_token: token,
      request_type: type,
      payload: body.payload,
      reason: typeof body.reason === "string" ? body.reason : null,
      expected_revision: revision,
      idempotency_key: idempotency,
    })
    return NextResponse.json(data, { status: 201, headers: noStoreHeaders() })
  } catch (error) {
    const status = error instanceof SmartBookingFunctionError ? error.status : 503
    const responseStatus = [400, 401, 404, 409, 429].includes(status) ? status : 503
    const message = responseStatus === 409
      ? "Booking telah berubah. Muat ulang portal sebelum mengirim permintaan kembali."
      : responseStatus === 401
        ? "Sesi portal telah berakhir. Silakan masuk kembali."
        : responseStatus === 429
          ? "Terlalu banyak permintaan perubahan. Coba kembali beberapa saat lagi."
          : responseStatus === 400 || responseStatus === 404
            ? "Detail permintaan perubahan tidak valid atau booking tidak ditemukan."
            : "Layanan perubahan booking sementara tidak tersedia."
    const headers = {
      ...noStoreHeaders(),
      ...(responseStatus === 429 ? { "Retry-After": "600" } : {}),
    }
    const response = NextResponse.json({ error: message }, { status: responseStatus, headers })
    if (responseStatus === 401) {
      response.cookies.set({
        name: AKASHA_SMART_BOOKING_SESSION_COOKIE,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/akasha-smart-booking/portal",
        maxAge: 0,
      })
    }
    return response
  }
}
