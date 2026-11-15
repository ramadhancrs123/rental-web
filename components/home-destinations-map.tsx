"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"
import { LoaderCircle, MapPinned, RefreshCw } from "lucide-react"
import type { HikingMountain } from "@/lib/hiking"
import { requestHikingCatalog } from "@/lib/hiking"

const InteractiveHikingMap = dynamic(() => import("@/components/hiking-map"), {
  ssr: false,
  loading: () => <MapLoading />,
})

type MapState = "preview" | "loading" | "ready" | "error"

type MapMountain = Pick<
  HikingMountain,
  "mountain_id" | "slug" | "name" | "latitude" | "longitude"
>

function MapLoading() {
  return <MapPreview onActivate={() => undefined} isLoading />
}

function MapPreview({
  onActivate,
  isLoading = false,
}: {
  onActivate: () => void
  isLoading?: boolean
}) {
  return (
    <div className="home-map-preview absolute inset-0 overflow-hidden">
      <svg
        className="home-map-preview__art absolute inset-0 size-full"
        viewBox="0 0 760 460"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="home-map-land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d9c9aa" />
            <stop offset="0.52" stopColor="#c6b99d" />
            <stop offset="1" stopColor="#a99e87" />
          </linearGradient>
          <linearGradient id="home-map-route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#b96637" />
            <stop offset="1" stopColor="#ed9a56" />
          </linearGradient>
        </defs>
        <rect width="760" height="460" fill="url(#home-map-land)" />
        <g fill="none" stroke="#fff8e8" strokeOpacity=".46" strokeWidth="1.4">
          <path d="M-50 82C72 2 138 142 250 78S424 8 520 82s166 70 300-5" />
          <path d="M-50 104C72 24 138 164 250 100S424 30 520 104s166 70 300-5" />
          <path d="M-50 126C72 46 138 186 250 122S424 52 520 126s166 70 300-5" />
          <path d="M-50 148C72 68 138 208 250 144S424 74 520 148s166 70 300-5" />
          <path d="M-60 298C80 210 138 356 268 286s184-86 286-8 158 74 270 2" />
          <path d="M-60 320C80 232 138 378 268 308s184-86 286-8 158 74 270 2" />
          <path d="M-60 342C80 254 138 400 268 330s184-86 286-8 158 74 270 2" />
          <path d="M-60 364C80 276 138 422 268 352s184-86 286-8 158 74 270 2" />
        </g>
        <g fill="none" stroke="#897d6c" strokeOpacity=".42" strokeWidth="2">
          <path d="M-20 220C84 190 112 234 196 206s125-92 220-56 135 78 214 52 112-16 170-60" />
          <path d="M-20 240C84 210 112 254 196 226s125-92 220-56 135 78 214 52 112-16 170-60" />
          <path d="M-20 260C84 230 112 274 196 246s125-92 220-56 135 78 214 52 112-16 170-60" />
        </g>
        <path d="M92 382C158 338 177 281 253 279s104 45 160-5 73-101 141-94 71 58 139 12" fill="none" stroke="#fff8e8" strokeWidth="9" strokeLinecap="round" strokeOpacity=".72" />
        <path d="M92 382C158 338 177 281 253 279s104 45 160-5 73-101 141-94 71 58 139 12" fill="none" stroke="url(#home-map-route)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 0" />
        <g fill="#bd7040" stroke="#fff8e8" strokeWidth="4">
          <circle cx="253" cy="279" r="8" />
          <circle cx="413" cy="274" r="8" />
          <circle cx="554" cy="180" r="8" />
        </g>
      </svg>
      <div className="home-map-preview__shade absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 sm:inset-x-5 sm:top-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-stone-800 shadow-sm backdrop-blur-sm dark:border-white/15 dark:bg-stone-950/75 dark:text-stone-100 sm:text-xs">
          <MapPinned className="size-3.5 text-orange-600 dark:text-orange-300" />
          Peta destinasi
        </span>
        <span className="rounded-full border border-white/50 bg-white/70 px-3 py-1.5 text-[10px] font-medium text-stone-700 shadow-sm backdrop-blur-sm dark:border-white/15 dark:bg-stone-950/70 dark:text-stone-200 sm:text-xs">
          Jawa Barat
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-5 pt-16 text-center sm:pb-7">
        <span className="text-[10px] font-bold tracking-[.18em] text-stone-700/80 uppercase dark:text-stone-200/80">
          Jelajah lebih jauh
        </span>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-stone-900 dark:text-white sm:text-xl">
          Temukan tujuan pendakian berikutnya.
        </h3>
        <button
          type="button"
          onClick={onActivate}
          disabled={isLoading}
          aria-live="polite"
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-stone-950 px-4 text-xs font-semibold text-white shadow-lg shadow-stone-950/20 transition hover:-translate-y-0.5 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800 disabled:cursor-wait disabled:opacity-90 dark:bg-orange-400 dark:text-stone-950 dark:hover:bg-orange-300"
        >
          {isLoading ? <><LoaderCircle className="size-3.5 animate-spin" /> Menyiapkan peta…</> : <>Tampilkan peta interaktif <MapPinned className="size-3.5" /></>}
        </button>
      </div>
    </div>
  )
}

export default function HomeDestinationsMap() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const activatedRef = useRef(false)
  const activeRequestRef = useRef<AbortController | null>(null)
  const [state, setState] = useState<MapState>("preview")
  const [mountains, setMountains] = useState<MapMountain[]>([])

  const loadMap = useCallback(async () => {
    if (activatedRef.current) return
    activatedRef.current = true
    setState("loading")

    const controller = new AbortController()
    activeRequestRef.current = controller

    try {
      const response = await requestHikingCatalog<MapMountain>(
        { resource: "map", limit: 50, offset: 0 },
        AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]),
      )
      if (controller.signal.aborted) return
      if (!Array.isArray(response.items)) {
        throw new Error("Data destinasi belum tersedia.")
      }
      setMountains(response.items)
      setState("ready")
    } catch {
      if (controller.signal.aborted) return
      activatedRef.current = false
      setState("error")
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null
      }
    }
  }, [])

  useEffect(() => () => activeRequestRef.current?.abort(), [])

  useEffect(() => {
    const target = stageRef.current
    if (!target || state !== "preview") return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          void loadMap()
        }
      },
      { rootMargin: "480px 0px", threshold: 0 },
    )
    observer.observe(target)

    return () => observer.disconnect()
  }, [loadMap, state])

  return (
    <div
      ref={stageRef}
      className="home-map-stage relative h-[360px] overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm sm:h-[420px] lg:h-[460px]"
      role="region"
      aria-label="Peta destinasi pendakian Jawa Barat"
      aria-busy={state === "loading"}
    >
      {state === "preview" || state === "loading" ? (
        <MapPreview onActivate={() => void loadMap()} isLoading={state === "loading"} />
      ) : null}

      {state === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/70 px-6 text-center">
          <span className="grid size-11 place-items-center rounded-2xl border border-border/70 bg-card text-primary">
            <MapPinned className="size-5" />
          </span>
          <p className="mt-3 text-sm font-semibold">Peta belum dapat dimuat.</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
            Periksa koneksi internet, lalu coba tampilkan peta kembali.
          </p>
          <button
            type="button"
            onClick={() => void loadMap()}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RefreshCw className="size-3.5" /> Coba lagi
          </button>
        </div>
      ) : null}

      {state === "ready" ? (
        <InteractiveHikingMap
          mountains={mountains}
          title="Peta persebaran destinasi pendakian Jawa Barat"
          frameClassName="h-full"
          className="home-map-live h-full rounded-none border-0 shadow-none"
        />
      ) : null}
    </div>
  )
}
