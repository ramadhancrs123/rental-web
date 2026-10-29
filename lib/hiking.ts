import type { GeoJSON as GeoJSONType } from "geojson"

export type HikingMountain = {
  mountain_id: string
  slug: string
  name: string
  aliases?: string[] | null
  description?: string | null
  elevation_m?: number | null
  province?: string | null
  regency?: string | null
  latitude?: number | null
  longitude?: number | null
  is_volcanic?: boolean | null
  volcanic_status?: string | null
  volcanic_status_source_url?: string | null
  volcanic_status_checked_at?: string | null
  operator_name?: string | null
  operator_website_url?: string | null
  verified_at?: string | null
  bmkg_adm4_codes?: string[] | null
  dataAvailability?: {
    coordinates?: boolean
    description?: boolean
    elevation?: boolean
    verified?: boolean
  }
}

export type HikingDestination = HikingMountain & {
  sourceSlug: string
  sourceMapEmbedUrl: string | null
  sourceMapViewUrl: string | null
  sourcePageUrl: string | null
  sourceGpxUrl: string | null
  sourceKmzUrl: string | null
  sourcePdfUrl: string | null
  sourceMapTitle: string
  sourceRouteLabelText: string | null
  sourceMapLabelsNote: string | null
  weatherAdm4: string | null
  weatherVillage: string | null
  weatherRouteReference: string | null
  weatherReferenceElevationM: number | null
  weatherReferenceElevationStatus: string | null
  weatherForecastPageUrl: string | null
}

export type HikingTrail = {
  trail_id: string
  mountain_id: string
  mountain_slug: string
  mountain_name: string
  slug: string
  code?: string | null
  name: string
  description?: string | null
  basecamp_name?: string | null
  basecamp_address?: string | null
  basecamp_latitude?: number | null
  basecamp_longitude?: number | null
  route_geojson?: GeoJSONType | null
  distance_m?: number | null
  elevation_gain_m?: number | null
  estimated_duration_minutes?: number | null
  difficulty_grade?: number | null
  difficulty_grade_status?: string | null
  operational_status?: string | null
  operational_status_source_url?: string | null
  operational_status_checked_at?: string | null
  official_booking_url?: string | null
  operator_name?: string | null
  operator_website_url?: string | null
  route_source_reference_url?: string | null
  verified_at?: string | null
  bmkg_adm4_codes?: string[] | null
  dataAvailability?: {
    routeGeoJson?: boolean
    gpxDownload?: boolean
    offlineGps?: boolean
    status?: string
    message?: string | null
    gpxResource?: {
      resource: string
      mountain_slug: string
      trail_slug: string
    } | null
  }
}

export type HikingCheckpoint = {
  checkpoint_id?: string
  trail_id?: string
  sequence_number?: number | null
  code?: string | null
  name: string
  checkpoint_type?: string | null
  description?: string | null
  latitude?: number | null
  longitude?: number | null
  elevation_m?: number | null
  elevation_source_url?: string | null
  verified_at?: string | null
  temperature_estimate_public_eligible?: boolean
}

export type HikingMedia = {
  media_id: string
  media_type: string
  mediaUrl?: string
  mediaUrlExpiresAt?: string
  alt_text?: string | null
  caption?: string | null
  sort_order?: number | null
  source_reference_url?: string | null
  permission_status?: string | null
  verified_at?: string | null
}

export type HikingAdvisory = {
  advisory_id: string
  advisory_type?: string | null
  severity?: string | null
  title: string
  description?: string | null
  instruction?: string | null
  source_url?: string | null
  official_source?: boolean | null
  verification_status?: string | null
  starts_at?: string | null
  expires_at?: string | null
  verified_at?: string | null
}

export type HikingWeatherAlert = {
  alert_id: string
  sender?: string | null
  sent_at?: string | null
  category?: string | null
  event?: string | null
  urgency?: string | null
  severity?: string | null
  certainty?: string | null
  headline?: string | null
  description?: string | null
  instruction?: string | null
  effective_at?: string | null
  onset_at?: string | null
  expires_at?: string | null
  web_url?: string | null
  source_url?: string | null
  last_fetched_at?: string | null
  source_name?: string | null
  source_attribution?: string | null
  affected_areas?: Array<Record<string, unknown>> | null
}

export type HikingResourceResponse<T> = {
  resource?: string
  items?: T[]
  item?: T | null
  pagination?: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
  dataAvailability?: {
    status?: string
    message?: string | null
  }
  error?: string
  message?: string
  [key: string]: unknown
}

export type HikingWeatherResponse = {
  source: {
    code: string
    name: string
    attribution: string
    sourceUrl: string
    apiUrl: string
  }
  location: {
    adm4Code: string
    village: string
    district: string | null
    regency: string | null
    province: string
    latitude: number | null
    longitude: number | null
    scopeNotice: string
  }
  analysisDate: string | null
  fetchedAt: string
  freshUntil: string
  stale: boolean
  staleReason?: string
  forecast: Array<{
    lokasi?: Record<string, unknown>
    cuaca?: Array<Array<Record<string, unknown>>>
    [key: string]: unknown
  }>
  bmkgLocation?: Record<string, unknown> | null
  error?: string
  message?: string
}

function getSupabasePublicConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!baseUrl || !anonKey) {
    throw new Error("Layanan destinasi belum dikonfigurasi.")
  }
  return { baseUrl, anonKey }
}

export async function requestHikingCatalog<T = unknown>(
  params: Record<string, string | number | null | undefined>,
  signal?: AbortSignal,
): Promise<HikingResourceResponse<T>> {
  const { baseUrl, anonKey } = getSupabasePublicConfig()
  const url = new URL(baseUrl + "/functions/v1/hiking-catalog")
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      url.searchParams.set(key, String(value))
    }
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      apikey: anonKey,
      Authorization: "Bearer " + anonKey,
    },
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(12_000),
  })

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {}
    const code = typeof record.error === "string" ? record.error : "HIKING_CATALOG_UNAVAILABLE"
    const message = typeof record.message === "string" ? record.message : "Informasi destinasi belum dapat dimuat."
    throw new Error(code + ": " + message)
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Respons katalog destinasi tidak valid.")
  }
  return payload as HikingResourceResponse<T>
}

export async function requestHikingWeather(
  target: { mountain?: string; trail?: string },
  signal?: AbortSignal,
): Promise<HikingWeatherResponse> {
  if (Boolean(target.mountain) === Boolean(target.trail)) {
    throw new Error("Pilih tepat satu destinasi gunung atau jalur.")
  }
  const { baseUrl, anonKey } = getSupabasePublicConfig()
  const url = new URL(baseUrl + "/functions/v1/hiking-weather-forecast")
  if (target.mountain) url.searchParams.set("mountain", target.mountain)
  if (target.trail) url.searchParams.set("trail", target.trail)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      apikey: anonKey,
      Authorization: "Bearer " + anonKey,
    },
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(12_000),
  })

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {}
    const code = typeof record.error === "string" ? record.error : "HIKING_WEATHER_UNAVAILABLE"
    const message = typeof record.message === "string" ? record.message : "Prakiraan BMKG belum tersedia untuk destinasi ini."
    throw new Error(code + ": " + message)
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Respons prakiraan BMKG tidak valid.")
  }
  return payload as HikingWeatherResponse
}

export function formatElevation(meters?: number | null): string | null {
  if (meters == null || !Number.isFinite(meters)) return null
  return new Intl.NumberFormat("id-ID").format(meters) + " mdpl"
}

export function formatDistance(meters?: number | null): string | null {
  if (meters == null || !Number.isFinite(meters) || meters <= 0) return null
  if (meters >= 1000) {
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(meters / 1000) + " km"
  }
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(meters) + " m"
}

export function formatDuration(minutes?: number | null): string | null {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return null
  const hours = Math.floor(minutes / 60)
  const remaining = Math.round(minutes % 60)
  if (hours === 0) return remaining + " menit"
  if (remaining === 0) return hours + " jam"
  return hours + " jam " + remaining + " menit"
}

export function formatIndonesianDate(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date)
}

export function cleanDescription(value?: string | null): string {
  return value?.trim() ?? ""
}


export async function requestSourceHikingWeather(
  target: { mountainSlug?: string; adm4?: string },
  signal?: AbortSignal,
): Promise<HikingWeatherResponse> {
  if (Boolean(target.mountainSlug) === Boolean(target.adm4)) {
    throw new Error("Pilih tepat satu sumber cuaca destinasi atau kode wilayah.")
  }
  const params = new URLSearchParams()
  if (target.mountainSlug) params.set("mountainSlug", target.mountainSlug)
  if (target.adm4) params.set("adm4", target.adm4)
  const response = await fetch("/api/hiking/forecast?" + params.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(12_000),
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {}
    const code = typeof record.error === "string" ? record.error : "WEATHER_UNAVAILABLE"
    const message = typeof record.message === "string" ? record.message : "Prakiraan BMKG belum dapat dimuat."
    throw new Error(code + ": " + message)
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Respons prakiraan cuaca tidak valid.")
  }
  return payload as HikingWeatherResponse
}
