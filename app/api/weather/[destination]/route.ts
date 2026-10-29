import { NextResponse } from "next/server"

export const runtime = "nodejs"

const DESTINATIONS: Record<string, { name: string; latitude: number; longitude: number }> = {
  papandayan: { name: "Gunung Papandayan", latitude: -7.3253, longitude: 107.73641 },
  cikuray: { name: "Gunung Cikuray", latitude: -7.32251, longitude: 107.85987 },
  guntur: { name: "Gunung Guntur", latitude: -7.15502, longitude: 107.85124 },
  karacak: { name: "Gunung Karacak", latitude: -7.282778, longitude: 107.955 },
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ destination: string }> },
) {
  const { destination } = await params
  const selected = DESTINATIONS[destination]

  if (!selected) {
    return NextResponse.json({ error: "Destinasi cuaca tidak dikenal." }, { status: 404 })
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.searchParams.set("latitude", String(selected.latitude))
  url.searchParams.set("longitude", String(selected.longitude))
  url.searchParams.set("timezone", "Asia/Jakarta")
  url.searchParams.set("forecast_days", "3")
  url.searchParams.set("temperature_unit", "celsius")
  url.searchParams.set("wind_speed_unit", "kmh")
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_gusts_10m")
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m")
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset")

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Layanan prakiraan cuaca sedang tidak tersedia." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      )
    }

    const forecast: unknown = await response.json()
    return NextResponse.json(
      { destination: selected.name, latitude: selected.latitude, longitude: selected.longitude, source: "Open-Meteo", forecast },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=900" } },
    )
  } catch {
    return NextResponse.json(
      { error: "Cuaca belum dapat dimuat. Periksa koneksi dan coba lagi." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    )
  }
}
