"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, CloudSun, Droplets, RefreshCw, Wind } from "lucide-react"
import { type HikingWeatherResponse, requestSourceHikingWeather } from "@/lib/hiking"

type Props = { sourceSlug: string; destinationName: string; adm4?: string | null; compact?: boolean; lazy?: boolean }
type ForecastPeriod = Record<string, unknown>

function getPeriods(data: HikingWeatherResponse): ForecastPeriod[] {
  const periods = (data.forecast ?? []).flatMap((group) => {
    const cuaca = group.cuaca
    return Array.isArray(cuaca) ? cuaca.flat().filter((item): item is ForecastPeriod => Boolean(item && typeof item === "object")) : []
  })
  const unique = new Map<string, ForecastPeriod>()
  const now = Date.now()
  for (const item of periods) {
    const datetime = typeof item.local_datetime === "string" ? item.local_datetime : typeof item.datetime === "string" ? item.datetime : null
    if (!datetime) continue
    const parsed = new Date(datetime)
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() < now - 60 * 60 * 1000) continue
    if (!unique.has(datetime)) unique.set(datetime, item)
  }
  return [...unique.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, item]) => item)
}

function num(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

function periodLabel(value: unknown) {
  if (typeof value !== "string") return "Periode prakiraan"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(date)
}

export default function DestinationWeatherSummary({ sourceSlug, destinationName, adm4, compact = false, lazy = false }: Props) {
  const [resultState, setResultState] = useState<{ key: string; data: HikingWeatherResponse | null; error: boolean } | null>(null)
  const [retry, setRetry] = useState(0)
  const [isVisible, setIsVisible] = useState(!lazy)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const requestKey = sourceSlug + ":" + (adm4 ?? "") + ":" + retry
  const loading = isVisible && resultState?.key !== requestKey
  const data = loading || !isVisible ? null : resultState?.key === requestKey ? resultState.data : null
  const error = isVisible && resultState?.key === requestKey && resultState.error

  useEffect(() => {
    if (!lazy || isVisible || !containerRef.current) return
    if (typeof IntersectionObserver === "undefined") { const timer = window.setTimeout(() => setIsVisible(true), 0); return () => window.clearTimeout(timer) }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, { rootMargin: "180px 0px" })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [lazy, isVisible])

  useEffect(() => {
    if (!isVisible) return
    const controller = new AbortController()
    requestSourceHikingWeather(adm4 ? { adm4 } : { mountainSlug: sourceSlug }, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setResultState({ key: requestKey, data: result, error: false }) })
      .catch(() => { if (!controller.signal.aborted) setResultState({ key: requestKey, data: null, error: true }) })
    return () => controller.abort()
  }, [sourceSlug, adm4, retry, requestKey, isVisible])

  const periods = data ? getPeriods(data) : []
  const current = periods[0]
  const temperature = num(current?.t)
  const rain = num(current?.tp)
  const wind = num(current?.ws)
  const time = current?.local_datetime ?? current?.datetime

  if (compact) {
    return (
      <div ref={containerRef} className="min-h-[43px] border-t border-border/50 px-4 py-2.5" aria-live="polite">
        <div className="flex items-center gap-2.5">
          <CloudSun className="size-3.5 shrink-0 text-sky-600 dark:text-sky-300" />
          {!isVisible ? <p className="text-[10px] text-muted-foreground">Ringkasan cuaca dimuat saat kartu terlihat.</p> : loading ? <p className="text-[10px] text-muted-foreground">Memuat prakiraan BMKG…</p> : error || !current ? (
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2"><p className="truncate text-[10px] text-muted-foreground">Cuaca belum tersedia</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="shrink-0 text-[10px] font-semibold text-primary">Coba lagi</button></div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-[10px] font-medium text-muted-foreground">{typeof current.weather_desc === "string" ? current.weather_desc : "Prakiraan tersedia"} · {periodLabel(time)}</p><p className="mt-0.5 text-xs font-semibold">{temperature === null ? "Suhu tidak tersedia" : temperature + "°C"} <span className="font-normal text-muted-foreground">· wilayah {data?.location.village}</span></p></div><span className="rounded-full bg-sky-500/10 px-2 py-1 text-[9px] font-semibold text-sky-700 dark:text-sky-300">BMKG</span></div>
          )}
        </div>
      </div>
    )
  }

  return (
    <section ref={containerRef} className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300"><CloudSun className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Cuaca wilayah · {destinationName}</h3><span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300">BMKG</span></div>
          {loading ? <p className="mt-2 text-xs text-muted-foreground">Mengambil ringkasan prakiraan…</p> : error || !current ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><AlertCircle className="size-3.5 shrink-0" /><span>Ringkasan cuaca belum tersedia. Data tidak diganti dengan perkiraan buatan.</span><button type="button" onClick={() => setRetry((value) => value + 1)} className="inline-flex items-center gap-1 font-semibold text-primary"><RefreshCw className="size-3" /> Coba lagi</button></div>
          ) : (
            <>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{data?.location.village}{data?.location.district ? ", " + data.location.district : ""} · {periodLabel(time)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <div><p className="text-2xl font-semibold tracking-tight">{temperature === null ? "—" : temperature + "°C"}</p><p className="text-[10px] text-muted-foreground">Suhu prakiraan wilayah</p></div>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{typeof current.weather_desc === "string" ? current.weather_desc : "Prakiraan tersedia"}</p><div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">{rain !== null && <span className="inline-flex items-center gap-1"><Droplets className="size-3" /> {rain} mm</span>}{wind !== null && <span className="inline-flex items-center gap-1"><Wind className="size-3" /> {wind} km/j</span>}</div></div>
              </div>
              <p className="mt-3 border-t border-border/60 pt-2.5 text-[10px] leading-4 text-muted-foreground">Berlaku untuk wilayah referensi, bukan prakiraan khusus puncak. Waktu analisis: {data?.analysisDate ?? "tidak tersedia"}.</p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
