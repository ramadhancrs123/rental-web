import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, CheckCircle2, ExternalLink, MapPin, Mountain, Route } from "lucide-react"
import BookingNoticeDialog from "@/components/booking-notice-dialog"
import GoogleMapsEmbed from "@/components/google-maps-embed"
import HikingWeatherPanel from "@/components/hiking-weather-panel"
import HikingWeatherAlertsPanel from "@/components/hiking-weather-alerts-panel"
import { HikingAdvisories, HikingMediaSlots } from "@/components/hiking-information-panels"
import HikingSourceRoutes from "@/components/hiking-source-routes"
import { getHikingSourceByNameOrSlug, getHikingDestinationForSource, type HikingSourceCheckpoint } from "@/lib/hiking-source"
import { formatElevation, type HikingCheckpoint } from "@/lib/hiking"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ mountainSlug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { mountainSlug } = await params
  const row = getHikingSourceByNameOrSlug(mountainSlug)
  const destination = row ? getHikingDestinationForSource(row) : null
  return {
    title: (destination?.name ?? "Detail Destinasi") + " | Akasha Outdoor Rent",
    description: "Peta, kandidat jalur sumber, informasi wilayah, dan referensi prakiraan cuaca untuk " + (destination?.name ?? "destinasi pendakian") + ".",
    alternates: { canonical: "/destinasi/" + encodeURIComponent(mountainSlug) },
  }
}

function mountainLocation(mountain: ReturnType<typeof getHikingDestinationForSource>) {
  return [mountain.regency, mountain.province].filter(Boolean).join(", ") || "Wilayah belum dipublikasikan"
}

function safeHttps(url?: string | null) {
  return url?.startsWith("https://") ? url : null
}

function asWeatherCheckpoints(points: HikingSourceCheckpoint[]): HikingCheckpoint[] {
  return points.map((point) => ({
    checkpoint_id: point.candidateId,
    sequence_number: point.sourceIndex ?? null,
    name: point.name,
    checkpoint_type: point.typeCandidate ?? point.locationRoleCandidate ?? null,
    latitude: point.latitude ?? null,
    longitude: point.longitude ?? null,
    // A DEM candidate is deliberately not passed as a verified checkpoint elevation.
    elevation_m: point.elevation?.verifiedElevationM ?? null,
    verified_at: point.elevation?.verifiedAt ?? null,
    temperature_estimate_public_eligible:
      point.temperatureEstimatePublicDisplayEligible === true &&
      point.temperatureElevationCorrection?.publicDisplayEligible === true &&
      point.publicationStatus === "published" &&
      point.elevation?.verifiedElevationM != null,
  }))
}

export default async function MountainDetailPage({ params }: PageProps) {
  const { mountainSlug } = await params
  // JSON is the primary and only catalog source for this public detail workflow for now.
  const sourceRow = getHikingSourceByNameOrSlug(mountainSlug)
  if (!sourceRow) notFound()
  const mountain = getHikingDestinationForSource(sourceRow)
  const sourceDestination = mountain
  const location = mountainLocation(mountain)
  const sourceMapEmbedUrl = safeHttps(sourceDestination.sourceMapEmbedUrl)
  const mapViewUrl = safeHttps(sourceDestination.sourceMapViewUrl)
  const sourcePageUrl = safeHttps(sourceDestination.sourcePageUrl)
  const sourceGpxUrl = safeHttps(sourceDestination.sourceGpxUrl)
  const sourceKmzUrl = safeHttps(sourceDestination.sourceKmzUrl)
  const sourcePdfUrl = safeHttps(sourceDestination.sourcePdfUrl)
  const candidatePoints = sourceRow.localGpxAnalysis?.checkpointCandidates ?? []
  const weatherCheckpoints = asWeatherCheckpoints(candidatePoints)
  const previewEligibleCount = candidatePoints.filter((point) => point.temperatureEstimateCalculationEligible === true).length
  const temperaturePublicEligibleCount = candidatePoints.filter((point) => point.temperatureEstimatePublicDisplayEligible === true && point.temperatureElevationCorrection?.publicDisplayEligible === true && point.publicationStatus === "published" && point.elevation?.verifiedElevationM != null).length

  return (
    <div className="overflow-clip bg-background text-foreground">
      <section className="px-4 pb-4 pt-6 sm:px-6 sm:pb-5 sm:pt-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/destinasi" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-3.5" /> Semua destinasi</Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow"><Mountain className="size-3.5" /> Detail destinasi</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">{mountain.name}</h1>
              {mountain.verified_at && mountain.elevation_m != null && <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-3.5" /> Elevasi terverifikasi · {formatElevation(mountain.elevation_m)}</p>}
            </div>
            <a href="#jalur" className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-semibold transition hover:bg-muted">Lihat jalur dari JSON <Route className="size-3.5" /></a>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <GoogleMapsEmbed
            src={sourceMapEmbedUrl}
            title={"Peta " + sourceDestination.sourceMapTitle}
            viewUrl={mapViewUrl}
            searchQuery={mountain.name + ", " + location + ", Indonesia"}
            frameClassName="h-[350px] sm:h-[460px] lg:h-[min(62vh,620px)]"
            caption="Peta sumber dari JSON. Penanda dan label berasal dari peta/rekaman terdahulu dan bukan pengesahan rute aktif atau titik yang telah diverifikasi."
          />
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <p className="flex items-center gap-2 text-sm font-medium"><MapPin className="size-4 shrink-0 text-primary" /> {location}</p>
            <div className="flex flex-wrap gap-2">
              <BookingNoticeDialog label="Pesan tiket pendakian" purpose="hiking-ticket" itemName={mountain.name} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90" />
              {mapViewUrl && <a href={mapViewUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold transition hover:bg-muted">Buka map <ExternalLink className="size-3.5" /></a>}
            </div>
          </div>
          {sourceRow && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {sourcePageUrl && <a href={sourcePageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">Sumber data ASTACALA <ExternalLink className="size-3.5" /></a>}
            {sourceGpxUrl && <a href={sourceGpxUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium hover:bg-muted">GPX sumber <ExternalLink className="size-3" /></a>}
            {sourceKmzUrl && <a href={sourceKmzUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium hover:bg-muted">KMZ sumber <ExternalLink className="size-3" /></a>}
            {sourcePdfUrl && <a href={sourcePdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium hover:bg-muted">Dokumen PDF <ExternalLink className="size-3" /></a>}
          </div>}
        </div>
      </section>

      <section className="px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <article className="rounded-3xl border border-border/60 bg-card p-5 sm:p-7">
            <span className="section-eyebrow"><Mountain className="size-3.5" /> Tentang destinasi</span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Kenali wilayahnya</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Informasi awal destinasi bersumber dari katalog JSON pendakian Jawa Barat. Detail operasional dan status jalur perlu dipastikan kembali ke pengelola setempat sebelum perjalanan.</p>
            <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
              <div className="flex items-start justify-between gap-4"><span className="text-xs text-muted-foreground">Wilayah</span><span className="text-right text-sm font-medium">{location}</span></div>
              <div className="flex items-start justify-between gap-4"><span className="text-xs text-muted-foreground">Sumber data</span><span className="text-right text-sm font-medium">JSON · versi 2.3.0</span></div>
              {sourceRow.localGpxAnalysis?.trackCount != null && <div className="flex items-start justify-between gap-4"><span className="text-xs text-muted-foreground">Track GPX terdeteksi</span><span className="text-right text-sm font-medium">{sourceRow.localGpxAnalysis.trackCount}</span></div>}
              {sourceRow.localGpxAnalysis?.trackElevationQuality && <div className="flex items-start justify-between gap-4"><span className="text-xs text-muted-foreground">Kualitas elevasi track</span><span className="text-right text-sm font-medium">{sourceRow.localGpxAnalysis.trackElevationQuality.replaceAll("_", " ")}</span></div>}
            </div>
          </article>
          <div className="rounded-3xl border border-border/60 bg-card p-5 sm:p-7">
            <span className="section-eyebrow"><Route className="size-3.5" /> Sebelum mendaki</span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">Cek sumber dan kondisi</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Peta dan titik kandidat membantu orientasi awal, tetapi tidak memastikan jalur dibuka, aman, atau bisa dilalui. Cek pengelola, cuaca, perizinan, dan kondisi terbaru sebelum berangkat.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#cuaca" className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs font-semibold transition hover:bg-muted">Lihat prakiraan cuaca <ArrowUpRight className="size-3.5" /></a>
              <a href="#jalur" className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs font-semibold transition hover:bg-muted">Lihat data jalur <ArrowUpRight className="size-3.5" /></a>
            </div>
          </div>
        </div>
      </section>

      <HikingSourceRoutes row={sourceRow} />

      <section id="cuaca" className="scroll-mt-24 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 max-w-2xl">
            <span className="section-eyebrow"><Mountain className="size-3.5" /> Cuaca dan suhu</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Prakiraan wilayah dan estimasi elevasi</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Data prakiraan dan referensi elevasi dibaca dari JSON; prakiraan BMKG mewakili wilayah akses, bukan kondisi aktual puncak.</p>
          </div>
          <HikingWeatherPanel
            sourceMountainSlug={sourceDestination.sourceSlug}
            expectedAdm4={sourceDestination.weatherAdm4}
            referenceElevationM={sourceDestination.weatherReferenceElevationM}
            referenceElevationStatus={sourceDestination.weatherReferenceElevationStatus}
            checkpoints={weatherCheckpoints}
            allowPointTemperatureEstimates={true}
            sourceTemperaturePreviewCount={previewEligibleCount}
            sourceTemperaturePublicEligibleCount={temperaturePublicEligibleCount}
          />
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/20 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <HikingWeatherAlertsPanel province={mountain.province} regency={mountain.regency} />
          <HikingAdvisories items={[]} unavailable />
          <HikingMediaSlots mountainName={mountain.name} />
        </div>
      </section>
    </div>
  )
}
