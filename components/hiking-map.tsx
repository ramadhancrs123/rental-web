"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Feature, FeatureCollection, Geometry, Point } from "geojson"
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl"
import type { HikingCheckpoint, HikingMountain } from "@/lib/hiking"

type Props = {
  mountains?: Array<Pick<HikingMountain, "mountain_id" | "slug" | "name" | "latitude" | "longitude">>
  checkpoints?: HikingCheckpoint[]
  routeGeoJson?: unknown
  routeFocusKey?: string | null
  selectedMountainSlug?: string | null
  onMountainSelect?: (slug: string) => void
  className?: string
  frameClassName?: string
  title?: string
  caption?: string
}

type PointProperties = {
  id: string
  name: string
  slug?: string
  kind: "mountain" | "checkpoint"
  elevation?: number | null
}

type MapStatus = "loading" | "ready" | "degraded" | "failed"

const MAP_STYLE = "https://styles.maptoolkit.org/hiking.json"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function normalizeRoute(value: unknown): FeatureCollection<Geometry> {
  if (!isRecord(value)) return { type: "FeatureCollection", features: [] }
  if (value.type === "FeatureCollection" && Array.isArray(value.features)) {
    return value as unknown as FeatureCollection<Geometry>
  }
  if (value.type === "Feature") {
    return { type: "FeatureCollection", features: [value as unknown as Feature<Geometry>] }
  }
  if (value.type === "LineString" || value.type === "MultiLineString") {
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {}, geometry: value as unknown as Geometry }],
    }
  }
  return { type: "FeatureCollection", features: [] }
}

function collectCoordinates(value: unknown, output: number[][] = []): number[][] {
  if (!Array.isArray(value)) return output
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    const longitude = value[0]
    const latitude = value[1]
    if (Number.isFinite(longitude) && Number.isFinite(latitude) && Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90) {
      output.push([longitude, latitude])
    }
    return output
  }
  for (const item of value) collectCoordinates(item, output)
  return output
}

export default function HikingMap({
  mountains = [],
  checkpoints = [],
  routeGeoJson,
  routeFocusKey,
  selectedMountainSlug,
  onMountainSelect,
  className = "",
  frameClassName = "h-[380px] sm:h-[480px]",
  title = "Peta jalur pendakian",
  caption,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const onMountainSelectRef = useRef(onMountainSelect)
  const selectedMountainSlugRef = useRef(selectedMountainSlug)
  const routeFocusKeyRef = useRef(routeFocusKey)
  const [status, setStatus] = useState<MapStatus>("loading")
  const [mapIssue, setMapIssue] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    onMountainSelectRef.current = onMountainSelect
  }, [onMountainSelect])

  const mountainData = useMemo<FeatureCollection<Point, PointProperties>>(() => ({
    type: "FeatureCollection",
    features: mountains
      .filter((item) => item.latitude != null && item.longitude != null && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)))
      .map((item) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [Number(item.longitude), Number(item.latitude)] },
        properties: { id: item.mountain_id, name: item.name, slug: item.slug, kind: "mountain" as const },
      })),
  }), [mountains])

  const checkpointData = useMemo<FeatureCollection<Point, PointProperties>>(() => ({
    type: "FeatureCollection",
    features: checkpoints
      .filter((item) => item.latitude != null && item.longitude != null && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)))
      .map((item, index) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [Number(item.longitude), Number(item.latitude)] },
        properties: {
          id: item.checkpoint_id ?? item.code ?? String(index),
          name: item.name,
          kind: "checkpoint" as const,
          elevation: item.elevation_m ?? null,
        },
      })),
  }), [checkpoints])

  const routeData = useMemo(() => normalizeRoute(routeGeoJson), [routeGeoJson])
  const mapDataRef = useRef({ mountainData, checkpointData, routeData })

  useEffect(() => {
    mapDataRef.current = { mountainData, checkpointData, routeData }
  }, [mountainData, checkpointData, routeData])

  useEffect(() => {
    selectedMountainSlugRef.current = selectedMountainSlug
  }, [selectedMountainSlug])

  useEffect(() => {
    routeFocusKeyRef.current = routeFocusKey
  }, [routeFocusKey])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let disposed = false
    const updateSources = () => {
      if (disposed) return
      const mountainSource = map.getSource("hiking-mountains") as GeoJSONSource | undefined
      const checkpointSource = map.getSource("hiking-checkpoints") as GeoJSONSource | undefined
      const routeSource = map.getSource("hiking-route") as GeoJSONSource | undefined
      if (!mountainSource || !checkpointSource || !routeSource) return
      mountainSource.setData(mountainData)
      checkpointSource.setData(checkpointData)
      routeSource.setData(routeData)
      if (routeFocusKeyRef.current) {
        const coordinates = collectCoordinates(routeData.features.map((feature) =>
          feature.geometry && "coordinates" in feature.geometry ? feature.geometry.coordinates : [],
        ))
        if (coordinates.length > 1) {
          let minLng = Infinity
          let minLat = Infinity
          let maxLng = -Infinity
          let maxLat = -Infinity
          for (const [longitude, latitude] of coordinates) {
            minLng = Math.min(minLng, longitude)
            minLat = Math.min(minLat, latitude)
            maxLng = Math.max(maxLng, longitude)
            maxLat = Math.max(maxLat, latitude)
          }
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
            padding: 64,
            maxZoom: 14,
            duration: 650,
          })
        }
      } else if (routeData.features.length === 0 && mountainData.features[0]) {
        const [longitude, latitude] = mountainData.features[0].geometry.coordinates
        map.easeTo({ center: [longitude, latitude], zoom: 9, duration: 550 })
      }
    }
    const sourcesReady = Boolean(
      map.getSource("hiking-mountains")
      && map.getSource("hiking-checkpoints")
      && map.getSource("hiking-route"),
    )
    if (map.isStyleLoaded() && sourcesReady) updateSources()
    else map.once("load", updateSources)
    return () => {
      disposed = true
      map.off("load", updateSources)
    }
  }, [mountainData, checkpointData, routeData, routeFocusKey])

  useEffect(() => {
    let cancelled = false
    let initializing = false
    let map: MapLibreMap | null = null
    let loaded = false
    let resourceIssues = false
    let loadTimer: number | null = null
    let resizeFrame: number | null = null
    let observer: ResizeObserver | null = null

    const startMap = async () => {
      const container = containerRef.current
      if (cancelled || initializing || map || !container) return
      const bounds = container.getBoundingClientRect()
      if (bounds.width < 2 || bounds.height < 2) return

      initializing = true
      setStatus("loading")
      setMapIssue(null)

      try {
        const [maplibregl, logoModule] = await Promise.all([
          import("maplibre-gl"),
          import("@maptoolkit/maplibre-logo-control").catch(() => null),
        ])
        if (cancelled || !containerRef.current) {
          initializing = false
          return
        }

        // Resolve the dedicated ES module worker through Webpack's asset pipeline.
        maplibregl.setWorkerUrl(
          new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString(),
        )

        const currentData = mapDataRef.current
        const coordinates = [
          ...collectCoordinates(currentData.mountainData.features.map((item) => item.geometry.coordinates)),
          ...collectCoordinates(currentData.checkpointData.features.map((item) => item.geometry.coordinates)),
          ...collectCoordinates(currentData.routeData.features.map((item) => item.geometry && "coordinates" in item.geometry ? item.geometry.coordinates : [])),
        ]
        const center: [number, number] = coordinates[0]
          ? [coordinates[0][0], coordinates[0][1]]
          : [107.6, -7.0]

        map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center,
          zoom: coordinates.length ? 9 : 7,
          attributionControl: { compact: false, customAttribution: "© Maptoolkit © OpenStreetMap contributors" },
          cooperativeGestures: true,
        })
        mapRef.current = map

        const addControlSafely = (control: Parameters<MapLibreMap["addControl"]>[0], position: "top-right" | "bottom-left" | "bottom-right") => {
          try {
            map?.addControl(control, position)
          } catch (cause) {
            if (process.env.NODE_ENV !== "production") console.warn("[HikingMap] Control tidak tersedia pada browser ini.", cause)
          }
        }

        if (logoModule?.LogoControl) addControlSafely(new logoModule.LogoControl(), "bottom-left")
        addControlSafely(new maplibregl.NavigationControl({ showCompass: true }), "top-right")
        addControlSafely(new maplibregl.FullscreenControl(), "top-right")
        addControlSafely(new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }), "top-right")
        addControlSafely(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right")

        map.on("error", (event) => {
          if (cancelled) return
          resourceIssues = true
          const message = event.error instanceof Error ? event.error.message : "Map resource error"
          if (process.env.NODE_ENV !== "production") {
            console.warn("[HikingMap] Resource peta tidak berhasil dimuat.", {
              message,
              sourceId: "sourceId" in event ? event.sourceId : undefined,
            })
          }
          setMapIssue("Sebagian elemen peta belum dapat dimuat.")
          if (loaded) setStatus("degraded")
        })

        map.on("load", () => {
          if (cancelled || !map) return
          loaded = true
          if (loadTimer !== null) window.clearTimeout(loadTimer)
          setStatus(resourceIssues ? "degraded" : "ready")
          if (!resourceIssues) setMapIssue(null)

          try {
            const latestData = mapDataRef.current
            const latestCoordinates = [
              ...collectCoordinates(latestData.mountainData.features.map((item) => item.geometry.coordinates)),
              ...collectCoordinates(latestData.checkpointData.features.map((item) => item.geometry.coordinates)),
              ...collectCoordinates(latestData.routeData.features.map((item) => item.geometry && "coordinates" in item.geometry ? item.geometry.coordinates : [])),
            ]
            map.addSource("hiking-mountains", { type: "geojson", data: latestData.mountainData })
            map.addLayer({
              id: "hiking-mountain-circles",
              type: "circle",
              source: "hiking-mountains",
              paint: {
                "circle-radius": ["case", ["==", ["get", "slug"], selectedMountainSlugRef.current ?? ""], 9, 7],
                "circle-color": ["case", ["==", ["get", "slug"], selectedMountainSlugRef.current ?? ""], "#f97316", "#0f766e"],
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2,
              },
            })
            map.addLayer({
              id: "hiking-mountain-labels",
              type: "symbol",
              source: "hiking-mountains",
              layout: {
                "text-field": ["get", "name"],
                "text-size": 11,
                "text-offset": [0, 1.35],
                "text-anchor": "top",
                "text-allow-overlap": false,
              },
              paint: { "text-color": "#16352f", "text-halo-color": "#ffffff", "text-halo-width": 1.4 },
            })

            map.addSource("hiking-route", { type: "geojson", data: latestData.routeData })
            map.addLayer({
              id: "hiking-route-line",
              type: "line",
              source: "hiking-route",
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#f97316",
                "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2.5, 14, 5],
                "line-opacity": 0.95,
              },
            })

            map.addSource("hiking-checkpoints", { type: "geojson", data: latestData.checkpointData })
            map.addLayer({
              id: "hiking-checkpoint-circles",
              type: "circle",
              source: "hiking-checkpoints",
              paint: {
                "circle-radius": 5.5,
                "circle-color": "#2563eb",
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 1.5,
              },
            })
            map.addLayer({
              id: "hiking-checkpoint-labels",
              type: "symbol",
              source: "hiking-checkpoints",
              layout: {
                "text-field": ["get", "name"],
                "text-size": 10,
                "text-offset": [0, 1.25],
                "text-anchor": "top",
                "text-allow-overlap": false,
              },
              paint: { "text-color": "#1e3a8a", "text-halo-color": "#ffffff", "text-halo-width": 1.3 },
            })

            map.on("click", "hiking-mountain-circles", (event) => {
              const feature = event.features?.[0]
              const slug = feature?.properties?.slug
              if (typeof slug === "string" && slug.length > 0) {
                const select = onMountainSelectRef.current
                if (select) select(slug)
                else window.location.assign("/destinasi/" + encodeURIComponent(slug))
              }
            })
            map.on("mouseenter", "hiking-mountain-circles", () => {
              if (map) map.getCanvas().style.cursor = "pointer"
            })
            map.on("mouseleave", "hiking-mountain-circles", () => {
              if (map) map.getCanvas().style.cursor = ""
            })

            if (latestCoordinates.length > 1) {
              const bounds = new maplibregl.LngLatBounds()
              for (const coordinate of latestCoordinates) bounds.extend([coordinate[0], coordinate[1]])
              map.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 0 })
            }

            if (routeFocusKeyRef.current) {
              const routeCoordinates = collectCoordinates(latestData.routeData.features.map((feature) =>
                feature.geometry && "coordinates" in feature.geometry ? feature.geometry.coordinates : [],
              ))
              if (routeCoordinates.length > 1) {
                const routeBounds = new maplibregl.LngLatBounds()
                for (const coordinate of routeCoordinates) routeBounds.extend([coordinate[0], coordinate[1]])
                map.fitBounds(routeBounds, { padding: 64, maxZoom: 14, duration: 0 })
              }
            }
          } catch (cause) {
            if (process.env.NODE_ENV !== "production") console.error("[HikingMap] Gagal menyiapkan layer peta.", cause)
            setStatus("degraded")
            setMapIssue("Peta dasar tersedia, tetapi sebagian informasi lokasi belum dapat ditampilkan.")
          }
        })

        loadTimer = window.setTimeout(() => {
          if (!cancelled && !loaded) {
            setStatus("failed")
            setMapIssue("Peta belum dapat ditampilkan. Periksa koneksi dan dukungan browser, lalu coba lagi.")
          }
        }, 18000)
        initializing = false
      } catch (cause) {
        initializing = false
        if (cancelled) return
        if (process.env.NODE_ENV !== "production") console.error("[HikingMap] Inisialisasi MapLibre gagal.", cause)
        setStatus("failed")
        setMapIssue("Peta belum dapat ditampilkan pada perangkat ini. Periksa koneksi, lalu coba lagi.")
      }
    }

    const handleResize = () => {
      const container = containerRef.current
      if (cancelled || !container) return
      const bounds = container.getBoundingClientRect()
      if (bounds.width < 2 || bounds.height < 2) return

      if (!map) {
        void startMap()
        return
      }
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame)
      resizeFrame = window.requestAnimationFrame(() => {
        if (!cancelled && map) map.resize()
      })
    }

    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      observer = new ResizeObserver(handleResize)
      observer.observe(containerRef.current)
    } else {
      window.addEventListener("resize", handleResize)
    }
    window.requestAnimationFrame(handleResize)

    return () => {
      cancelled = true
      observer?.disconnect()
      window.removeEventListener("resize", handleResize)
      if (loadTimer !== null) window.clearTimeout(loadTimer)
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame)
      map?.remove()
      if (mapRef.current === map) mapRef.current = null
    }
  }, [retry])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const updateSelection = () => {
      if (!map.getLayer("hiking-mountain-circles")) return
      map.setPaintProperty("hiking-mountain-circles", "circle-radius", [
        "case",
        ["==", ["get", "slug"], selectedMountainSlugRef.current ?? ""],
        9,
        7,
      ])
      map.setPaintProperty("hiking-mountain-circles", "circle-color", [
        "case",
        ["==", ["get", "slug"], selectedMountainSlugRef.current ?? ""],
        "#f97316",
        "#0f766e",
      ])
    }
    if (map.isStyleLoaded()) updateSelection()
    else map.once("load", updateSelection)
  }, [selectedMountainSlug])

  const hasCoordinates = mountainData.features.length > 0 || checkpointData.features.length > 0 || routeData.features.length > 0

  return (
    <section className={"overflow-hidden rounded-3xl border border-border/60 bg-card " + className}>
      <div className={"relative bg-muted " + frameClassName}>
        <div ref={containerRef} className="absolute inset-0 size-full" aria-label={title} role="region" />
        {!hasCoordinates && (
          <div className="absolute left-3 top-3 z-10 max-w-[260px] rounded-xl border border-border/70 bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-sm">
            Lokasi dan garis jalur belum tersedia.
          </div>
        )}
        {status === "loading" && (
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-xl border border-border/70 bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm" role="status" aria-live="polite">
            Menyiapkan peta…
          </div>
        )}
        {status === "failed" && (
          <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-background/95 px-3 py-3 shadow-lg">
            <p className="min-w-0 flex-1 text-xs leading-5 text-muted-foreground">{mapIssue ?? "Peta belum dapat ditampilkan."}</p>
            <button type="button" onClick={() => { setMapIssue(null); setStatus("loading"); setRetry((value) => value + 1) }} className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
              Coba lagi
            </button>
          </div>
        )}
        {status === "degraded" && mapIssue && (
          <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-background/95 px-3 py-2.5 text-xs text-muted-foreground shadow-sm" role="status">
            <span className="min-w-0 flex-1">{mapIssue}</span>
            <button type="button" onClick={() => { setMapIssue(null); setStatus("loading"); setRetry((value) => value + 1) }} className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:bg-muted">
              Muat ulang
            </button>
          </div>
        )}
      </div>
      {caption && <p className="border-t border-border/60 px-4 py-3 text-[11px] leading-5 text-muted-foreground sm:px-5">{caption}</p>}
    </section>
  )
}
