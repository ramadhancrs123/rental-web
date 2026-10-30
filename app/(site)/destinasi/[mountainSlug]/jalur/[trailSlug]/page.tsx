import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, Clock3, ExternalLink, MapPin, Mountain, Route, ShieldAlert, Signal } from "lucide-react"
import BookingNoticeDialog from "@/components/booking-notice-dialog"
import HikingInfoDialog from "@/components/hiking-info-dialog"
import HikingMap from "@/components/hiking-map"
import HikingWeatherPanel from "@/components/hiking-weather-panel"
import HikingWeatherAlertsPanel from "@/components/hiking-weather-alerts-panel"
import { HikingAdvisories, HikingMediaGallery } from "@/components/hiking-information-panels"
import {
  type HikingAdvisory,
  type HikingCheckpoint,
  type HikingMedia,
  type HikingMountain,
  type HikingTrail,
  formatDistance,
  formatDuration,
  formatElevation,
  formatIndonesianDate,
  requestHikingCatalog,
} from "@/lib/hiking"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ mountainSlug: string; trailSlug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { mountainSlug, trailSlug } = await params
  return {
    title: "Detail Jalur Pendakian | Akasha Outdoor Rent",
    description: "Peta rute, ringkasan jalur, checkpoint, dan prakiraan cuaca pendakian.",
    alternates: { canonical: "/destinasi/" + encodeURIComponent(mountainSlug) + "/jalur/" + encodeURIComponent(trailSlug) },
  }
}

function safeHttps(url?: string | null) {
  return url?.startsWith("https://") ? url : null
}

function isAstacalaReference(url?: string | null) {
  return Boolean(url?.toLowerCase().includes("astacala.org"))
}

function statusText(value?: string | null, routeSourceUrl?: string | null) {
  if (!value || value.toLowerCase() === "unknown") {
    return isAstacalaReference(routeSourceUrl) ? "Referensi ASTACALA" : "Info perlu dikonfirmasi"
  }
  const labels: Record<string, string> = {
    open: "Dibuka",
    closed: "Ditutup",
    limited: "Akses terbatas",
    temporarily_closed: "Ditutup sementara",
    temporarily_closed_by_weather: "Ditutup sementara karena cuaca",
  }
  return labels[value.toLowerCase()] ?? "Info perlu dikonfirmasi"
}

function statusClass(value?: string | null, routeSourceUrl?: string | null) {
  const normalized = value?.toLowerCase()
  if (normalized === "open") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (normalized?.includes("closed")) return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
  if (normalized === "limited") return "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-200"
  if (!normalized || normalized === "unknown") {
    return isAstacalaReference(routeSourceUrl)
      ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
      : "border-border bg-muted text-muted-foreground"
  }
  return "border-border bg-muted text-muted-foreground"
}

function elevationGain(value?: number | null) {
  return value == null || !Number.isFinite(value) ? null : "+" + new Intl.NumberFormat("id-ID").format(value) + " m"
}

function checkpointCard(point: HikingCheckpoint, index: number) {
  const provisionalElevation = String(point.elevation_quality_status ?? "").toLowerCase().includes("provisional")
  return (
    <li key={point.checkpoint_id ?? point.code ?? point.sequence_number ?? index} className="flex items-start gap-3 rounded-xl border border-border/60 p-3.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{point.sequence_number ?? index + 1}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold">{point.name}</p>
        {point.elevation_m != null && <p className="mt-1 text-[10px] text-muted-foreground">{provisionalElevation ? "Elevasi perkiraan" : "Elevasi tercatat"} · {formatElevation(point.elevation_m)}</p>}
        {point.description && <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{point.description}</p>}
      </div>
    </li>
  )
}

function TrailUnavailable({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-[60vh] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-amber-500/25 bg-amber-500/[0.05] p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300"><Route className="size-5" /></span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
        <Link href="/destinasi" className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Kembali ke destinasi <ArrowUpRight className="size-4" /></Link>
      </div>
    </div>
  )
}

export default async function HikingTrailDetailPage({ params }: PageProps) {
  const { mountainSlug, trailSlug } = await params

  let mountain: HikingMountain | null = null
  let trail: HikingTrail | null = null
  let ticketBookingEnabled = false
  try {
    const [mountainResponse, trailResponse] = await Promise.all([
      requestHikingCatalog<HikingMountain>({ resource: "mountains", mountain_slug: mountainSlug, limit: 1, offset: 0 }),
      requestHikingCatalog<HikingTrail>({ resource: "trails", mountain_slug: mountainSlug, trail_slug: trailSlug, limit: 1, offset: 0 }),
    ])
    mountain = mountainResponse.items?.[0] ?? null
    trail = trailResponse.items?.[0] ?? null
    const flags = trailResponse.featureFlags && typeof trailResponse.featureFlags === "object"
      ? trailResponse.featureFlags as Record<string, unknown> : {}
    ticketBookingEnabled = flags.hikingTicketBookingEnabled === true
  } catch {
    return <TrailUnavailable title="Informasi jalur belum dapat dimuat" message="Informasi jalur sementara tidak dapat diperbarui. Silakan coba kembali beberapa saat lagi." />
  }

  if (!mountain || !trail) notFound()

  const [checkpointResult, advisoryResult, mediaResult] = await Promise.all([
    requestHikingCatalog<HikingCheckpoint>({ resource: "checkpoints", mountain_slug: mountain.slug, trail_slug: trail.slug, limit: 50, offset: 0 })
      .then((response) => ({ items: response.items ?? [], unavailable: false }))
      .catch(() => ({ items: [] as HikingCheckpoint[], unavailable: true })),
    requestHikingCatalog<HikingAdvisory>({ resource: "advisories", mountain_slug: mountain.slug, trail_slug: trail.slug, limit: 20, offset: 0 })
      .then((response) => ({ items: response.items ?? [], unavailable: false }))
      .catch(() => ({ items: [] as HikingAdvisory[], unavailable: true })),
    requestHikingCatalog<HikingMedia>({ resource: "media", mountain_slug: mountain.slug, trail_slug: trail.slug, limit: 20, offset: 0 })
      .then((response) => ({ items: response.items ?? [], unavailable: false }))
      .catch(() => ({ items: [] as HikingMedia[], unavailable: true })),
  ])

  const routeAvailable = Boolean(trail.dataAvailability?.routeGeoJson && trail.route_geojson)
  const marker = {
    mountain_id: mountain.mountain_id,
    slug: mountain.slug,
    name: trail.basecamp_name ? mountain.name + " · " + trail.basecamp_name : mountain.name,
    latitude: trail.basecamp_latitude ?? mountain.latitude ?? null,
    longitude: trail.basecamp_longitude ?? mountain.longitude ?? null,
  }
  const ticketUrl = ticketBookingEnabled ? safeHttps(trail.official_booking_url) : null
  const status = statusText(trail.operational_status, trail.route_source_reference_url)
  const statusSourceUrl = safeHttps(trail.operational_status_source_url)
  const routeSourceUrl = safeHttps(trail.route_source_reference_url)
  const checkpointCount = checkpointResult.items.length

  return (
    <div className="overflow-clip bg-background text-foreground">
      <section className="px-4 pb-5 pt-6 sm:px-6 sm:pb-7 sm:pt-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            <Link href="/destinasi" className="inline-flex items-center gap-1.5 transition hover:text-foreground"><ArrowLeft className="size-3.5" /> Destinasi</Link>
            <span aria-hidden="true">/</span>
            <Link href={"/destinasi/" + mountain.slug} className="max-w-[55vw] truncate transition hover:text-foreground">{mountain.name}</Link>
            <span aria-hidden="true">/</span><span className="text-foreground">Jalur</span>
          </nav>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="section-eyebrow"><Route className="size-3.5" /> Jalur pendakian</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">{trail.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"><Mountain className="size-4 shrink-0 text-primary" />{mountain.name}<span aria-hidden="true">·</span>{[mountain.regency, mountain.province].filter(Boolean).join(", ") || "Wilayah belum tersedia"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold " + statusClass(trail.operational_status, trail.route_source_reference_url)}><ShieldAlert className="size-3.5" />{status}</span>
              <HikingInfoDialog title="Sumber dan batas informasi jalur" description="Keterangan tentang data rute, elevasi, dan status operasional.">
                <div className="space-y-3 text-muted-foreground">
                  <p>Garis rute dan checkpoint ditampilkan berdasarkan data lokasi yang tersedia. Peta ini membantu orientasi dan tidak menggantikan navigasi lapangan.</p>
                  {trail.verified_at && <p>Pemeriksaan data sumber terakhir: {formatIndonesianDate(trail.verified_at) ?? "Waktu tidak tersedia"}. Pemeriksaan struktur data bukan survei kondisi jalur di lapangan.</p>}
                  {trail.operational_status_checked_at && <p>Status operasional terakhir dicatat: {formatIndonesianDate(trail.operational_status_checked_at) ?? "Waktu tidak tersedia"}.</p>}
                  {statusSourceUrl && <a href={statusSourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">Sumber status jalur <ExternalLink className="size-3.5" /></a>}
                  {routeSourceUrl && <a href={routeSourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">Sumber data rute <ExternalLink className="size-3.5" /></a>}
                  <p>Elevasi checkpoint yang bersumber dari model elevasi digital merupakan estimasi dan dapat berbeda dari kondisi sebenarnya.</p>
                </div>
              </HikingInfoDialog>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-7 sm:px-6 sm:pb-9 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <HikingMap
            mountains={[marker]}
            checkpoints={checkpointResult.items}
            routeGeoJson={routeAvailable ? trail.route_geojson : null}
            title={"Peta jalur " + mountain.name + " · " + trail.name}
            frameClassName="h-[380px] sm:h-[480px] lg:h-[min(62vh,640px)]"
            caption={routeAvailable ? "Garis rute dan titik checkpoint membantu mengenali susunan jalur." : "Peta menampilkan titik lokasi yang tersedia. Garis rute belum tersedia."}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 sm:p-4">
            <a href="#informasi-jalur" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-90">Lihat informasi <ArrowUpRight className="size-3.5" /></a>
            {trail.dataAvailability?.gpxDownload === true && <a href={"/api/hiking/route-download?mountain_slug=" + encodeURIComponent(mountain.slug) + "&trail_slug=" + encodeURIComponent(trail.slug)} className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-semibold transition hover:bg-muted"><ArrowDownToLine className="size-3.5" /> Unduh GPX</a>}
            {ticketBookingEnabled && ticketUrl && <BookingNoticeDialog label="Pesan tiket pendakian" purpose="hiking-ticket" itemName={trail.name} officialBookingUrl={ticketUrl} className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-semibold transition hover:bg-muted" />}
            <Link href={"/destinasi/" + mountain.slug} className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"><Mountain className="size-3.5" /> Detail gunung</Link>
          </div>
        </div>
      </section>

      <section id="informasi-jalur" className="scroll-mt-24 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(270px,0.7fr)]">
            <article className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div><span className="section-eyebrow"><Route className="size-3.5" /> Ringkasan jalur</span><h2 className="mt-2 text-lg font-semibold tracking-tight">Informasi perjalanan</h2></div>
                <HikingInfoDialog title="Ringkasan jalur" description="Keterangan tentang angka dan informasi yang tersedia.">
                  <p className="text-muted-foreground">Jarak, kenaikan elevasi, dan durasi merupakan data referensi jalur. Waktu perjalanan aktual dapat berbeda menurut cuaca, kondisi jalur, kesiapan fisik, dan aktivitas istirahat.</p>
                </HikingInfoDialog>
              </div>
              {trail.description ? <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">{trail.description}</p> : <p className="mt-3 text-sm leading-6 text-muted-foreground">Deskripsi jalur belum tersedia.</p>}
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {trail.distance_m != null && <div className="rounded-xl bg-muted/55 p-3"><MapPin className="size-4 text-primary" /><p className="mt-2 text-[10px] text-muted-foreground">Jarak</p><p className="mt-1 text-base font-semibold">{formatDistance(trail.distance_m)}</p></div>}
                {trail.elevation_gain_m != null && <div className="rounded-xl bg-muted/55 p-3"><Mountain className="size-4 text-primary" /><p className="mt-2 text-[10px] text-muted-foreground">Kenaikan</p><p className="mt-1 text-base font-semibold">{elevationGain(trail.elevation_gain_m)}</p></div>}
                {trail.estimated_duration_minutes != null && <div className="rounded-xl bg-muted/55 p-3"><Clock3 className="size-4 text-primary" /><p className="mt-2 text-[10px] text-muted-foreground">Durasi estimasi</p><p className="mt-1 text-base font-semibold">{formatDuration(trail.estimated_duration_minutes)}</p></div>}
                {trail.difficulty_grade != null && <div className="rounded-xl bg-muted/55 p-3"><Signal className="size-4 text-primary" /><p className="mt-2 text-[10px] text-muted-foreground">Grade jalur</p><p className="mt-1 text-base font-semibold">{trail.difficulty_grade}</p></div>}
              </div>
              {trail.basecamp_name && <div className="mt-4 flex items-start gap-3 rounded-xl border border-border/60 p-3.5"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-xs font-semibold">{trail.basecamp_name}</p>{trail.basecamp_address && <p className="mt-1 text-xs leading-5 text-muted-foreground">{trail.basecamp_address}</p>}</div></div>}
            </article>

            <aside className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.045] p-5 sm:p-6">
              <div className="flex items-center gap-2"><ShieldAlert className="size-4 text-amber-700 dark:text-amber-300" /><h2 className="text-sm font-semibold">Status jalur</h2></div>
              <p className="mt-2 text-base font-semibold">{status}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{trail.operational_status && trail.operational_status !== "unknown" ? "Keterangan operasional mengikuti informasi yang tercatat dari sumber jalur." : isAstacalaReference(trail.route_source_reference_url) ? "Data rute merujuk ASTACALA. Label ini menunjukkan asal referensi rute, bukan konfirmasi bahwa jalur sedang dibuka; periksa kembali kepada pengelola." : "Informasi buka atau tutup jalur belum diperbarui. Konfirmasikan langsung kepada pengelola sebelum berangkat."}</p>
              {trail.operational_status_checked_at && <p className="mt-2 text-[10px] text-muted-foreground">Terakhir dicatat: {formatIndonesianDate(trail.operational_status_checked_at) ?? "Waktu tidak tersedia"}</p>}
              <p className="mt-3 border-t border-amber-500/15 pt-3 text-[11px] leading-5 text-muted-foreground">Konfirmasikan kembali kepada pengelola sebelum perjalanan. Status pada katalog dapat berubah.</p>
            </aside>
          </div>

          <section className="mt-5 rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><span className="section-eyebrow"><MapPin className="size-3.5" /> Titik penting</span><h2 className="mt-2 text-lg font-semibold tracking-tight">Checkpoint jalur</h2></div>
              <span className="rounded-full border border-border/70 bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">{checkpointResult.unavailable ? "Belum tersedia" : checkpointCount + " titik"}</span>
            </div>
            {checkpointResult.unavailable ? (
              <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-sm leading-6 text-muted-foreground">Checkpoint belum dapat dimuat. Silakan coba kembali nanti.</p>
            ) : checkpointCount === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">Belum ada checkpoint yang tersedia untuk jalur ini.</p>
            ) : (
              <>
                <ol className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {checkpointResult.items.slice(0, 4).map(checkpointCard)}
                </ol>
                {checkpointCount > 4 && (
                  <details className="group mt-3 rounded-xl border border-border/60">
                    <summary className="cursor-pointer list-none px-3.5 py-3 text-xs font-semibold text-primary outline-none transition hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/50">
                      <span className="group-open:hidden">Lihat {checkpointCount - 4} checkpoint lainnya</span>
                      <span className="hidden group-open:inline">Sembunyikan checkpoint tambahan</span>
                    </summary>
                    <ol className="grid gap-2.5 border-t border-border/60 p-3 sm:grid-cols-2 lg:grid-cols-3">
                      {checkpointResult.items.slice(4).map((point, index) => checkpointCard(point, index + 4))}
                    </ol>
                  </details>
                )}
              </>
            )}
            {checkpointCount > 0 && <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"><HikingInfoDialog title="Tentang checkpoint dan elevasi" description="Cara membaca titik lokasi pada peta."><div className="space-y-2 text-muted-foreground"><p>Checkpoint membantu mengenali titik penting yang tercatat pada rute. Posisi pada peta merupakan data referensi dan tidak menggantikan perangkat navigasi lapangan.</p><p>Elevasi yang berasal dari model elevasi digital bersifat perkiraan, bukan hasil pengukuran langsung.</p></div></HikingInfoDialog><span>Penjelasan checkpoint dan elevasi</span></div>}
          </section>
        </div>
      </section>

      <section className="border-y border-border/60 bg-secondary/20 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-2">
          <HikingWeatherPanel trailSlug={trail.slug} />
          <HikingWeatherAlertsPanel province={mountain.province} regency={mountain.regency} />
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <HikingAdvisories items={advisoryResult.items} unavailable={advisoryResult.unavailable} />
          <HikingMediaGallery items={mediaResult.items} unavailable={mediaResult.unavailable} />
        </div>
      </section>
    </div>
  )
}
