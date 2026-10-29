import sourceJson from "@/gpx/jawa-barat/jalur_pendakian_jawa_barat.json"
import type { HikingDestination } from "@/lib/hiking"

type SourceWeatherLocation = {
  adm4?: string
  village?: string
  routeReference?: string
  district?: string
  regency?: string
  province?: string
  forecastPageUrl?: string
  verificationStatus?: string
  forecastScope?: string
  referenceSurfaceElevationCrossCheck?: {
    demConsensusCandidateM?: number | null
    status?: string
  }
}

export type HikingSourceCheckpoint = {
  candidateId?: string
  sourceIndex?: number
  name: string
  typeCandidate?: string
  locationRoleCandidate?: string
  latitude?: number | null
  longitude?: number | null
  publicationStatus?: string
  trailAssociationStatus?: string
  elevation?: {
    gpxEleM?: number | null
    waypointNameLabelM?: number | null
    candidateElevationM?: number | null
    verifiedElevationM?: number | null
    verifiedAt?: string | null
    verificationStatus?: string
    demCrossCheck?: {
      demConsensusCandidateM?: number | null
      comparisonStatus?: string
      interpretation?: string
    }
  }
  temperatureElevationCorrection?: {
    targetElevationM?: number | null
    referenceElevationM?: number | null
    lapseRateCPerKm?: number | null
    calculationEligible?: boolean
    previewOnly?: boolean
    publicDisplayEligible?: boolean
    publicationGateStatus?: string
  }
  temperatureEstimateCalculationEligible?: boolean
  temperatureEstimatePublicDisplayEligible?: boolean
  temperatureEstimateQualityStatus?: string
  trackProximity?: {
    nearestTrackCandidate?: {
      trackCandidateId?: string
      trackName?: string
      distanceToTrackM?: number | null
    } | null
  }
}

export type HikingSourceTrackCandidate = {
  candidateId?: string
  sourceTrackName?: string
  sourceTrackIndex?: number
  segmentCount?: number
  pointCount?: number
  pointsWithElevation?: number
  elevationCoveragePercent?: number
  associationStatus?: string
  verificationStatus?: string
  note?: string
}

export type HikingSourceRow = {
  name: string
  mapTitle?: string
  mapId?: string
  routeLabelText?: string
  gpxUrl?: string | null
  kmzUrl?: string | null
  pdfUrl?: string | null
  province?: string
  sourcePage?: string
  googleMapsViewUrl?: string
  googleMapsEmbedUrl?: string
  embedVerified?: boolean
  mapLabelsNote?: string
  weatherLocation?: SourceWeatherLocation
  localGpxAnalysis?: {
    status?: string
    fileName?: string
    rightsReviewStatus?: string
    sourceDataMeaning?: string
    trackCount?: number
    trackPointCount?: number
    trackElevationQuality?: string
    checkpointCandidates?: HikingSourceCheckpoint[]
    trackCandidates?: HikingSourceTrackCandidate[]
    routeCandidates?: unknown[]
  }
}

type SourceDocument = {
  schemaVersion?: string
  title?: string
  sourceName?: string
  sourceUrl?: string
  rows?: HikingSourceRow[]
}

const document = sourceJson as unknown as SourceDocument
const rows = Array.isArray(document.rows) ? document.rows : []

export function normalizeMountainKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ciremai/g, "ceremai")
    .replace(/gunung/g, " ")
    .replace(/&/g, " dan ")
    .replace(/[–—_./]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function slugifyMountainName(value: string) {
  return normalizeMountainKey(value).replace(/ /g, "-")
}

function resolveRow(key: string) {
  const normalized = normalizeMountainKey(key)
  const slug = normalized.replace(/ /g, "-")
  return rows.find((row) => {
    const rowName = normalizeMountainKey(row.name)
    const rowTitle = normalizeMountainKey(row.mapTitle ?? "")
    return rowName === normalized || rowTitle === normalized || slugifyMountainName(row.name) === slug
  }) ?? rows.find((row) => {
    const rowName = normalizeMountainKey(row.name)
    return normalized.length >= 5 && (rowName.startsWith(normalized) || normalized.startsWith(rowName))
  }) ?? null
}

function cleanUrl(value?: string | null) {
  return typeof value === "string" && value.startsWith("https://") ? value : null
}

export function getHikingSourceByNameOrSlug(value: string): HikingSourceRow | null {
  return resolveRow(value)
}

export function getHikingSourceByAdm4(adm4: string): HikingSourceRow | null {
  return rows.find((row) => row.weatherLocation?.adm4 === adm4 && row.weatherLocation?.verificationStatus === "bmkg_forecast_page_verified") ?? null
}

export function getHikingDestinationForSource(row: HikingSourceRow): HikingDestination {
  const sourceSlug = slugifyMountainName(row.name)
  const weather = row.weatherLocation
  const reference = weather?.referenceSurfaceElevationCrossCheck
  const referenceElevation = typeof reference?.demConsensusCandidateM === "number" && Number.isFinite(reference.demConsensusCandidateM)
    && reference.status === "dem_models_agree_provisional"
    ? reference.demConsensusCandidateM
    : null
  return {
    mountain_id: "source-" + (row.mapId || sourceSlug),
    slug: sourceSlug,
    name: row.name,
    province: row.province || weather?.province || "Jawa Barat",
    regency: weather?.regency || null,
    elevation_m: null,
    verified_at: null,
    bmkg_adm4_codes: weather?.adm4 ? [weather.adm4] : [],
    dataAvailability: { coordinates: false, description: false, elevation: false, verified: false },
    sourceSlug,
    sourceMapEmbedUrl: cleanUrl(row.googleMapsEmbedUrl) ?? (row.mapId ? "https://www.google.com/maps/d/u/0/embed?mid=" + encodeURIComponent(row.mapId) : null),
    sourceMapViewUrl: row.mapId ? "https://www.google.com/maps/d/viewer?mid=" + encodeURIComponent(row.mapId) : cleanUrl(row.googleMapsViewUrl),
    sourcePageUrl: cleanUrl(row.sourcePage) ?? cleanUrl(document.sourceUrl),
    sourceGpxUrl: cleanUrl(row.gpxUrl),
    sourceKmzUrl: cleanUrl(row.kmzUrl),
    sourcePdfUrl: cleanUrl(row.pdfUrl),
    sourceMapTitle: row.mapTitle || row.name,
    sourceRouteLabelText: typeof row.routeLabelText === "string" ? row.routeLabelText : null,
    sourceMapLabelsNote: typeof row.mapLabelsNote === "string" ? row.mapLabelsNote : null,
    weatherAdm4: weather?.verificationStatus === "bmkg_forecast_page_verified" ? weather.adm4 ?? null : null,
    weatherVillage: weather?.village ?? null,
    weatherRouteReference: weather?.routeReference ?? null,
    weatherReferenceElevationM: referenceElevation,
    weatherReferenceElevationStatus: reference?.status ?? null,
    weatherForecastPageUrl: cleanUrl(weather?.forecastPageUrl),
  }
}

export function getHikingSourceDestination(value: string): HikingDestination | null {
  const row = getHikingSourceByNameOrSlug(value)
  return row ? getHikingDestinationForSource(row) : null
}

export function getPublicHikingDestinations(): HikingDestination[] {
  return rows.map(getHikingDestinationForSource).sort((left, right) => left.name.localeCompare(right.name, "id"))
}

export function getPublicWeatherReference(value: string) {
  const row = getHikingSourceByNameOrSlug(value)
  if (!row) return null
  const destination = getHikingDestinationForSource(row)
  if (!destination.weatherAdm4) return null
  return {
    row,
    sourceSlug: destination.sourceSlug,
    adm4: destination.weatherAdm4,
    village: destination.weatherVillage,
    referenceElevationM: destination.weatherReferenceElevationM,
    referenceElevationStatus: destination.weatherReferenceElevationStatus,
    forecastPageUrl: destination.weatherForecastPageUrl,
  }
}

export function getHikingSourceCounts(row: HikingSourceRow) {
  const candidates = row.localGpxAnalysis?.checkpointCandidates ?? []
  return {
    candidateCount: candidates.length,
    calculationEligibleCount: candidates.filter((point) => point.temperatureEstimateCalculationEligible === true).length,
    publicDisplayEligibleCount: candidates.filter((point) => point.temperatureEstimatePublicDisplayEligible === true && point.publicationStatus === "published").length,
  }
}
