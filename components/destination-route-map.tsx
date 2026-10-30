"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Check, MapPin, Route, X } from "lucide-react"
import HikingMap from "@/components/hiking-map"
import type { HikingMountain } from "@/lib/hiking"

type MapMountain = Pick<HikingMountain, "mountain_id" | "slug" | "name" | "latitude" | "longitude">

type RouteTrail = {
  trail_id: string
  slug: string
  name: string
  basecamp_name?: string | null
  routeGeoJson: unknown | null
}

type Props = {
  mountain: MapMountain
  trails: RouteTrail[]
  location: string
}

function hasPublishedRoute(trail: RouteTrail) {
  return Boolean(trail.routeGeoJson)
}

export default function DestinationRouteMap({ mountain, trails, location }: Props) {
  const [selectedTrailSlug, setSelectedTrailSlug] = useState<string | null>(null)
  const selectedTrail = trails.find((trail) => trail.slug === selectedTrailSlug) ?? null
  const availableRoutes = trails.filter(hasPublishedRoute)

  function clearRoute() {
    setSelectedTrailSlug(null)
  }

  return (
    <div>
      <HikingMap
        mountains={[mountain]}
        routeGeoJson={selectedTrail && hasPublishedRoute(selectedTrail) ? selectedTrail.routeGeoJson : null}
        routeFocusKey={selectedTrail?.slug ?? null}
        title={"Peta " + mountain.name}
        frameClassName="h-[340px] sm:h-[440px] lg:h-[min(58vh,600px)]"
        caption={selectedTrail
          ? "Rute " + selectedTrail.name + " sedang ditampilkan pada peta."
          : "Pilih rute di bawah peta untuk menampilkan garis jalurnya."}
      />

      <section aria-labelledby="map-route-picker-title" className="mt-2.5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="map-route-picker-title" className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
            <Route className="size-3.5 text-primary" />
            Pilih jalur
          </h2>
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {availableRoutes.length} dari {trails.length} rute tersedia
          </span>
        </div>

        {trails.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs leading-5 text-muted-foreground">
            Belum ada pilihan jalur untuk destinasi ini.
          </p>
        ) : (
          <div
            role="group"
            aria-label="Pilih jalur untuk visualisasi peta"
            className="flex snap-x snap-mandatory items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {trails.map((trail) => {
              const routeAvailable = hasPublishedRoute(trail)
              const active = selectedTrailSlug === trail.slug

              return (
                <button
                  key={trail.trail_id}
                  type="button"
                  disabled={!routeAvailable}
                  aria-pressed={active}
                  title={routeAvailable ? "Tampilkan " + trail.name + " pada peta" : "Garis rute digital belum tersedia"}
                  onClick={() => setSelectedTrailSlug(trail.slug)}
                  className={[
                    "inline-flex h-11 max-w-[min(68vw,220px)] shrink-0 snap-start items-center gap-2 rounded-full border px-3.5 text-[11px] font-semibold transition duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2",
                    "active:scale-[0.98]",
                    active
                      ? "border-primary/40 bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                      : routeAvailable
                        ? "border-border/70 bg-card text-foreground hover:border-primary/35 hover:bg-primary/[0.05]"
                        : "cursor-not-allowed border-border/50 bg-muted/45 text-muted-foreground/70",
                  ].join(" ")}
                >
                  {active ? <Check className="size-3.5 shrink-0" /> : <Route className="size-3.5 shrink-0 text-primary" />}
                  <span className="truncate">{trail.name}</span>
                </button>
              )
            })}
          </div>
        )}

        {trails.length > 0 && availableRoutes.length < trails.length && (
          <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">
            Jalur yang belum memiliki garis rute digital belum dapat dipilih pada peta.
          </p>
        )}
      </section>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/50 pt-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{location}</span>
        </div>

        {selectedTrail && (
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={"/destinasi/" + mountain.slug + "/jalur/" + selectedTrail.slug}
              className="inline-flex min-h-8 items-center gap-1 text-[10px] font-semibold text-primary transition hover:underline"
            >
              Detail jalur <ArrowUpRight className="size-3" />
            </Link>
            <button
              type="button"
              onClick={clearRoute}
              className="inline-flex min-h-8 items-center gap-1 text-[10px] font-medium text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-3" /> Reset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
