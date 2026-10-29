import { ExternalLink, Mountain, Route, Waypoints } from "lucide-react"
import type { HikingSourceRow, HikingSourceCheckpoint, HikingSourceTrackCandidate } from "@/lib/hiking-source"

function number(value?: number | null, suffix = "") {
  return value == null || !Number.isFinite(value)
    ? null
    : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value) + suffix
}

function checkpointElevation(point: HikingSourceCheckpoint) {
  const verified = point.elevation?.verifiedElevationM
  if (verified != null && Number.isFinite(verified)) {
    return { text: number(verified, " mdpl"), status: "Elevasi terverifikasi" }
  }
  const dem = point.elevation?.demCrossCheck?.demConsensusCandidateM
  if (dem != null && Number.isFinite(dem)) {
    return { text: number(dem, " mdpl"), status: "Estimasi elevasi DEM · belum diverifikasi" }
  }
  const source = point.elevation?.gpxEleM
  if (source != null && Number.isFinite(source)) {
    return { text: number(source, " mdpl"), status: "Elevasi GPX sumber · belum diverifikasi" }
  }
  return { text: null, status: "Elevasi belum tersedia" }
}

function pointRole(value?: string) {
  const roles: Record<string, string> = {
    basecamp: "Basecamp",
    trail_head: "Akses jalur",
    checkpoint: "Pos / titik jalur",
    summit: "Puncak",
    water_source: "Sumber air",
    camping_area: "Area berkemah",
    unknown: "Titik sumber",
  }
  return value ? roles[value] ?? value.replaceAll("_", " ") : "Titik sumber"
}

function SourceCheckpointItem({ point }: { point: HikingSourceCheckpoint }) {
  const elevation = checkpointElevation(point)
  const mapUrl = point.latitude != null && point.longitude != null
    ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(point.latitude + "," + point.longitude)
    : null
  return (
    <li className="flex min-w-0 items-start gap-3 border-t border-border/50 py-3 first:border-t-0">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Waypoints className="size-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-5">{point.name || "Titik tanpa nama"}</p>
        <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{pointRole(point.locationRoleCandidate || point.typeCandidate)}</p>
        {elevation.text && <p className="mt-1 text-[11px] font-medium">{elevation.text}</p>}
        <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{elevation.status}</p>
      </div>
      {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" aria-label={"Buka lokasi " + point.name + " di Google Maps"} className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"><ExternalLink className="size-3.5" /></a>}
    </li>
  )
}

export default function HikingSourceRoutes({ row }: { row: HikingSourceRow }) {
  const analysis = row.localGpxAnalysis
  const tracks = analysis?.trackCandidates ?? []
  const points = [...(analysis?.checkpointCandidates ?? [])].sort((a, b) => (a.sourceIndex ?? 0) - (b.sourceIndex ?? 0))
  const sourceLabels = (row.routeLabelText ?? "").split("|").map((value) => value.trim()).filter(Boolean)
  const hasLocalData = tracks.length > 0 || points.length > 0 || sourceLabels.length > 0

  return (
    <section id="jalur" className="scroll-mt-24 border-y border-border/60 bg-secondary/20 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="section-eyebrow"><Route className="size-3.5" /> Data jalur pendakian</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Jalur dan titik perjalanan</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Diambil langsung dari JSON sumber GPX, tanpa menunggu katalog database. Nama track dan titik masih berstatus kandidat, bukan jalur resmi yang telah diverifikasi.</p>
          </div>
          <span className="rounded-full border border-border/70 bg-card px-3.5 py-2 text-xs font-semibold">{tracks.length} track · {points.length} titik</span>
        </div>

        {!hasLocalData ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6 text-sm leading-6 text-muted-foreground">JSON belum menyediakan track atau titik jalur untuk destinasi ini.</div>
        ) : (
          <>
            {analysis?.rightsReviewStatus === "not_verified" && (
              <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-xs leading-5 text-muted-foreground">
                Data GPX ini masih menunggu pemeriksaan hak penggunaan dan verifikasi lapangan. Titik serta elevasi DEM ditampilkan sebagai referensi awal, bukan jaminan rute aman.
              </div>
            )}

            {tracks.length > 0 ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {tracks.map((track: HikingSourceTrackCandidate, index) => {
                  const assignedPoints = points.filter((point) => point.trackProximity?.nearestTrackCandidate?.trackCandidateId === track.candidateId)
                  return (
                    <article key={track.candidateId ?? track.sourceTrackName ?? index} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                      <div className="flex items-start gap-3 border-b border-border/50 p-4 sm:p-5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Mountain className="size-5" /></span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold">{track.sourceTrackName || "Track sumber " + (index + 1)}</h3>
                          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{number(track.pointCount, " titik GPX") ?? "Jumlah titik tidak tersedia"} · asosiasi jalur belum diverifikasi</p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-800 dark:text-amber-200">Kandidat</span>
                      </div>
                      <div className="p-4 sm:p-5">
                        {assignedPoints.length > 0 ? (
                          <>
                            <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Titik yang berdekatan dengan track ini</p>
                            <ol className="divide-y divide-border/50">
                              {assignedPoints.map((point, pointIndex) => <SourceCheckpointItem key={point.candidateId ?? pointIndex} point={point} />)}
                            </ol>
                          </>
                        ) : (
                          <p className="text-xs leading-5 text-muted-foreground">Belum ada waypoint yang dipadankan ke track ini. Track tetap ditampilkan sebagai data sumber.</p>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-border/60 bg-card p-5">
                <h3 className="text-sm font-semibold">Label jalur yang terdeteksi di peta sumber</h3>
                <div className="mt-3 flex flex-wrap gap-2">{sourceLabels.map((label, index) => <span key={label + index} className="rounded-full border border-border px-3 py-1.5 text-xs">{label}</span>)}</div>
              </div>
            )}

            {points.length > 0 && tracks.length > 0 && (
              <details className="mt-4 rounded-2xl border border-border/60 bg-card">
                <summary className="cursor-pointer px-4 py-3.5 text-xs font-semibold sm:px-5">Lihat semua {points.length} titik kandidat dari JSON</summary>
                <div className="border-t border-border/60 px-4 py-2 sm:px-5">
                  <ol className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
                    {points.map((point, index) => <SourceCheckpointItem key={point.candidateId ?? index} point={point} />)}
                  </ol>
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </section>
  )
}
