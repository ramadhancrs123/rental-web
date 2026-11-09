import { NextRequest, NextResponse } from "next/server"
import {
  AKASHA_SMART_BOOKING_SESSION_COOKIE,
  invokeSmartBookingFunction,
  noStoreHeaders,
  SmartBookingFunctionError,
} from "@/lib/akasha-smart-booking/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AKASHA_SMART_BOOKING_SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { error: "Sesi portal tidak ditemukan." },
      { status: 401, headers: noStoreHeaders() },
    )
  }

  try {
    const projection = await invokeSmartBookingFunction<Record<string, unknown>>({
      action: "availability",
      session_token: token,
    })
    return NextResponse.json(projection, { headers: noStoreHeaders() })
  } catch (error) {
    const status = error instanceof SmartBookingFunctionError ? error.status : 503
    if (status === 401) {
      const response = NextResponse.json(
        { error: "Sesi portal telah berakhir. Silakan masuk kembali." },
        { status: 401, headers: noStoreHeaders() },
      )
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
    return NextResponse.json(
      { error: "Informasi ketersediaan sementara belum dapat dimuat." },
      { status: 503, headers: noStoreHeaders() },
    )
  }
}
