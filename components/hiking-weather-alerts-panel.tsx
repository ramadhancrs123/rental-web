"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ExternalLink, RefreshCw, ShieldAlert } from "lucide-react"
import HikingInfoDialog from "@/components/hiking-info-dialog"
import { type HikingWeatherAlert, requestHikingCatalog, formatIndonesianDate } from "@/lib/hiking"

type Props = { province?: string | null; regency?: string | null }

function severityLabel(value?: string | null) {
  if (!value) return "Tingkat peringatan belum dijelaskan"
  const normalized = value.toLowerCase()
  if (normalized === "extreme") return "Ekstrem"
  if (normalized === "severe") return "Berat"
  if (normalized === "moderate") return "Sedang"
  if (normalized === "minor") return "Rendah"
  return "Peringatan"
}

function severityClass(value?: string | null) {
  const normalized = value?.toLowerCase()
  if (normalized === "extreme" || normalized === "severe") return "bg-red-500/10 text-red-700 dark:text-red-300"
  if (normalized === "moderate") return "bg-amber-500/10 text-amber-800 dark:text-amber-200"
  return "bg-muted text-muted-foreground"
}

function areaLabel(alert: HikingWeatherAlert) {
  const areas = alert.affected_areas ?? []
  if (!areas.length) return "Cakupan area tidak tersedia pada informasi ini."
  return areas.slice(0, 5).map((area) => {
    const values = [area.areaDesc, area.description, area.regency, area.district, area.province]
      .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    return values[0] ?? null
  }).filter(Boolean).join(" · ") || "Periksa cakupan area pada sumber resmi."
}

function alertHref(alert: HikingWeatherAlert) {
  const value = alert.web_url || alert.source_url
  return value?.startsWith("https://") ? value : null
}

export default function HikingWeatherAlertsPanel({ province, regency }: Props) {
  const [items, setItems] = useState<HikingWeatherAlert[]>([])
  const [checkedAt, setCheckedAt] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const [error, setError] = useState(false)
  const [completedKey, setCompletedKey] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const requestKey = (province ?? "") + ":" + retry
  const loading = completedKey !== requestKey

  useEffect(() => {
    const controller = new AbortController()
    requestHikingCatalog<HikingWeatherAlert>({
      resource: "alerts",
      province: province || undefined,
      limit: 10,
    }, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return
        setItems(response.items ?? [])
        setCheckedAt(typeof response.checkedAt === "string" ? response.checkedAt : null)
        setStale(response.stale === true)
        setError(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setItems([])
          setCheckedAt(null)
          setStale(true)
          setError(true)
        }
      })
      .finally(() => { if (!controller.signal.aborted) setCompletedKey(requestKey) })
    return () => controller.abort()
  }, [province, retry, requestKey])

  const visibleItems = loading ? [] : items
  const visibleError = !loading && error
  const visibleStale = !loading && stale
  const visibleCheckedAt = loading ? null : checkedAt

  return (
    <section className="overflow-hidden rounded-3xl border border-border/60 bg-card">
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300"><ShieldAlert className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight">Peringatan cuaca BMKG</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{province ? "Wilayah " + province : "Informasi peringatan cuaca regional"}</p>
        </div>
        <HikingInfoDialog title="Memahami peringatan cuaca" description="Peringatan regional perlu dicocokkan dengan lokasi dan waktu perjalanan.">
          <div className="space-y-3 text-muted-foreground">
            <p>Peringatan dapat mencakup satu wilayah administrasi atau beberapa area sekaligus. Baca cakupan, masa berlaku, dan arahan pada setiap peringatan sebelum bepergian.</p>
            <p>Peringatan regional tidak selalu mewakili kondisi di setiap jalur atau puncak. Tidak adanya peringatan yang ditampilkan bukan jaminan bahwa kondisi aman.</p>
            <p>Konfirmasikan kondisi perjalanan kepada pengelola setempat dan periksa informasi terbaru melalui sumber resmi BMKG.</p>
            {visibleCheckedAt && <p className="text-xs">Pemeriksaan informasi terakhir: {formatIndonesianDate(visibleCheckedAt) ?? visibleCheckedAt}.</p>}
          </div>
        </HikingInfoDialog>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {loading && <div className="space-y-2" role="status" aria-live="polite"><div className="h-16 animate-pulse rounded-2xl bg-muted" /><div className="h-16 animate-pulse rounded-2xl bg-muted" /><span className="sr-only">Memeriksa peringatan cuaca</span></div>}

        {!loading && visibleError && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
            <div className="flex items-start gap-2.5"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" /><p className="text-sm leading-6 text-muted-foreground">Peringatan cuaca belum dapat diperiksa. Periksa langsung sumber resmi BMKG sebelum berangkat.</p></div>
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-semibold transition hover:bg-muted"><RefreshCw className="size-3.5" /> Coba lagi</button>
          </div>
        )}

        {!loading && !error && visibleItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-4">
            <p className="text-sm font-semibold">Tidak ada peringatan yang ditampilkan saat ini</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Ini bukan jaminan kondisi aman. Periksa informasi resmi dan kondisi setempat sebelum berangkat.</p>
          </div>
        )}

        {!loading && !error && visibleItems.map((alert) => {
          const href = alertHref(alert)
          return (
            <article key={alert.alert_id} className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.045] p-3.5 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold " + severityClass(alert.severity)}>{severityLabel(alert.severity)}</span>
                    <span className="text-[10px] text-muted-foreground">{formatIndonesianDate(alert.expires_at) ? "Berakhir " + formatIndonesianDate(alert.expires_at) : "Masa berlaku tidak tersedia"}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold leading-5">{alert.headline || alert.event || "Peringatan cuaca"}</h3>
                  {alert.description && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{alert.description}</p>}
                  {alert.instruction && <p className="mt-2 line-clamp-2 rounded-xl bg-background/75 px-3 py-2 text-xs leading-5"><span className="font-semibold">Arahan:</span> {alert.instruction}</p>}
                </div>
                <HikingInfoDialog title={alert.headline || alert.event || "Rincian peringatan"} description="Cakupan wilayah, masa berlaku, dan arahan dari sumber peringatan.">
                  <div className="space-y-4">
                    {alert.description && <p className="whitespace-pre-line text-muted-foreground">{alert.description}</p>}
                    {alert.instruction && <div className="rounded-xl bg-amber-500/[0.07] p-3"><p className="text-xs font-semibold">Arahan</p><p className="mt-1 text-sm leading-6">{alert.instruction}</p></div>}
                    <div className="space-y-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      <p><span className="font-semibold text-foreground">Cakupan:</span> {areaLabel(alert)}</p>
                      <p><span className="font-semibold text-foreground">Mulai:</span> {formatIndonesianDate(alert.effective_at) ?? "Tidak tersedia"}</p>
                      <p><span className="font-semibold text-foreground">Berakhir:</span> {formatIndonesianDate(alert.expires_at) ?? "Tidak tersedia"}</p>
                    </div>
                    {href && <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">Buka informasi BMKG <ExternalLink className="size-3.5" /></a>}
                  </div>
                </HikingInfoDialog>
              </div>
            </article>
          )
        })}

        {visibleStale && !error && <p className="rounded-xl bg-amber-500/[0.07] px-3 py-2 text-[11px] leading-5 text-amber-800 dark:text-amber-200">Pembaruan peringatan sedang terkendala. Informasi yang tersimpan mungkin belum mencerminkan kondisi terbaru.</p>}
        <div className="border-t border-border/60 pt-3 text-[10px] leading-5 text-muted-foreground">
          <p>Sumber: <a href="https://www.bmkg.go.id/" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2 hover:text-foreground">BMKG</a>. {visibleCheckedAt ? "Diperiksa " + (formatIndonesianDate(visibleCheckedAt) ?? visibleCheckedAt) + "." : "Waktu pemeriksaan tidak tersedia."}</p>
          {regency && <p>Area destinasi: {regency}, {province}.</p>}
        </div>
      </div>
    </section>
  )
}
