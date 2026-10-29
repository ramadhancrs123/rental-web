"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle, ChevronDown, Cloud, CloudFog, CloudLightning, CloudRain,
  CloudSnow, CloudSun, Droplets, RefreshCw, Sun, Wind,
} from "lucide-react"

type CurrentWeather = {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  is_day: number
  precipitation: number
  weather_code: number
  wind_speed_10m: number
  wind_gusts_10m: number
}
type HourlyWeather = {
  time: string[]
  temperature_2m: number[]
  precipitation_probability: number[]
  precipitation: number[]
  weather_code: number[]
  wind_speed_10m: number[]
}
type DailyWeather = {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_probability_max: number[]
  sunrise: string[]
  sunset: string[]
}
type ForecastData = {
  destination: string
  source: string
  forecast: {
    current: CurrentWeather
    hourly: HourlyWeather
    daily: DailyWeather
    timezone: string
    current_units?: Record<string, string>
  }
}
type ForecastState = { data: ForecastData; fetchedAt: number }
const forecastCache = new Map<string, ForecastState>()

function describeWeather(code: number) {
  if (code === 0) return "Cerah"
  if ([1, 2].includes(code)) return "Cerah berawan"
  if (code === 3) return "Berawan"
  if ([45, 48].includes(code)) return "Berkabut"
  if ([51, 53, 55, 56, 57].includes(code)) return "Gerimis"
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Hujan"
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Salju"
  if ([95, 96, 99].includes(code)) return "Hujan petir"
  return "Kondisi berubah-ubah"
}

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if ([95, 96, 99].includes(code)) return <CloudLightning className={className} />
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain className={className} />
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className={className} />
  if ([45, 48].includes(code)) return <CloudFog className={className} />
  if ([1, 2].includes(code)) return <CloudSun className={className} />
  if (code === 0) return <Sun className={className} />
  return <Cloud className={className} />
}

function formatHour(value: string) {
  const date = new Date(value.endsWith("+07:00") ? value : value + "+07:00")
  if (Number.isNaN(date.getTime())) return value.slice(11, 16)
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).format(date)
}
function formatDay(value: string) {
  const date = new Date(value + "T12:00:00+07:00")
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(date)
}

export default function MountainWeather({ destinationId, destinationName }: { destinationId: string; destinationName: string }) {
  const [expanded, setExpanded] = useState(false)
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!expanded) return
    let cancelled = false
    const cached = forecastCache.get(destinationId)
    if (cached && Date.now() - cached.fetchedAt < 15 * 60 * 1000 && retry === 0) {
      const id = window.setTimeout(() => {
        if (cancelled) return
        setData(cached.data)
        setError(null)
      }, 0)
      return () => { cancelled = true; window.clearTimeout(id) }
    }

    const id = window.setTimeout(() => {
      if (cancelled) return
      setLoading(true)
      setError(null)
      fetch("/api/weather/" + encodeURIComponent(destinationId), { headers: { Accept: "application/json" } })
        .then(async (response) => {
          const payload = await response.json()
          if (!response.ok) throw new Error(payload?.error || "Prakiraan cuaca tidak dapat dimuat.")
          return payload as ForecastData
        })
        .then((payload) => {
          if (cancelled) return
          forecastCache.set(destinationId, { data: payload, fetchedAt: Date.now() })
          setData(payload)
          setError(null)
          setLoading(false)
        })
        .catch((cause: unknown) => {
          if (cancelled) return
          setError(cause instanceof Error ? cause.message : "Cuaca tidak dapat dimuat.")
          setLoading(false)
        })
    }, 0)

    return () => { cancelled = true; window.clearTimeout(id) }
  }, [expanded, destinationId, retry])

  const isCurrentDestination = data?.destination === destinationName
  const effectiveLoading = !error && (loading || (expanded && Boolean(data) && !isCurrentDestination))
  const current = isCurrentDestination ? data?.forecast?.current : undefined
  const hourly = isCurrentDestination ? data?.forecast?.hourly : undefined
  const daily = isCurrentDestination ? data?.forecast?.daily : undefined
  const nextHours = hourly && current
    ? hourly.time.map((time, index) => ({ time, index })).filter((item) => item.time > current.time).slice(0, 6)
    : []

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-border/70 bg-background">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-muted/45 sm:px-5"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300"><CloudSun className="size-5" /></span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Prakiraan cuaca pegunungan</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{destinationName} · perkiraan 3 hari</span>
          </span>
        </span>
        {current && !loading && !error && <span className="hidden shrink-0 text-sm font-semibold sm:inline">{Math.round(current.temperature_2m)}°C</span>}
        <ChevronDown className={"size-4 shrink-0 text-muted-foreground transition-transform duration-300 " + (expanded ? "rotate-180" : "")} />
      </button>

      {expanded && (
        <div className="border-t border-border/60 p-4 sm:p-5">
          {effectiveLoading && (
            <div className="grid gap-3" aria-live="polite" role="status">
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
              <div className="h-16 animate-pulse rounded-2xl bg-muted" />
              <span className="text-xs text-muted-foreground">Memuat prakiraan untuk {destinationName}…</span>
            </div>
          )}

          {!effectiveLoading && error && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2.5"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" /><p className="text-sm leading-5 text-muted-foreground">{error}</p></div>
              <button type="button" onClick={() => { setData(null); setError(null); setRetry((n) => n + 1) }} className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-border px-3.5 text-xs font-semibold transition hover:bg-muted"><RefreshCw className="size-3.5" /> Coba lagi</button>
            </div>
          )}

          {!effectiveLoading && !error && isCurrentDestination && data && current && daily && (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-primary/5 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-center gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-card text-primary shadow-sm"><WeatherIcon code={current.weather_code} className="size-8" /></span>
                  <div>
                    <p className="text-sm font-semibold">{describeWeather(current.weather_code)}</p>
                    <p className="mt-0.5 text-3xl font-semibold tracking-tight">{Math.round(current.temperature_2m)}°C</p>
                    <p className="mt-1 text-xs text-muted-foreground">Terasa seperti {Math.round(current.apparent_temperature)}°C</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
                  <div className="rounded-xl border border-border/50 bg-card/75 p-3"><Droplets className="size-4 text-sky-600 dark:text-sky-300" /><p className="mt-2 text-xs text-muted-foreground">Kelembapan</p><p className="text-sm font-semibold">{Math.round(current.relative_humidity_2m)}%</p></div>
                  <div className="rounded-xl border border-border/50 bg-card/75 p-3"><Wind className="size-4 text-sky-600 dark:text-sky-300" /><p className="mt-2 text-xs text-muted-foreground">Angin</p><p className="text-sm font-semibold">{Math.round(current.wind_speed_10m)} km/j</p></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3"><h4 className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Perkiraan 3 hari</h4><span className="text-[10px] text-muted-foreground">Waktu WIB</span></div>
                <div className="grid grid-cols-3 gap-2">
                  {daily.time.map((day, index) => (
                    <div key={day} className="min-w-0 rounded-xl border border-border/60 p-3 text-center">
                      <p className="truncate text-[11px] font-medium text-muted-foreground">{formatDay(day)}</p>
                      <WeatherIcon code={daily.weather_code[index] ?? 3} className="mx-auto mt-3 size-5 text-primary" />
                      <p className="mt-2 text-sm font-semibold">{Math.round(daily.temperature_2m_max[index] ?? 0)}°</p>
                      <p className="text-xs text-muted-foreground">{Math.round(daily.temperature_2m_min[index] ?? 0)}°</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-sky-700 dark:text-sky-300"><Droplets className="size-3" />{Math.round(daily.precipitation_probability_max[index] ?? 0)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {nextHours.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Jam berikutnya</h4>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {nextHours.map(({ time, index }) => (
                      <div key={time} className="min-w-[74px] rounded-xl border border-border/60 px-3 py-3 text-center">
                        <p className="text-[11px] text-muted-foreground">{formatHour(time)}</p>
                        <WeatherIcon code={hourly?.weather_code[index] ?? 3} className="mx-auto mt-2 size-4 text-primary" />
                        <p className="mt-2 text-sm font-semibold">{Math.round(hourly?.temperature_2m[index] ?? 0)}°</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-sky-700 dark:text-sky-300"><Droplets className="size-3" />{Math.round(hourly?.precipitation_probability[index] ?? 0)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] leading-5 text-muted-foreground">
                Sumber: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2 hover:text-foreground">Open-Meteo</a>. Ini perkiraan model cuaca, bukan pengamatan langsung di puncak. Cuaca gunung dapat berubah cepat; periksa informasi pengelola, peringatan resmi, dan kondisi jalur sebelum berangkat.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
