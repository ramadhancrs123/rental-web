import { NextResponse } from "next/server"
import { getHikingSourceByAdm4, getHikingSourceByNameOrSlug, getHikingDestinationForSource } from "@/lib/hiking-source"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CacheEntry = { payload: Record<string, unknown>; fetchedAt: number }
type WeatherCache = Map<string, CacheEntry>
const globalCache = globalThis as typeof globalThis & { __akashaBmkgForecastCache?: WeatherCache }
const weatherCache = globalCache.__akashaBmkgForecastCache ??= new Map<string, CacheEntry>()
const UPSTREAM_TTL_MS = 3 * 60 * 60 * 1000
const MAX_STALE_MS = 12 * 60 * 60 * 1000
const API_TEMPLATE = "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4="
const SOURCE_URL = "https://data.bmkg.go.id/prakiraan-cuaca/"

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function readAnalysisDate(groups: unknown[]): string | null {
  for (const group of groups) {
    if (!group || typeof group !== "object") continue
    const record = group as Record<string, unknown>
    const cuaca = record.cuaca
    if (!Array.isArray(cuaca)) continue
    for (const hourGroup of cuaca) {
      if (!Array.isArray(hourGroup)) continue
      for (const item of hourGroup) {
        if (item && typeof item === "object") {
          const analysisDate = (item as Record<string, unknown>).analysis_date
          if (typeof analysisDate === "string" && analysisDate) return analysisDate
        }
      }
    }
  }
  return null
}

function responsePayload(source: ReturnType<typeof getHikingSourceByNameOrSlug>, raw: Record<string, unknown>, fetchedAt: string, stale: boolean, staleReason?: string) {
  const destination = source ? getHikingDestinationForSource(source) : null
  const weatherLocation = source?.weatherLocation
  const rawLocation = (raw.lokasi && typeof raw.lokasi === "object" ? raw.lokasi : {}) as Record<string, unknown>
  const forecast = Array.isArray(raw.data) ? raw.data : []
  const timezone = typeof rawLocation.timezone === "string" ? rawLocation.timezone : "Asia/Jakarta"
  return {
    source: { code: "BMKG", name: "Badan Meteorologi, Klimatologi, dan Geofisika", attribution: "Sumber prakiraan: BMKG", sourceUrl: SOURCE_URL, apiUrl: API_TEMPLATE + encodeURIComponent(weatherLocation?.adm4 ?? "") },
    location: {
      adm4Code: weatherLocation?.adm4 ?? "",
      village: weatherLocation?.village ?? String(rawLocation.desa ?? rawLocation.kelurahan ?? "Wilayah referensi"),
      district: weatherLocation?.district ?? (typeof rawLocation.kecamatan === "string" ? rawLocation.kecamatan : null),
      regency: weatherLocation?.regency ?? (typeof rawLocation.kotkab === "string" ? rawLocation.kotkab : null),
      province: weatherLocation?.province ?? (typeof rawLocation.provinsi === "string" ? rawLocation.provinsi : "Jawa Barat"),
      latitude: numeric(rawLocation.lat),
      longitude: numeric(rawLocation.lon),
      timezone,
      scopeNotice: "Prakiraan berlaku untuk wilayah administratif referensi. Data ini bukan observasi langsung maupun prakiraan resmi khusus basecamp, pos, atau puncak.",
    },
    analysisDate: readAnalysisDate(forecast),
    fetchedAt,
    freshUntil: new Date(Date.parse(fetchedAt) + UPSTREAM_TTL_MS).toISOString(),
    stale,
    ...(staleReason ? { staleReason } : {}),
    forecast,
    bmkgLocation: rawLocation,
    destination: destination ? { slug: destination.sourceSlug, name: destination.name } : null,
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mountainSlug = url.searchParams.get("mountainSlug")?.trim()
  const adm4 = url.searchParams.get("adm4")?.trim()
  if (Boolean(mountainSlug) === Boolean(adm4)) {
    return NextResponse.json({ error: "INVALID_WEATHER_TARGET", message: "Kirim salah satu parameter mountainSlug atau adm4." }, { status: 400 })
  }

  const source = mountainSlug ? getHikingSourceByNameOrSlug(mountainSlug) : getHikingSourceByAdm4(adm4 ?? "")
  if (!source || source.weatherLocation?.verificationStatus !== "bmkg_forecast_page_verified" || !source.weatherLocation.adm4) {
    return NextResponse.json({ error: "WEATHER_AREA_NOT_CONFIGURED", message: "Kode wilayah belum tersedia atau belum lolos verifikasi data sumber." }, { status: 404 })
  }

  const regionCode = source.weatherLocation.adm4
  const cacheKey = regionCode
  const cached = weatherCache.get(cacheKey)
  const now = Date.now()
  if (cached && now - cached.fetchedAt < UPSTREAM_TTL_MS) {
    const fetchedAt = new Date(cached.fetchedAt).toISOString()
    return NextResponse.json(responsePayload(source, cached.payload, fetchedAt, false), { headers: { "Cache-Control": "public, s-maxage=180, stale-while-revalidate=600" } })
  }

  try {
    const upstream = await fetch(API_TEMPLATE + encodeURIComponent(regionCode), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(9000),
      next: { revalidate: 10800, tags: ["bmkg-forecast-" + regionCode] },
    })
    if (!upstream.ok) throw new Error("BMKG_UPSTREAM_HTTP_" + upstream.status)
    const raw: unknown = await upstream.json()
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || !Array.isArray((raw as Record<string, unknown>).data)) {
      throw new Error("BMKG_UPSTREAM_INVALID_PAYLOAD")
    }
    const payload = raw as Record<string, unknown>
    const fetchedAt = new Date().toISOString()
    weatherCache.set(cacheKey, { payload, fetchedAt: Date.parse(fetchedAt) })
    return NextResponse.json(responsePayload(source, payload, fetchedAt, false), { headers: { "Cache-Control": "public, s-maxage=180, stale-while-revalidate=600" } })
  } catch {
    if (cached && now - cached.fetchedAt <= MAX_STALE_MS) {
      const fetchedAt = new Date(cached.fetchedAt).toISOString()
      return NextResponse.json(responsePayload(source, cached.payload, fetchedAt, true, "BMKG belum dapat diperbarui; menampilkan cache terbatas yang masih dapat digunakan sebagai referensi."), { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } })
    }
    return NextResponse.json({ error: "WEATHER_UPSTREAM_UNAVAILABLE", message: "Prakiraan BMKG belum dapat diambil dan cache yang tersedia sudah terlalu lama. Informasi tidak diganti dengan data contoh." }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}
