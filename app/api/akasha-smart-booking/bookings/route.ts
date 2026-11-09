import { NextRequest, NextResponse } from "next/server"
import {
  AKASHA_SMART_BOOKING_SLUG,
  getSmartBookingClientFingerprint,
  invokeSmartBookingFunction,
  noStoreHeaders,
  SmartBookingFunctionError,
} from "@/lib/akasha-smart-booking/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let body: { booking?: unknown; idempotency_key?: unknown }
  try {
    const raw = await request.text()
    if (raw.length > 24_000) return NextResponse.json({ error: "Ukuran data booking terlalu besar." }, { status: 413, headers: noStoreHeaders() })
    body = JSON.parse(raw) as typeof body
  } catch {
    return NextResponse.json({ error: "Format permintaan booking tidak valid." }, { status: 400, headers: noStoreHeaders() })
  }

  if (!body.booking || typeof body.booking !== "object" || Array.isArray(body.booking)) {
    return NextResponse.json({ error: "Data booking tidak lengkap." }, { status: 400, headers: noStoreHeaders() })
  }

  const key = request.headers.get("Idempotency-Key")?.trim() ||
    (typeof body.idempotency_key === "string" ? body.idempotency_key.trim() : "")
  if (key.length < 8 || key.length > 80) {
    return NextResponse.json({ error: "Kunci permintaan booking tidak valid. Silakan muat ulang formulir." }, { status: 400, headers: noStoreHeaders() })
  }

  try {
    const result = await invokeSmartBookingFunction<Record<string, unknown>>({
      action: "create",
      slug: AKASHA_SMART_BOOKING_SLUG,
      booking: body.booking,
      idempotency_key: key,
      client_fingerprint: getSmartBookingClientFingerprint(request),
    })
    return NextResponse.json(result, { status: 201, headers: noStoreHeaders() })
  } catch (error) {
    const status = error instanceof SmartBookingFunctionError ? error.status : 503
    const safeStatus = [400, 404, 409, 429].includes(status) ? status : 503
    const message = safeStatus === 400 || safeStatus === 404
      ? "Data booking belum valid. Periksa kembali item, periode, dan informasi customer."
      : safeStatus === 409
        ? "Permintaan booking mengalami konflik. Muat ulang dan coba kembali."
        : safeStatus === 429
          ? "Terlalu banyak percobaan booking dari perangkat ini. Coba kembali beberapa saat lagi."
          : "Booking belum dapat diproses. Silakan coba kembali."
    return NextResponse.json(
      { error: message },
      { status: safeStatus, headers: { ...noStoreHeaders(), ...(safeStatus === 429 ? { "Retry-After": "600" } : {}) } },
    )
  }
}
